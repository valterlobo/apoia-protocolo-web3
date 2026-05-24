// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console2} from "forge-std/Test.sol";
import {Campaign} from "../../src/core/Campaign.sol";
import {TierManager} from "../../src/core/TierManager.sol";
import {AGTToken} from "../../src/core/AGTToken.sol";
import {StakingAGT} from "../../src/core/StakingAGT.sol";
import {ApoiaDAO} from "../../src/core/ApoiaDAO.sol";
import {TreasuryDAO} from "../../src/utils/TreasuryDAO.sol";
import {MockChainlinkFeed} from "../../src/mocks/MockChainlinkFeed.sol";
import {ITierManager} from "../../src/interfaces/ITierManager.sol";

/// @title FullFlowTest — Integração end-to-end do Apoia Protocol
/// @notice Deploy → Campanha → Aporte → Staking → Proposta DAO → Saque
///         forge test --match-contract FullFlowTest -vvv
contract FullFlowTest is Test {
    address internal proponente = makeAddr("proponente");
    address internal apoiador1 = makeAddr("apoiador1");
    address internal apoiador2 = makeAddr("apoiador2");

    AGTToken internal agt;
    StakingAGT internal stakingContract;
    ApoiaDAO internal dao;
    TreasuryDAO internal treasuryContract;
    Campaign internal campaign;
    TierManager internal tierMgr;
    MockChainlinkFeed internal feed;
    address[5] internal multisig;

    function setUp() public {
        feed = new MockChainlinkFeed(2_000e8, 8);
        for (uint256 i; i < 5;) {
            multisig[i] = makeAddr(string(abi.encodePacked("ms", i)));
            unchecked {
                i++;
            }
        }

        address rp = makeAddr("rewardsPool");
        agt = new AGTToken(rp, makeAddr("tWallet"), makeAddr("team"), makeAddr("sp"), makeAddr("comm"));
        stakingContract = new StakingAGT(address(agt), rp);
        treasuryContract = new TreasuryDAO(multisig, address(0));
        dao = new ApoiaDAO(address(agt), address(stakingContract));

        address predictedTM = computeCreateAddress(address(this), vm.getNonce(address(this)) + 1);
        campaign = new Campaign(
            payable(proponente),
            50_000e8,
            200_000e8,
            uint64(block.timestamp),
            uint64(block.timestamp + 30 days),
            predictedTM,
            address(agt),
            payable(address(treasuryContract)),
            address(feed),
            500,
            address(dao)
        );
        tierMgr = new TierManager(address(campaign), address(feed), "ipfs://apoia/");

        agt.addMinter(address(campaign));
        agt.setDAOContract(address(dao));

        vm.prank(address(campaign));
        tierMgr.createTier("Apoiador", 100e8, 0, ITierManager.PriceMode.STATIC, "ipfs://t1");

        vm.prank(rp);
        agt.transfer(apoiador1, 5_000_000e18);
        vm.prank(rp);
        agt.transfer(apoiador2, 3_000_000e18);
        vm.prank(rp);
        agt.transfer(address(campaign), 500_000e18);
        vm.prank(address(campaign));
        agt.approve(address(agt), type(uint256).max);

        vm.deal(apoiador1, 100 ether);
        vm.deal(apoiador2, 100 ether);
    }

    function testFullProtocolFlow() public {
        // 1. Staking para poder de voto
        vm.startPrank(apoiador1);
        agt.approve(address(stakingContract), 5_000_000e18);
        stakingContract.stake(5_000_000e18, StakingAGT(stakingContract).TWELVE_MONTHS());
        vm.stopPrank();

        vm.startPrank(apoiador2);
        agt.approve(address(stakingContract), 3_000_000e18);
        stakingContract.stake(3_000_000e18, StakingAGT(stakingContract).SIX_MONTHS());
        vm.stopPrank();

        console2.log("VP apoiador1:", stakingContract.getVotingPower(apoiador1));

        // 2. Aportes (25 ETH * $2k = $50k = softCap)
        vm.prank(apoiador1);
        campaign.contribute{value: 15 ether}(1);
        vm.prank(apoiador2);
        campaign.contribute{value: 10 ether}(1);
        assertEq(tierMgr.balanceOf(apoiador1, 1), 1, "NFT apoiador1");
        assertEq(tierMgr.balanceOf(apoiador2, 1), 1, "NFT apoiador2");
        console2.log("totalRaisedUSD:", campaign.totalRaisedUSD());

        // 3. Encerramento
        vm.warp(block.timestamp + 31 days);
        vm.prank(proponente);
        campaign.requestWithdrawal();
        assertEq(uint256(campaign.status()), 1, "SUCCEEDED");

        // 4. Aprovação direta pela DAO (em produção passa pelo processo de votação completo)
        vm.prank(address(dao));
        campaign.approveByDAO();
        assertEq(uint256(campaign.status()), 2, "APPROVED");

        // 5. Saque com taxa
        uint256 total = address(campaign).balance;
        uint256 pb = proponente.balance;
        uint256 tb = address(treasuryContract).balance;

        vm.prank(proponente);
        campaign.executeWithdrawal();

        assertApproxEqAbs(proponente.balance - pb, (total * 9_500) / 10_000, 1, "net");
        assertApproxEqAbs(address(treasuryContract).balance - tb, (total * 500) / 10_000, 1, "fee");
        assertEq(uint256(campaign.status()), 5, "WITHDRAWN");

        console2.log("Proponente recebeu:", proponente.balance - pb);
        console2.log("Tesouro recebeu:   ", address(treasuryContract).balance - tb);
    }
}
