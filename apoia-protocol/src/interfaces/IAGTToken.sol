// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IAGTToken {
    struct VestingSchedule {
        uint256 totalAmount;
        uint256 releasedAmount;
        uint64 startTime;
        uint32 cliffDuration;
        uint32 vestingDuration;
        bool isRevocable;
        bool revoked;
    }

    event VestingScheduleCreated(address indexed beneficiary, uint256 amount, uint256 scheduleId);
    event TokensReleased(address indexed beneficiary, uint256 amount, uint256 scheduleId);
    event VestingRevoked(address indexed beneficiary, uint256 scheduleId, uint256 returned);
    event BonusGranted(address indexed beneficiary, uint256 bonus);

    function createVestingSchedule(address beneficiary, uint256 amount, bool isRevocable)
        external
        returns (uint256 scheduleId);
    function releaseVestedTokens(uint256 scheduleId) external;
    function revokeVesting(address beneficiary, uint256 scheduleId) external;
    function grantDAOBonus(address beneficiary, uint256 scheduleId) external;
    function releasableAmount(address beneficiary, uint256 scheduleId) external view returns (uint256);
}
