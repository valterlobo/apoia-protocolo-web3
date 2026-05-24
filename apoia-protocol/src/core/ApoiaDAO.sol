// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {StakingAGT} from "./StakingAGT.sol";
import {DAOMath} from "../libraries/DAOMath.sol";

/// @title ApoiaDAO — Governança comunitária com quórum duplo e timelock
/// @notice Quórum: 4% do supply em tokens + 50 wallets únicas.
///         Timelock: 2 dias entre aprovação e execução.
///         Imutável (non-upgradeable).
contract ApoiaDAO is Ownable, ReentrancyGuard {
    enum ProposalType {
        CAMPAIGN_AUDIT,
        UPGRADE_PROTOCOL,
        TREASURY_ALLOCATION,
        FEE_ADJUSTMENT
    }

    enum ProposalStatus {
        PENDING,
        ACTIVE,
        SUCCEEDED,
        DEFEATED,
        QUEUED,
        EXECUTED,
        CANCELLED
    }

    struct Proposal {
        uint256 id;
        address proposer;
        ProposalType pType;
        address targetContract;
        bytes callData;
        uint64 startTime;
        uint64 endTime;
        uint64 executionTime;
        uint256 forVotes;
        uint256 againstVotes;
        uint256 uniqueVoters;
        ProposalStatus status;
        bool executed;
    }

    uint256 public constant VOTING_PERIOD = 3 days;
    uint256 public constant TIMELOCK_DELAY = 2 days;
    uint256 public constant QUORUM_BPS = 400;
    uint256 public constant MIN_VOTERS = 50;
    uint256 public constant PROPOSAL_THRESHOLD_BPS = 100;

    IERC20 public immutable agtToken;
    StakingAGT public immutable staking;

    uint256 private _nextProposalId;
    mapping(uint256 => Proposal) private _proposals;
    mapping(uint256 => mapping(address => bool)) public hasVoted;
    mapping(uint256 => mapping(address => uint256)) public voteWeights;

    event ProposalCreated(
        uint256 indexed id, address indexed proposer, ProposalType pType, address target, uint64 endTime
    );
    event VoteCast(address indexed voter, uint256 indexed id, bool support, uint256 weight);
    event ProposalQueued(uint256 indexed id, uint64 executionTime);
    event ProposalExecuted(uint256 indexed id);
    event ProposalCancelled(uint256 indexed id);

    constructor(address _agtToken, address _staking) Ownable(msg.sender) {
        require(_agtToken != address(0) && _staking != address(0), "DAO: zero address");
        agtToken = IERC20(_agtToken);
        staking = StakingAGT(_staking);
        _nextProposalId = 1;
    }

    function propose(
        ProposalType pType,
        address targetContract,
        bytes calldata callData,
        string calldata /* description */
    )
        external
        returns (uint256 pid)
    {
        uint256 vp = staking.getVotingPower(msg.sender);
        uint256 thr = (agtToken.totalSupply() * PROPOSAL_THRESHOLD_BPS) / 10_000;
        require(vp >= thr, "DAO: poder insuficiente");
        pid = _nextProposalId++;
        uint64 now_ = uint64(block.timestamp);
        _proposals[pid] = Proposal({
            id: pid,
            proposer: msg.sender,
            pType: pType,
            targetContract: targetContract,
            callData: callData,
            startTime: now_,
            endTime: now_ + uint64(VOTING_PERIOD),
            executionTime: now_ + uint64(VOTING_PERIOD) + uint64(TIMELOCK_DELAY),
            forVotes: 0,
            againstVotes: 0,
            uniqueVoters: 0,
            status: ProposalStatus.ACTIVE,
            executed: false
        });
        emit ProposalCreated(pid, msg.sender, pType, targetContract, now_ + uint64(VOTING_PERIOD));
    }

    function castVote(uint256 pid, bool support) external nonReentrant {
        Proposal storage p = _proposals[pid];
        require(p.status == ProposalStatus.ACTIVE, "DAO: nao ativa");
        require(block.timestamp <= p.endTime, "DAO: encerrada");
        require(!hasVoted[pid][msg.sender], "DAO: ja votou");
        uint256 w = staking.getVotingPower(msg.sender);
        require(w > 0, "DAO: sem poder de voto");
        hasVoted[pid][msg.sender] = true;
        voteWeights[pid][msg.sender] = w;
        unchecked {
            if (support) p.forVotes += w;
            else p.againstVotes += w;
            p.uniqueVoters++;
        }
        emit VoteCast(msg.sender, pid, support, w);
    }

    function finalizeVoting(uint256 pid) external {
        Proposal storage p = _proposals[pid];
        require(p.status == ProposalStatus.ACTIVE, "DAO: nao ativa");
        require(block.timestamp > p.endTime, "DAO: votacao em curso");
        bool quorum = DAOMath.hasQuorum(p.forVotes, agtToken.totalSupply(), p.uniqueVoters, QUORUM_BPS, MIN_VOTERS);
        if (quorum && p.forVotes > p.againstVotes) {
            p.status = ProposalStatus.QUEUED;
            emit ProposalQueued(pid, p.executionTime);
        } else {
            p.status = ProposalStatus.DEFEATED;
        }
    }

    function executeProposal(uint256 pid) external nonReentrant {
        Proposal storage p = _proposals[pid];
        require(p.status == ProposalStatus.QUEUED, "DAO: nao na fila");
        require(block.timestamp >= p.executionTime, "DAO: timelock ativo");
        require(!p.executed, "DAO: ja executado");
        p.executed = true;
        p.status = ProposalStatus.EXECUTED;
        (bool ok,) = p.targetContract.call(p.callData);
        require(ok, "DAO: execucao falhou");
        emit ProposalExecuted(pid);
    }

    function cancelProposal(uint256 pid) external {
        Proposal storage p = _proposals[pid];
        require(p.proposer == msg.sender || msg.sender == owner(), "DAO: sem permissao");
        require(p.status == ProposalStatus.ACTIVE, "DAO: nao cancelavel");
        p.status = ProposalStatus.CANCELLED;
        emit ProposalCancelled(pid);
    }

    function getProposal(uint256 pid) external view returns (Proposal memory) {
        return _proposals[pid];
    }

    function proposalCount() external view returns (uint256) {
        return _nextProposalId - 1;
    }
}
