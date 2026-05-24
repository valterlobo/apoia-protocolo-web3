// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";

import {ICampaign} from "../interfaces/ICampaign.sol";
import {ITierManager} from "../interfaces/ITierManager.sol";
import {IAGTToken} from "../interfaces/IAGTToken.sol";
import {ChainlinkHelper} from "../utils/ChainlinkHelper.sol";
import {DAOMath} from "../libraries/DAOMath.sol";
import {AggregatorV3Interface} from "../interfaces/chainlink/AggregatorV3Interface.sol";

/// @title Campaign
/// @notice Escrow trustless para cada campanha do Apoia Protocol.
///         Recebe ETH, trava, distribui NFTs + cashback $AGT e executa
///         saques/reembolsos de forma autônoma após decisão da ApoiaDAO.
///
/// Status:
///   0 ACTIVE    → captando aportes
///   1 SUCCEEDED → prazo encerrado, soft cap atingido, aguardando DAO
///   2 APPROVED  → aprovada pela DAO, saque disponível
///   3 FAILED    → soft cap não atingido, reembolsos liberados
///   4 REJECTED  → reprovada pela DAO, reembolsos liberados
///   5 WITHDRAWN → proponente sacou
///
/// Segurança: ReentrancyGuard + Pausable + CEI pattern + pull-over-push.
/// Imutável: sem proxy, sem upgradeability.
contract Campaign is ReentrancyGuard, Pausable, ICampaign {
    // ── Status constants ────────────────────────────────────────────────────
    uint8 private constant S_ACTIVE = 0;
    uint8 private constant S_SUCCEEDED = 1;
    uint8 private constant S_APPROVED = 2;
    uint8 private constant S_FAILED = 3;
    uint8 private constant S_REJECTED = 4;
    uint8 private constant S_WITHDRAWN = 5;

    // ── Imutáveis ───────────────────────────────────────────────────────────
    address payable public immutable proponente;
    uint256 public immutable softCap; // USD, 8 dec (padrão Chainlink)
    uint256 public immutable hardCap; // USD, 8 dec
    uint64 public immutable startTime; // Unix timestamp
    uint64 public immutable endTime; // Unix timestamp
    address public immutable tierManagerAddr;
    address public immutable agtTokenAddr;
    address payable public immutable treasuryDAO;
    address public immutable priceFeedAddr;
    uint16 public immutable platformFee; // basis points (500 = 5 %)
    address public immutable daoContract;

    /// @dev Após este offset (60 dias) fundos não reclamados são liquidados
    uint64 public constant REFUND_DEADLINE_OFFSET = 60 days;

    // ── Estado mutável ──────────────────────────────────────────────────────
    uint8 private _status;
    uint256 private _totalRaisedUSD;

    /// @notice ETH depositado por cada apoiador (pull pattern para refund)
    mapping(address => uint256) public contributions;
    /// @notice Tier escolhido por cada apoiador (necessário para burn no refund)
    mapping(address => uint256) public apoiadorTier;

    // ── Evento adicional ────────────────────────────────────────────────────
    event InactiveExpired(uint256 toProponente, uint256 toTreasury, uint256 timestamp);

    // ── Modifiers ───────────────────────────────────────────────────────────
    modifier onlyActive() {
        require(_status == S_ACTIVE, "C: nao ativa");
        require(block.timestamp >= startTime, "C: nao iniciada");
        require(block.timestamp <= endTime, "C: prazo encerrado");
        _;
    }
    modifier onlyApproved() {
        require(_status == S_APPROVED, "C: nao aprovada");
        _;
    }
    modifier onlyFailed() {
        require(_status == S_FAILED || _status == S_REJECTED, "C: nao falhou");
        _;
    }
    modifier onlyDAO() {
        require(msg.sender == daoContract, "C: somente DAO");
        _;
    }
    modifier onlyProponente() {
        require(msg.sender == proponente, "C: somente proponente");
        _;
    }

    // ── Constructor ─────────────────────────────────────────────────────────
    constructor(
        address payable _proponente,
        uint256 _softCap,
        uint256 _hardCap,
        uint64 _startTime,
        uint64 _endTime,
        address _tierManager,
        address _agtToken,
        address payable _treasuryDAO,
        address _priceFeed,
        uint16 _platformFee,
        address _daoContract
    ) {
        require(_proponente != address(0), "C: proponente zero");
        require(_softCap > 0, "C: softCap zero");
        require(_hardCap > _softCap, "C: hardCap <= softCap");
        require(_endTime > _startTime, "C: endTime invalido");
        require(_endTime > block.timestamp, "C: endTime passado");
        require(_tierManager != address(0), "C: tierManager zero");
        require(_agtToken != address(0), "C: agtToken zero");
        require(_treasuryDAO != address(0), "C: treasury zero");
        require(_priceFeed != address(0), "C: priceFeed zero");
        require(_platformFee <= 700, "C: fee > 7%");
        require(_daoContract != address(0), "C: dao zero");

        proponente = _proponente;
        softCap = _softCap;
        hardCap = _hardCap;
        startTime = _startTime;
        endTime = _endTime;
        tierManagerAddr = _tierManager;
        agtTokenAddr = _agtToken;
        treasuryDAO = _treasuryDAO;
        priceFeedAddr = _priceFeed;
        platformFee = _platformFee;
        daoContract = _daoContract;
        _status = S_ACTIVE;

        emit StatusChanged(S_ACTIVE, S_ACTIVE);
    }

    // ── Contribuição ────────────────────────────────────────────────────────

    /// @inheritdoc ICampaign
    /// @dev Fluxo: oráculo → hard cap check → registrar ETH → mint NFT → criar vesting AGT
    function contribute(uint256 tierId) external payable override onlyActive nonReentrant whenNotPaused {
        require(msg.value > 0, "C: aporte zero");

        uint256 usdValue = ChainlinkHelper.ethToUsd(msg.value, AggregatorV3Interface(priceFeedAddr));
        require(_totalRaisedUSD + usdValue <= hardCap, "C: hard cap atingido");

        // Registrar antes de chamadas externas (CEI)
        contributions[msg.sender] += msg.value;
        apoiadorTier[msg.sender] = tierId;
        unchecked {
            _totalRaisedUSD += usdValue;
        }

        // Mint NFT ERC-1155 síncrono
        ITierManager(tierManagerAddr).mintTier(msg.sender, tierId, usdValue);

        // Cashback $AGT via vesting (non-blocking: falha silenciosa se saldo insuficiente)
        uint256 agtAmt = usdValue * 1e10; // 8 dec → 18 dec, ratio 1 AGT/$1
        if (agtAmt > 0) {
            // slither-disable-next-line unused-return
            try IAGTToken(agtTokenAddr).createVestingSchedule(msg.sender, agtAmt, false) {} catch {}
        }

        emit Contributed(msg.sender, msg.value, usdValue, tierId);
    }

    // ── Saque ───────────────────────────────────────────────────────────────

    /// @inheritdoc ICampaign
    function requestWithdrawal() external override onlyProponente {
        require(_status == S_ACTIVE, "C: status invalido");
        require(block.timestamp > endTime, "C: prazo vigente");
        require(_totalRaisedUSD >= softCap, "C: soft cap nao atingido");
        _setStatus(S_ACTIVE, S_SUCCEEDED);
        emit WithdrawalRequested(proponente, address(this).balance);
    }

    /// @inheritdoc ICampaign
    /// @dev Routing automático: 95 % proponente + 5 % treasury (CEI aplicado)
    function executeWithdrawal() external override onlyApproved nonReentrant whenNotPaused {
        require(address(this).balance > 0, "C: saldo zero");
        uint256 total = address(this).balance;
        (uint256 fee, uint256 net) = DAOMath.applyFee(total, platformFee);

        _setStatus(S_APPROVED, S_WITHDRAWN); // estado antes das transferências

        (bool s1,) = treasuryDAO.call{value: fee}("");
        require(s1, "C: falha taxa treasury");
        (bool s2,) = proponente.call{value: net}("");
        require(s2, "C: falha envio proponente");

        emit WithdrawalExecuted(proponente, net, fee);
    }

    // ── Reembolso ───────────────────────────────────────────────────────────

    /// @inheritdoc ICampaign
    /// @dev CEI: zeramos contributions ANTES da transferência para evitar reentrada
    function claimRefund() external override onlyFailed nonReentrant whenNotPaused {
        uint256 amt = contributions[msg.sender];
        require(amt > 0, "C: nenhum aporte");

        contributions[msg.sender] = 0; // CEI: zerar antes do call

        // Tentar queimar NFT (non-blocking)
        uint256 tierId = apoiadorTier[msg.sender];
        if (tierId > 0) {
            try ITierManager(tierManagerAddr).burnTier(msg.sender, tierId) {} catch {}
        }

        (bool ok,) = payable(msg.sender).call{value: amt}("");
        require(ok, "C: falha refund");

        emit RefundProcessed(msg.sender, amt);
    }

    // ── DAO ─────────────────────────────────────────────────────────────────

    /// @notice Aprovação pela ApoiaDAO — libera execução do saque
    function approveByDAO() external onlyDAO {
        require(_status == S_SUCCEEDED, "C: nao succeeded");
        _setStatus(S_SUCCEEDED, S_APPROVED);
    }

    /// @notice Reprovação pela ApoiaDAO — ativa reembolsos
    function rejectByDAO() external onlyDAO {
        require(_status == S_SUCCEEDED, "C: nao succeeded");
        _setStatus(S_SUCCEEDED, S_REJECTED);
    }

    /// @notice DAO pode rejeitar forçado (fraude detectada, campanha ACTIVE ou SUCCEEDED)
    function forceRejectByDAO() external onlyDAO {
        require(_status == S_ACTIVE || _status == S_SUCCEEDED, "C: status invalido");
        uint8 old = _status;
        _status = S_REJECTED;
        emit StatusChanged(old, S_REJECTED);
    }

    // ── Expiração de inativos (Processo 07) ─────────────────────────────────

    /// @notice Liquida fundos não reclamados 60 dias após o encerramento.
    ///         60 % ao proponente, 40 % ao tesouro. Chamável por qualquer endereço.
    function liquidateExpired() external nonReentrant whenNotPaused {
        require(_status == S_FAILED || _status == S_REJECTED, "C: nao elegivel");
        require(block.timestamp > endTime + REFUND_DEADLINE_OFFSET, "C: prazo refund vigente");
        uint256 remaining = address(this).balance;
        require(remaining > 0, "C: saldo zero");

        uint256 toP = (remaining * 60) / 100;
        uint256 toT = remaining - toP;

        (bool s1,) = proponente.call{value: toP}("");
        require(s1, "C: falha proponente");
        (bool s2,) = treasuryDAO.call{value: toT}("");
        require(s2, "C: falha treasury");

        emit InactiveExpired(toP, toT, block.timestamp);
    }

    // ── Circuit Breaker ──────────────────────────────────────────────────────
    function pause() external onlyDAO {
        _pause();
    }

    function unpause() external onlyDAO {
        _unpause();
    }

    // ── Views ────────────────────────────────────────────────────────────────

    /// @inheritdoc ICampaign
    function config() external view override returns (CampaignConfig memory) {
        return CampaignConfig({
            proponente: proponente,
            softCap: softCap,
            hardCap: hardCap,
            startTime: startTime,
            endTime: endTime,
            tierManager: tierManagerAddr,
            agtToken: agtTokenAddr,
            treasuryDAO: treasuryDAO,
            priceFeedETHUSD: priceFeedAddr,
            platformFee: platformFee
        });
    }

    function totalRaisedUSD() external view override returns (uint256) {
        return _totalRaisedUSD;
    }

    function balance() external view override returns (uint256) {
        return address(this).balance;
    }

    function status() external view override returns (uint8) {
        return _status;
    }

    function isActive() external view returns (bool) {
        return _status == S_ACTIVE && block.timestamp >= startTime && block.timestamp <= endTime;
    }

    // ── Internal ─────────────────────────────────────────────────────────────
    function _setStatus(uint8 exp, uint8 nxt) internal {
        require(_status == exp, "C: transicao invalida");
        _status = nxt;
        emit StatusChanged(exp, nxt);
    }

    receive() external payable {}
}
