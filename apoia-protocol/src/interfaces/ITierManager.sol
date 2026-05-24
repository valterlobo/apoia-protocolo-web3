// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface ITierManager {
    enum PriceMode {
        STATIC,
        DYNAMIC_ETH
    }

    struct Tier {
        uint256 id;
        string name;
        uint256 minAmountUSD;
        uint256 maxSupply;
        uint256 minted;
        PriceMode priceMode;
        string metadataURI;
    }

    event TierCreated(uint256 indexed tierId, string name, uint256 minAmountUSD);
    event TierMinted(address indexed to, uint256 indexed tierId, uint256 amountUSD);
    event TierBurned(address indexed from, uint256 indexed tierId);

    function createTier(
        string calldata name,
        uint256 minAmountUSD,
        uint256 maxSupply,
        PriceMode priceMode,
        string calldata metadataURI
    ) external returns (uint256 tierId);
    function mintTier(address to, uint256 tierId, uint256 aportadoUSD) external;
    function burnTier(address from, uint256 tierId) external;
    function getTierMetadata(uint256 tierId) external view returns (Tier memory);
}
