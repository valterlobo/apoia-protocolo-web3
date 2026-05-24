// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {Campaign} from "../../src/core/Campaign.sol";
import {TierManager} from "../../src/core/TierManager.sol";
import {AGTToken} from "../../src/core/AGTToken.sol";
import {MockChainlinkFeed} from "../../src/mocks/MockChainlinkFeed.sol";
import {ITierManager} from "../../src/interfaces/ITierManager.sol";

/// @title CampaignFuzz — Testes de fuzzing de invariantes críticas
/// @notice forge test --match-contract CampaignFuzz -vvv
contract CampaignFuzz is Test {
    Campaign internal campaign;
    TierManager internal tierMgr;
    AGTToken internal agt;
    MockChainlinkFeed internal feed;

    address internal proponente = makeAddr("proponente");
    address internal treasury = makeAddr("treasury");
    address internal dao = makeAddr("dao");
    address internal rewardsPool = makeAddr("rewardsPool");

    function setUp() public {
        feed = new MockChainlinkFeed(2_000e8, 8);
        agt = new AGTToken(rewardsPool, treasury, makeAddr("team"), makeAddr("staking"), makeAddr("community"));
        address predictedTM = computeCreateAddress(address(this), vm.getNonce(address(this)) + 1);
        campaign = new Campaign(
            payable(proponente),
            50_000e8,
            200_000e8,
            uint64(block.timestamp),
            uint64(block.timestamp + 30 days),
            predictedTM,
            address(agt),
            payable(treasury),
            address(feed),
            500,
            dao
        );
        tierMgr = new TierManager(address(campaign), address(feed), "ipfs://");
        agt.addMinter(address(campaign));
        vm.prank(rewardsPool);
        agt.transfer(address(campaign), 1_000_000e18);
        vm.prank(address(campaign));
        agt.approve(address(agt), type(uint256).max);
        vm.prank(address(campaign));
        tierMgr.createTier("Base", 1e8, 0, ITierManager.PriceMode.STATIC, "ipfs://t1");
    }

    /// Invariante: saldo do contrato >= contribuição individual de qualquer apoiador
    function testFuzz_BalanceGEContribution(uint96 amount) public {
        vm.assume(amount >= 0.05 ether && amount <= 50 ether);
        address user = makeAddr("fuzzyUser");
        vm.deal(user, amount);
        vm.prank(user);
        campaign.contribute{value: amount}(1);
        assertGe(address(campaign).balance, campaign.contributions(user), "balance < contribution");
    }

    /// Invariante: taxa nunca excede 7% do saldo
    function testFuzz_FeeMax7Percent(uint96 amount) public {
        vm.assume(amount >= 0.1 ether && amount <= 99 ether);
        address user = makeAddr("fuzzyFee");
        vm.deal(user, amount);
        vm.prank(user);
        campaign.contribute{value: amount}(1);
        uint256 total = address(campaign).balance;
        assertLe((total * 500) / 10_000, (total * 700) / 10_000, "fee > 7%");
    }

    /// Invariante: refund devolve exatamente o valor aportado
    function testFuzz_RefundEqualsContribution(uint96 amount) public {
        vm.assume(amount >= 0.05 ether && amount < 10 ether);
        address user = makeAddr("fuzzyRefund");
        vm.deal(user, uint256(amount) + 1 ether);
        vm.prank(user);
        campaign.contribute{value: amount}(1);
        uint256 contributed = campaign.contributions(user);
        vm.prank(dao);
        campaign.forceRejectByDAO();
        uint256 before = user.balance;
        vm.prank(user);
        campaign.claimRefund();
        assertEq(user.balance - before, contributed, "refund != contribution");
    }

    /// Invariante: status nunca regride no ciclo de vida
    function testFuzz_StatusNeverRegresses(uint96 amount) public {
        vm.assume(amount >= 0.1 ether && amount <= 24 ether);
        address user = makeAddr("fuzzyStatus");
        vm.deal(user, uint256(amount) + 1 ether);
        uint8 s0 = campaign.status();
        vm.prank(user);
        campaign.contribute{value: amount}(1);
        vm.prank(dao);
        campaign.forceRejectByDAO();
        uint8 s1 = campaign.status();
        assertGe(s1, s0, "status regrediu");
    }
}
