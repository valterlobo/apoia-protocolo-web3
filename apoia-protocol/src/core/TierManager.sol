// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC1155} from "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ITierManager} from "../interfaces/ITierManager.sol";
import {ChainlinkHelper} from "../utils/ChainlinkHelper.sol";
import {AggregatorV3Interface} from "../interfaces/chainlink/AggregatorV3Interface.sol";

/// @title TierManager — NFTs ERC-1155 de recibo por tier de campanha
/// @notice Um TierManager por campanha. Único minter/burner: o contrato Campaign.
///         Imutável (non-upgradeable).
contract TierManager is ERC1155, Ownable, ITierManager {
    address public immutable campaign;
    AggregatorV3Interface public immutable priceFeed;

    mapping(uint256 => Tier) private _tiers;
    uint256 private _nextTierId;
    string private contract_uri; 


    modifier onlyCampaign() {
        require(msg.sender == campaign, "TM: somente Campaign");
        _;
    }

    constructor(address _campaign, address _priceFeed, string memory _contract_uri) ERC1155('') Ownable(_campaign) {
        require(_campaign != address(0), "TM: campaign zero");
        require(_priceFeed != address(0), "TM: priceFeed zero");
        campaign = _campaign;
        priceFeed = AggregatorV3Interface(_priceFeed);
        _nextTierId = 1;
        contract_uri = _contract_uri;
    }

    function createTier(
        string calldata name,
        uint256 minAmountUSD,
        uint256 maxSupply,
        PriceMode priceMode,
        string calldata metadataURI
    ) external override onlyCampaign returns (uint256 tierId) {
        require(bytes(name).length > 0, "TM: nome vazio");
        require(minAmountUSD > 0, "TM: minAmount zero");
        tierId = _nextTierId++;
        _tiers[tierId] = Tier({
            id: tierId,
            name: name,
            minAmountUSD: minAmountUSD,
            maxSupply: maxSupply,
            minted: 0,
            priceMode: priceMode,
            metadataURI: metadataURI
        });
        emit TierCreated(tierId, name, minAmountUSD);
    }

    function mintTier(address to, uint256 tierId, uint256 aportadoUSD) external override onlyCampaign {
        Tier storage t = _tiers[tierId];
        require(t.id == tierId, "TM: tier inexistente");
        require(aportadoUSD >= t.minAmountUSD, "TM: aporte abaixo do minimo");
        require(t.maxSupply == 0 || t.minted < t.maxSupply, "TM: supply esgotado");
        require(balanceOf(to, tierId) == 0, "TM: ja possui este tier");
        unchecked {
            t.minted++;
        }
        emit TierMinted(to, tierId, aportadoUSD);
        _mint(to, tierId, 1, "");
    }

    function burnTier(address from, uint256 tierId) external override onlyCampaign {
        require(balanceOf(from, tierId) > 0, "TM: nao possui NFT");
        unchecked {
            _tiers[tierId].minted--;
        }
        emit TierBurned(from, tierId);
        _burn(from, tierId, 1);
    }

    function getTierMetadata(uint256 tierId) external view override returns (Tier memory) {
        require(_tiers[tierId].id == tierId, "TM: tier inexistente");
        return _tiers[tierId];
    }

    function totalTiers() external view returns (uint256) {
        return _nextTierId - 1;
    }

    function convertEthToUsd(uint256 ethAmount) external view returns (uint256) {
        return ChainlinkHelper.ethToUsd(ethAmount, priceFeed);
    }

    function uri(uint256 tierId) public view override returns (string memory) {
        if (bytes(_tiers[tierId].metadataURI).length > 0) return _tiers[tierId].metadataURI;
        return super.uri(tierId);
    }
}
