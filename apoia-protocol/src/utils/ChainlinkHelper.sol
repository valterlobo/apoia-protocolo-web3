// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {AggregatorV3Interface} from "../interfaces/chainlink/AggregatorV3Interface.sol";

/// @title ChainlinkHelper
/// @notice Wrapper seguro para Price Feeds Chainlink.
///         Reverte em stale price, round incompleto ou resposta inválida.
library ChainlinkHelper {
    uint256 internal constant MAX_STALENESS = 48 hours;

    function getLatestPrice(AggregatorV3Interface feed) internal view returns (int256 price) {
        // slither-disable-next-line unused-return
        (uint80 roundId, int256 answer,, uint256 updatedAt, uint80 answeredInRound) = feed.latestRoundData();
        require(answer > 0, "Chainlink: preco invalido");
        require(updatedAt != 0, "Chainlink: round incompleto");
        require(answeredInRound >= roundId, "Chainlink: round obsoleto");
        require(block.timestamp - updatedAt <= MAX_STALENESS, "Chainlink: preco stale");
        price = answer;
    }

    /// @notice Converte wei para USD com 8 decimais (padrão Chainlink)
    function ethToUsd(uint256 ethAmount, AggregatorV3Interface feed) internal view returns (uint256) {
        int256 price = getLatestPrice(feed);
        return (ethAmount * uint256(price)) / 1e18;
    }
}
