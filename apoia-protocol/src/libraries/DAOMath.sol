// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title DAOMath
/// @notice Funções puras para cálculo de taxas, poder de voto e quórum.
library DAOMath {
    uint256 internal constant BASIS_POINTS = 10_000;

    /// @notice Aplica taxa em basis points sobre um montante
    /// @return fee  valor da taxa
    /// @return net  valor líquido (amount - fee)
    function applyFee(uint256 amount, uint256 feeBps) internal pure returns (uint256 fee, uint256 net) {
        fee = (amount * feeBps) / BASIS_POINTS;
        net = amount - fee;
    }

    /// @notice Poder de voto ponderado pelo multiplicador de lock
    ///         3m=1.5x  |  6m=2x  |  12m=3x
    function votingPower(uint256 baseTokens, uint256 lockSecondsRemaining) internal pure returns (uint256) {
        uint256 multiplierX10;
        if (lockSecondsRemaining >= 365 days) multiplierX10 = 30;
        else if (lockSecondsRemaining >= 180 days) multiplierX10 = 20;
        else if (lockSecondsRemaining >= 90 days) multiplierX10 = 15;
        else multiplierX10 = 10;
        return (baseTokens * multiplierX10) / 10;
    }

    /// @notice Verifica quórum duplo: tokens mínimos E wallets mínimas
    function hasQuorum(
        uint256 forVotes,
        uint256 totalSupply,
        uint256 uniqueVoters,
        uint256 minTokenBps,
        uint256 minVoters
    ) internal pure returns (bool) {
        uint256 threshold = (totalSupply * minTokenBps) / BASIS_POINTS;
        return forVotes >= threshold && uniqueVoters >= minVoters;
    }
}
