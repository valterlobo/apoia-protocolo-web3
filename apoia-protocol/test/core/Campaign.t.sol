// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console2} from "forge-std/Test.sol";
import {Campaign} from "../../src/core/Campaign.sol";
import {TierManager} from "../../src/core/TierManager.sol";
import {AGTToken} from "../../src/core/AGTToken.sol";
import {MockChainlinkFeed} from "../../src/mocks/MockChainlinkFeed.sol";
import {ITierManager} from "../../src/interfaces/ITierManager.sol";

contract CampaignTest is Test {
    address internal proponente = makeAddr("proponente");
    address internal apoiador1 = makeAddr("apoiador1");
    address internal apoiador2 = makeAddr("apoiador2");
    address internal treasury = makeAddr("treasury");
    address internal dao = makeAddr("dao");
    address internal rewardsPool = makeAddr("rewardsPool");

    Campaign internal campaign;
    TierManager internal tierMgr;
    AGTToken internal agt;
    MockChainlinkFeed internal feed;

    int256 internal constant ETH_PRICE = 2_000e8;
    uint256 internal constant SOFT_CAP = 50_000e8;
    uint256 internal constant HARD_CAP = 200_000e8;
    uint64 internal startTime;
    uint64 internal endTime;

    function setUp() public {
        feed = new MockChainlinkFeed(ETH_PRICE, 8);
        agt = new AGTToken(rewardsPool, treasury, makeAddr("team"), makeAddr("staking"), makeAddr("community"));
        startTime = uint64(block.timestamp);
        endTime = uint64(block.timestamp + 30 days);
        address predictedTM = computeCreateAddress(address(this), vm.getNonce(address(this)) + 1);
        campaign = new Campaign(
            payable(proponente),
            SOFT_CAP,
            HARD_CAP,
            startTime,
            endTime,
            predictedTM,
            address(agt),
            payable(treasury),
            address(feed),
            500,
            dao
        );
        tierMgr = new TierManager(address(campaign), address(feed), "ipfs://apoia/");
        assertEq(address(tierMgr), predictedTM, "TM mismatch");
        agt.addMinter(address(campaign));
        vm.prank(rewardsPool);
        agt.transfer(address(campaign), 1_000_000e18);
        vm.prank(address(campaign));
        agt.approve(address(agt), type(uint256).max);
        vm.prank(address(campaign));
        tierMgr.createTier("Apoiador", 100e8, 0, ITierManager.PriceMode.STATIC, "ipfs://t1");
        vm.deal(apoiador1, 100 ether);
        vm.deal(apoiador2, 100 ether);
    }

    function testContributeRegistersAndMintsNFT() public {
        vm.prank(apoiador1);
        campaign.contribute{value: 1 ether}(1);
        assertEq(campaign.contributions(apoiador1), 1 ether, "aporte");
        assertEq(tierMgr.balanceOf(apoiador1, 1), 1, "NFT");
    }

    function testRevertContributeZero() public {
        vm.prank(apoiador1);
        vm.expectRevert("C: aporte zero");
        campaign.contribute{value: 0}(1);
    }

    function testRevertAfterDeadline() public {
        vm.warp(endTime + 1);
        vm.prank(apoiador1);
        vm.expectRevert("C: prazo encerrado");
        campaign.contribute{value: 1 ether}(1);
    }

    function testRevertHardCap() public {
        vm.prank(apoiador1);
        campaign.contribute{value: 100 ether}(1);
        vm.deal(apoiador2, 10 ether);
        vm.prank(apoiador2);
        vm.expectRevert("C: hard cap atingido");
        campaign.contribute{value: 1 ether}(1);
    }

    function testFullSuccessFlow() public {
        vm.prank(apoiador1);
        campaign.contribute{value: 25 ether}(1);
        vm.warp(endTime + 1);
        vm.prank(proponente);
        campaign.requestWithdrawal();
        assertEq(uint256(campaign.status()), 1, "SUCCEEDED");
        vm.prank(dao);
        campaign.approveByDAO();
        assertEq(uint256(campaign.status()), 2, "APPROVED");
        uint256 total = address(campaign).balance;
        uint256 pb = proponente.balance;
        uint256 tb = treasury.balance;
        vm.prank(proponente);
        campaign.executeWithdrawal();
        assertApproxEqAbs(proponente.balance - pb, (total * 9_500) / 10_000, 1, "net");
        assertApproxEqAbs(treasury.balance - tb, (total * 500) / 10_000, 1, "fee");
        assertEq(uint256(campaign.status()), 5, "WITHDRAWN");
    }

    function testRevertWithdrawalSoftCapNotReached() public {
        vm.warp(endTime + 1);
        vm.prank(proponente);
        vm.expectRevert("C: soft cap nao atingido");
        campaign.requestWithdrawal();
    }

    function testRefundOnRejection() public {
        vm.prank(apoiador1);
        campaign.contribute{value: 1 ether}(1);
        vm.prank(dao);
        campaign.forceRejectByDAO();
        uint256 before = apoiador1.balance;
        vm.prank(apoiador1);
        campaign.claimRefund();
        assertEq(apoiador1.balance - before, 1 ether, "refund");
        assertEq(tierMgr.balanceOf(apoiador1, 1), 0, "NFT burned");
    }

    function testRevertDoubleRefund() public {
        vm.prank(apoiador1);
        campaign.contribute{value: 1 ether}(1);
        vm.prank(dao);
        campaign.forceRejectByDAO();
        vm.prank(apoiador1);
        campaign.claimRefund();
        vm.prank(apoiador1);
        vm.expectRevert("C: nenhum aporte");
        campaign.claimRefund();
    }

    function testLiquidateExpired() public {
        vm.prank(apoiador1);
        campaign.contribute{value: 5 ether}(1);
        vm.prank(dao);
        campaign.forceRejectByDAO();
        vm.warp(endTime + 60 days + 1);
        uint256 total = address(campaign).balance;
        uint256 pb = proponente.balance;
        uint256 tb = treasury.balance;
        campaign.liquidateExpired();
        assertApproxEqAbs(proponente.balance - pb, (total * 60) / 100, 1, "60%");
        assertApproxEqAbs(treasury.balance - tb, (total * 40) / 100, 1, "40%");
    }

    function testRevertStalePriceFeed() public {
        vm.warp(block.timestamp + 4 days);
        feed.setUpdatedAt(block.timestamp - 49 hours);
        vm.prank(apoiador1);
        vm.expectRevert("Chainlink: preco stale");
        campaign.contribute{value: 1 ether}(1);
    }

    function testPauseBlocksAndUnpauseAllows() public {
        vm.prank(dao);
        campaign.pause();
        vm.prank(apoiador1);
        vm.expectRevert();
        campaign.contribute{value: 1 ether}(1);
        vm.prank(dao);
        campaign.unpause();
        vm.prank(apoiador1);
        campaign.contribute{value: 1 ether}(1);
    }
}
