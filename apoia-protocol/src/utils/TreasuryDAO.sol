// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/// @title TreasuryDAO — Cofre on-chain do protocolo
/// @notice Recebe 5% sobre saques aprovados. Gastos aprovados pela DAO.
///         Nos primeiros 6 meses: multisig 3-de-5 para emergências.
contract TreasuryDAO is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    address public daoContract;
    address[5] public multisigMembers;
    uint8 public constant MULTISIG_THRESHOLD = 3;
    uint64 public immutable multisigExpiry;

    mapping(bytes32 => uint8) private _confirms;
    mapping(bytes32 => mapping(address => bool)) private _confirmed;

    event FundsReceived(address indexed from, uint256 amount);
    event FundsDispatched(address indexed to, uint256 amount);
    event EmergencyWithdrawExecuted(address indexed to, uint256 amount);
    event DAOContractUpdated(address indexed newDAO);

    modifier onlyDAO() {
        require(msg.sender == daoContract || msg.sender == owner(), "T: somente DAO");
        _;
    }
    modifier onlyMultisig() {
        bool ok;
        for (uint256 i; i < 5;) {
            if (multisigMembers[i] == msg.sender) {
                ok = true;
                break;
            }
            unchecked {
                i++;
            }
        }
        require(ok, "T: nao e membro");
        _;
    }

    constructor(address[5] memory members, address _dao) Ownable(msg.sender) {
        multisigMembers = members;
        // slither-disable-next-line missing-zero-check
        daoContract = _dao;
        multisigExpiry = uint64(block.timestamp + 180 days);
    }

    receive() external payable {
        emit FundsReceived(msg.sender, msg.value);
    }

    function dispatch(address payable to, uint256 amount, bytes calldata data) external onlyDAO nonReentrant {
        require(to != address(0) && address(this).balance >= amount, "T: invalido");
        (bool ok,) = to.call{value: amount}(data);
        require(ok, "T: falha");
        emit FundsDispatched(to, amount);
    }

    function dispatchToken(address token, address to, uint256 amount) external onlyDAO nonReentrant {
        IERC20(token).safeTransfer(to, amount);
    }

    function confirmEmergencyWithdraw(address to, uint256 amount) external onlyMultisig nonReentrant {
        require(to != address(0), "T: to zero");
        require(block.timestamp < multisigExpiry, "T: multisig expirado");
        bytes32 h = keccak256(abi.encodePacked(to, amount));
        require(!_confirmed[h][msg.sender], "T: ja confirmou");
        _confirmed[h][msg.sender] = true;
        _confirms[h]++;
        if (_confirms[h] >= MULTISIG_THRESHOLD) {
            _confirms[h] = 0;
            (bool ok,) = payable(to).call{value: amount}("");
            require(ok, "T: falha emergency");
            emit EmergencyWithdrawExecuted(to, amount);
        }
    }

    function setDAO(address d) external onlyOwner {
        require(d != address(0));
        daoContract = d;
        emit DAOContractUpdated(d);
    }

    function ethBalance() external view returns (uint256) {
        return address(this).balance;
    }

    function tokenBalance(address t) external view returns (uint256) {
        return IERC20(t).balanceOf(address(this));
    }
}
