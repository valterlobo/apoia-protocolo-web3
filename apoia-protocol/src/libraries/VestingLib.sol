// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title VestingLib
/// @notice Cálculo de vesting linear com cliff. Biblioteca pura (sem estado).
library VestingLib {
    /// @notice Calcula tokens liberáveis agora
    /// @param totalAmount   total no schedule
    /// @param released      já liberados anteriormente
    /// @param startTime     início do vesting (timestamp)
    /// @param cliff         duração do cliff em segundos
    /// @param duration      duração linear após o cliff em segundos
    function computeReleasable(uint256 totalAmount, uint256 released, uint64 startTime, uint32 cliff, uint32 duration)
        internal
        view
        returns (uint256)
    {
        uint256 cliffEnd = uint256(startTime) + uint256(cliff);
        if (block.timestamp < cliffEnd) return 0;

        uint256 vestingEnd = cliffEnd + uint256(duration);
        uint256 vested;

        if (block.timestamp >= vestingEnd) {
            vested = totalAmount;
        } else {
            uint256 elapsed = block.timestamp - cliffEnd;
            vested = (totalAmount * elapsed) / uint256(duration);
        }

        return vested > released ? vested - released : 0;
    }
}
