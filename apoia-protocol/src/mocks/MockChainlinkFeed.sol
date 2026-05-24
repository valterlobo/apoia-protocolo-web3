// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {AggregatorV3Interface} from "../interfaces/chainlink/AggregatorV3Interface.sol";

/// @title MockChainlinkFeed
/// @notice Mock controlável do feed ETH/USD para testes Foundry.
contract MockChainlinkFeed is AggregatorV3Interface {
    int256 private _price;
    uint256 private _updatedAt;
    uint80 private _roundId;
    uint8 private immutable _dec;

    constructor(int256 initialPrice, uint8 decimals_) {
        _price = initialPrice;
        _updatedAt = block.timestamp;
        _roundId = 1;
        _dec = decimals_;
    }

    function setPrice(int256 p) external {
        _price = p;
        _updatedAt = block.timestamp;
        _roundId++;
    }

    function setUpdatedAt(uint256 ts) external {
        _updatedAt = ts;
    }

    function latestRoundData() external view override returns (uint80, int256, uint256, uint256, uint80) {
        return (_roundId, _price, _updatedAt, _updatedAt, _roundId);
    }

    function getRoundData(uint80 r) external view override returns (uint80, int256, uint256, uint256, uint80) {
        return (r, _price, _updatedAt, _updatedAt, r);
    }

    function decimals() external view override returns (uint8) {
        return _dec;
    }

    function description() external pure override returns (string memory) {
        return "ETH/USD Mock";
    }

    function version() external pure override returns (uint256) {
        return 3;
    }
}
