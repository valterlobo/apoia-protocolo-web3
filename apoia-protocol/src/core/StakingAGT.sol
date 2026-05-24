// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {DAOMath} from "../libraries/DAOMath.sol";

/// @title StakingAGT — Staking de $AGT com lock e multiplicadores de voto
/// @notice Lock periods: 3m=1.5x | 6m=2x | 12m=3x. APY base 5%.
///         Imutável (non-upgradeable).
contract StakingAGT is Ownable, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    uint256 public constant THREE_MONTHS = 90 days;
    uint256 public constant SIX_MONTHS = 180 days;
    uint256 public constant TWELVE_MONTHS = 365 days;
    uint256 public constant BASE_APY_BPS = 500;
    uint256 public constant BASIS_POINTS = 10_000;

    struct StakePosition {
        uint256 amount;
        uint64 lockStart;
        uint64 lockEnd;
        uint64 lockDuration;
        bool withdrawn;
    }

    IERC20 public immutable agtToken;
    address public rewardsPool;

    uint256 private _nextPositionId;
    mapping(uint256 => StakePosition) private _positions;
    mapping(address => uint256[]) private _holderPositions;
    mapping(uint256 => address) private _positionHolder;
    uint256 public totalStaked;

    event Staked(address indexed user, uint256 positionId, uint256 amount, uint64 lockEnd);
    event Unstaked(address indexed user, uint256 positionId, uint256 amount, uint256 reward);
    event RewardsPoolUpdated(address indexed newPool);

    constructor(address _agtToken, address _rewardsPool) Ownable(msg.sender) {
        require(_agtToken != address(0), "Staking: token zero");
        require(_rewardsPool != address(0), "Staking: pool zero");
        agtToken = IERC20(_agtToken);
        rewardsPool = _rewardsPool;
        _nextPositionId = 1;
    }

    function stake(uint256 amount, uint256 lockDuration)
        external
        nonReentrant
        whenNotPaused
        returns (uint256 positionId)
    {
        require(amount > 0, "Staking: amount zero");
        require(
            lockDuration == THREE_MONTHS || lockDuration == SIX_MONTHS || lockDuration == TWELVE_MONTHS,
            "Staking: duracao invalida"
        );
        positionId = _nextPositionId++;
        uint64 ls = uint64(block.timestamp);
        uint64 le = uint64(block.timestamp + lockDuration);
        _positions[positionId] = StakePosition({
            amount: amount, lockStart: ls, lockEnd: le, lockDuration: uint64(lockDuration), withdrawn: false
        });
        _holderPositions[msg.sender].push(positionId);
        _positionHolder[positionId] = msg.sender;
        unchecked {
            totalStaked += amount;
        }
        agtToken.safeTransferFrom(msg.sender, address(this), amount);
        emit Staked(msg.sender, positionId, amount, le);
    }

    function unstake(uint256 positionId) external nonReentrant whenNotPaused {
        require(_positionHolder[positionId] == msg.sender, "Staking: nao e o dono");
        StakePosition storage pos = _positions[positionId];
        require(!pos.withdrawn, "Staking: ja resgatado");
        require(block.timestamp >= pos.lockEnd, "Staking: lock ativo");
        pos.withdrawn = true;
        totalStaked -= pos.amount;
        uint256 reward = (pos.amount * BASE_APY_BPS * pos.lockDuration) / (BASIS_POINTS * 365 days);
        agtToken.safeTransfer(msg.sender, pos.amount);
        if (reward > 0 && agtToken.allowance(rewardsPool, address(this)) >= reward) {
            // slither-disable-next-line arbitrary-send-erc20
            agtToken.safeTransferFrom(rewardsPool, msg.sender, reward);
        }
        emit Unstaked(msg.sender, positionId, pos.amount, reward);
    }

    function getVotingPower(address user) external view returns (uint256 power) {
        uint256[] storage ids = _holderPositions[user];
        for (uint256 i; i < ids.length;) {
            StakePosition storage pos = _positions[ids[i]];
            if (!pos.withdrawn && block.timestamp < pos.lockEnd) {
                power += DAOMath.votingPower(pos.amount, pos.lockEnd - block.timestamp);
            }
            unchecked {
                i++;
            }
        }
    }

    function getPosition(uint256 id) external view returns (StakePosition memory) {
        return _positions[id];
    }

    function getHolderPositions(address u) external view returns (uint256[] memory) {
        return _holderPositions[u];
    }

    function setRewardsPool(address p) external onlyOwner {
        require(p != address(0));
        rewardsPool = p;
        emit RewardsPoolUpdated(p);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }
}
