// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface ICampaign {
    struct CampaignConfig {
        address payable proponente;
        uint256 softCap;
        uint256 hardCap;
        uint64 startTime;
        uint64 endTime;
        address tierManager;
        address agtToken;
        address treasuryDAO;
        address priceFeedETHUSD;
        uint16 platformFee;
    }

    event Contributed(address indexed apoiador, uint256 ethAmount, uint256 usdValue, uint256 tierId);
    event WithdrawalRequested(address indexed proponente, uint256 amount);
    event WithdrawalExecuted(address indexed proponente, uint256 netAmount, uint256 feeAmount);
    event RefundProcessed(address indexed apoiador, uint256 amount);
    event StatusChanged(uint8 indexed oldStatus, uint8 indexed newStatus);

    function contribute(uint256 tierId) external payable;
    function requestWithdrawal() external;
    function executeWithdrawal() external;
    function claimRefund() external;
    function createTier(string calldata name, uint256 minAmountUSD, uint256 maxSupply, uint8 priceMode, string calldata metadataURI) external returns (uint256);
    function config() external view returns (CampaignConfig memory);
    function totalRaisedUSD() external view returns (uint256);
    function balance() external view returns (uint256);
    function status() external view returns (uint8);
    function contributions(address apoiador) external view returns (uint256);
}
