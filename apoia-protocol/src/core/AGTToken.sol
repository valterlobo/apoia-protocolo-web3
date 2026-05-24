// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Votes} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import {EIP712} from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IAGTToken} from "../interfaces/IAGTToken.sol";
import {VestingLib} from "../libraries/VestingLib.sol";

/// @title AGTToken — Apoia Governance Token (ERC-20 + ERC20Votes + Vesting)
/// @notice Supply fixo: 100M AGT. Distribuição na construção:
///         40% rewardsPool | 25% treasury | 20% team | 10% staking | 5% community
///         Imutável — sem proxy, sem upgradeability.
contract AGTToken is ERC20, ERC20Votes, Ownable, ReentrancyGuard, IAGTToken {
    uint256 public constant TOTAL_SUPPLY = 100_000_000e18;
    uint32 public constant CLIFF_DURATION = 30 days;
    uint32 public constant VESTING_DURATION = 90 days;
    uint256 public constant BONUS_BPS = 1_000; // 10%

    mapping(address => bool) public minters;
    address public daoContract;

    event DAOContractUpdated(address indexed newDAO);

    uint256 private _nextScheduleId;
    mapping(address => mapping(uint256 => VestingSchedule)) private _schedules;
    mapping(uint256 => address) private _schedBeneficiary;

    modifier onlyMinter() {
        require(minters[msg.sender], "AGT: nao e minter");
        _;
    }
    modifier onlyDAO() {
        require(msg.sender == daoContract, "AGT: somente DAO");
        _;
    }

    constructor(address rewardsPool, address treasury, address teamWallet, address stakingPool, address communityPool)
        ERC20("Apoia Governance Token", "AGT")
        EIP712("Apoia Governance Token", "1")
        Ownable(msg.sender)
    {
        require(rewardsPool != address(0), "AGT: rewardsPool zero");
        require(treasury != address(0), "AGT: treasury zero");
        require(teamWallet != address(0), "AGT: team zero");
        require(stakingPool != address(0), "AGT: staking zero");
        require(communityPool != address(0), "AGT: community zero");
        _mint(rewardsPool, (TOTAL_SUPPLY * 40) / 100);
        _mint(treasury, (TOTAL_SUPPLY * 25) / 100);
        _mint(teamWallet, (TOTAL_SUPPLY * 20) / 100);
        _mint(stakingPool, (TOTAL_SUPPLY * 10) / 100);
        _mint(communityPool, (TOTAL_SUPPLY * 5) / 100);
    }

    function addMinter(address m) external onlyOwner {
        require(m != address(0));
        minters[m] = true;
    }

    function removeMinter(address m) external onlyOwner {
        minters[m] = false;
    }

    function setDAOContract(address d) external onlyOwner {
        require(d != address(0));
        daoContract = d;
        emit DAOContractUpdated(d);
    }

    function createVestingSchedule(address beneficiary, uint256 amount, bool isRevocable)
        external
        override
        onlyMinter
        nonReentrant
        returns (uint256 scheduleId)
    {
        require(beneficiary != address(0), "AGT: beneficiary zero");
        require(amount > 0, "AGT: amount zero");
        require(balanceOf(msg.sender) >= amount, "AGT: saldo insuficiente");
        scheduleId = _nextScheduleId++;
        _schedules[beneficiary][scheduleId] = VestingSchedule({
            totalAmount: amount,
            releasedAmount: 0,
            startTime: uint64(block.timestamp),
            cliffDuration: CLIFF_DURATION,
            vestingDuration: VESTING_DURATION,
            isRevocable: isRevocable,
            revoked: false
        });
        _schedBeneficiary[scheduleId] = beneficiary;
        _transfer(msg.sender, address(this), amount);
        emit VestingScheduleCreated(beneficiary, amount, scheduleId);
    }

    function releaseVestedTokens(uint256 scheduleId) external override nonReentrant {
        address ben = _schedBeneficiary[scheduleId];
        require(ben == msg.sender, "AGT: nao e o beneficiario");
        VestingSchedule storage s = _schedules[ben][scheduleId];
        require(!s.revoked, "AGT: revogado");
        uint256 rel = VestingLib.computeReleasable(
            s.totalAmount, s.releasedAmount, s.startTime, s.cliffDuration, s.vestingDuration
        );
        require(rel > 0, "AGT: nada a liberar");
        s.releasedAmount += rel;
        _transfer(address(this), ben, rel);
        emit TokensReleased(ben, rel, scheduleId);
    }

    function revokeVesting(address beneficiary, uint256 scheduleId) external override onlyOwner nonReentrant {
        VestingSchedule storage s = _schedules[beneficiary][scheduleId];
        require(s.isRevocable && !s.revoked, "AGT: nao revogavel ou ja revogado");
        uint256 rel = VestingLib.computeReleasable(
            s.totalAmount, s.releasedAmount, s.startTime, s.cliffDuration, s.vestingDuration
        );
        uint256 ret = s.totalAmount - s.releasedAmount - rel;
        s.revoked = true;
        if (rel > 0) {
            s.releasedAmount += rel;
            _transfer(address(this), beneficiary, rel);
        }
        if (ret > 0) _transfer(address(this), owner(), ret);
        emit VestingRevoked(beneficiary, scheduleId, ret);
    }

    function grantDAOBonus(address beneficiary, uint256 scheduleId) external override onlyDAO nonReentrant {
        VestingSchedule storage s = _schedules[beneficiary][scheduleId];
        require(!s.revoked, "AGT: revogado");
        uint256 bonus = (s.totalAmount * BONUS_BPS) / 10_000;
        require(bonus > 0 && balanceOf(owner()) >= bonus, "AGT: bonus invalido");
        _transfer(owner(), beneficiary, bonus);
        emit BonusGranted(beneficiary, bonus);
    }

    function releasableAmount(address beneficiary, uint256 scheduleId) external view override returns (uint256) {
        VestingSchedule storage s = _schedules[beneficiary][scheduleId];
        if (s.revoked) return 0;
        return
            VestingLib.computeReleasable(
                s.totalAmount, s.releasedAmount, s.startTime, s.cliffDuration, s.vestingDuration
            );
    }

    function getVestingSchedule(address beneficiary, uint256 scheduleId)
        external
        view
        returns (VestingSchedule memory)
    {
        return _schedules[beneficiary][scheduleId];
    }

    // ERC20Votes override obrigatório (OZ 5.x)
    function _update(address from, address to, uint256 value) internal override(ERC20, ERC20Votes) {
        super._update(from, to, value);
    }
}
