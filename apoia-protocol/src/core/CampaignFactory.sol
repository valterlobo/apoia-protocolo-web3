// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

import {Campaign} from "./Campaign.sol";
import {TierManager} from "./TierManager.sol";
import {IApoiaProtocol} from "../interfaces/IApoiaProtocol.sol";
import {ICampaign} from "../interfaces/ICampaign.sol";

/// @title CampaignFactory
/// @notice Fábrica que deploya pares Campaign + TierManager com parâmetros imutáveis.
///         Mantém índice global de campanhas. Imutável (non-upgradeable, sem proxy).
///
/// @dev Para cada chamada de createCampaign:
///      1. Calculamos o endereço que o TierManager terá via CREATE (RLP nonce).
///      2. Deployamos Campaign passando esse endereço antecipado.
///      3. Deployamos TierManager apontando para a Campaign criada.
///      4. Verificamos que o endereço previsto coincide com o real.
contract CampaignFactory is Ownable, ReentrancyGuard, IApoiaProtocol {
    // ── Events ───────────────────────────────────────────────────────────────
    event CampaignCreated(
        address indexed campaign, address indexed tierManager, address indexed creator, uint256 timestamp
    );
    event PlatformFeeUpdated(uint16 newFee);

    // ── Imutáveis ────────────────────────────────────────────────────────────
    address public immutable agtToken;
    address public immutable daoContract;
    address payable public immutable treasuryDAO;
    address public immutable defaultPriceFeed;

    // ── Ajustável pela DAO (onlyOwner após transferência de ownership) ────────
    uint16 public platformFee = 500; // 5 % (basis points)

    // ── Índice ───────────────────────────────────────────────────────────────
    address[] private _all;
    mapping(address => address[]) private _byOwner;

    // ── Constructor ──────────────────────────────────────────────────────────
    constructor(address _agt, address _dao, address payable _treasury, address _feed) Ownable(msg.sender) {
        require(_agt != address(0), "F: agt zero");
        require(_dao != address(0), "F: dao zero");
        require(_treasury != address(0), "F: treasury zero");
        require(_feed != address(0), "F: feed zero");
        agtToken = _agt;
        daoContract = _dao;
        treasuryDAO = _treasury;
        defaultPriceFeed = _feed;
    }

    // ── createCampaign ───────────────────────────────────────────────────────

    /// @notice Deploya Campaign + TierManager com parâmetros imutáveis.
    /// @param softCap   Meta mínima em USD (8 dec, padrão Chainlink)
    /// @param hardCap   Meta máxima em USD (8 dec)
    /// @param startTime Unix timestamp de início
    /// @param endTime   Unix timestamp de encerramento
    /// @param baseURI   URI base IPFS dos metadados NFT
    /// @param priceFeed Feed ETH/USD Chainlink (address(0) usa o default)
    /// @return campaign  endereço da Campaign deployada
    /// @return tierMgr   endereço do TierManager deployado
    function createCampaign(
        uint256 softCap,
        uint256 hardCap,
        uint64 startTime,
        uint64 endTime,
        string calldata baseURI,
        address priceFeed
    ) external nonReentrant returns (address campaign, address tierMgr) {
        address feed = priceFeed != address(0) ? priceFeed : defaultPriceFeed;

        // Nonce atual desta factory: número de contratos já criados por ela.
        // Cada chamada a createCampaign deploya 2 contratos:
        //   nonce N   → Campaign
        //   nonce N+1 → TierManager  ← este é o que precisamos prever
        uint64 nonce = uint64(_all.length * 2); // cada campanha incrementa o nonce por 2

        address predictedTM = _predictCreate(nonce + 1);

        Campaign c = new Campaign(
            payable(msg.sender),
            softCap,
            hardCap,
            startTime,
            endTime,
            predictedTM,
            agtToken,
            treasuryDAO,
            feed,
            platformFee,
            daoContract
        );

        TierManager tm = new TierManager(address(c), feed, baseURI);

        require(address(tm) == predictedTM, "F: predicao falhou");

        _all.push(address(c));
        _byOwner[msg.sender].push(address(c));

        emit CampaignCreated(address(c), address(tm), msg.sender, block.timestamp);
        return (address(c), address(tm));
    }

    // ── Admin ────────────────────────────────────────────────────────────────

    /// @notice Ajusta a taxa de plataforma (max 7 %). Controlado pela DAO via onlyOwner.
    function setPlatformFee(uint16 feeBps) external onlyOwner {
        require(feeBps <= 700, "F: fee > 7%");
        platformFee = feeBps;
        emit PlatformFeeUpdated(feeBps);
    }

    // ── IApoiaProtocol ───────────────────────────────────────────────────────

    // slither-disable-start calls-loop
    /// @inheritdoc IApoiaProtocol
    function getGlobalStats()
        external
        view
        override
        returns (uint256 total, uint256 raised, uint256 active, uint256 staked)
    {
        total = _all.length;
        // slither-disable-next-line calls-loop
        for (uint256 i; i < total;) {
            ICampaign c = ICampaign(_all[i]);
            raised += c.totalRaisedUSD();
            if (c.status() == 0) {
                unchecked {
                    active++;
                }
            }
            unchecked {
                i++;
            }
        }
        staked = 0; // consultado externamente via StakingAGT
    }

    /// @inheritdoc IApoiaProtocol
    function getCampaignsByStatus(uint256 code) external view override returns (address[] memory result) {
        uint256 n = 0;
        uint256 len = _all.length;
        // slither-disable-next-line calls-loop
        for (uint256 i; i < len;) {
            if (ICampaign(_all[i]).status() == uint8(code)) {
                unchecked {
                    n++;
                }
            }
            unchecked {
                i++;
            }
        }
        result = new address[](n);
        uint256 idx = 0;
        // slither-disable-next-line calls-loop
        for (uint256 i; i < len;) {
            if (ICampaign(_all[i]).status() == uint8(code)) {
                result[idx] = _all[i];
                unchecked {
                    idx++;
                }
            }
            unchecked {
                i++;
            }
        }
    }

    // slither-disable-end calls-loop

    /// @inheritdoc IApoiaProtocol
    function getCampaignsByOwner(address owner_) external view override returns (address[] memory) {
        return _byOwner[owner_];
    }

    function getAllCampaigns() external view returns (address[] memory) {
        return _all;
    }

    function totalCampaigns() external view returns (uint256) {
        return _all.length;
    }

    // ── Internal: previsão de endereço CREATE ───────────────────────────────

    /// @dev Calcula o endereço que será atribuído pelo EVM quando este contrato
    ///      deployar o seu k-ésimo contrato filho via CREATE (nonce = k).
    ///      Formula: keccak256(RLP(address, nonce))[12:]
    function _predictCreate(uint64 nonce) internal view returns (address) {
        bytes memory encoded;
        if (nonce == 0x00) {
            encoded = abi.encodePacked(bytes1(0xd6), bytes1(0x94), address(this), bytes1(0x80));
        } else if (nonce <= 0x7f) {
            encoded = abi.encodePacked(bytes1(0xd6), bytes1(0x94), address(this), uint8(nonce));
        } else if (nonce <= 0xff) {
            encoded = abi.encodePacked(bytes1(0xd7), bytes1(0x94), address(this), bytes1(0x81), uint8(nonce));
        } else {
            encoded = abi.encodePacked(bytes1(0xd8), bytes1(0x94), address(this), bytes1(0x82), uint16(nonce));
        }
        return address(uint160(uint256(keccak256(encoded))));
    }
}
