// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {AGTToken} from "../../src/core/AGTToken.sol";

/// @title AGTTokenTest — Testes unitários do AGTToken
/// @notice forge test --match-contract AGTTokenTest -vvv
contract AGTTokenTest is Test {
    AGTToken internal agt;
    address internal rewardsPool = makeAddr("rewardsPool");
    address internal treasury = makeAddr("treasury");
    address internal team = makeAddr("team");
    address internal staking = makeAddr("staking");
    address internal community = makeAddr("community");
    address internal minter = makeAddr("minter");
    address internal alice = makeAddr("alice");

    function setUp() public {
        agt = new AGTToken(rewardsPool, treasury, team, staking, community);
        agt.addMinter(minter);
        vm.prank(rewardsPool);
        agt.transfer(minter, 2_000_000e18);
        vm.prank(minter);
        agt.approve(address(agt), type(uint256).max);
    }

    function testTotalSupply() public view {
        assertEq(agt.totalSupply(), 100_000_000e18);
    }

    function testDistribution() public view {
        assertEq(agt.balanceOf(rewardsPool), 38_000_000e18, "rewards");
        assertEq(agt.balanceOf(treasury), 25_000_000e18, "treasury");
        assertEq(agt.balanceOf(team), 20_000_000e18, "team");
        assertEq(agt.balanceOf(staking), 10_000_000e18, "staking");
        assertEq(agt.balanceOf(community), 5_000_000e18, "community");
    }

    function testCreateVestingSchedule() public {
        vm.prank(minter);
        uint256 sid = agt.createVestingSchedule(alice, 1_000e18, false);
        AGTToken.VestingSchedule memory s = agt.getVestingSchedule(alice, sid);
        assertEq(s.totalAmount, 1_000e18, "total");
        assertEq(s.releasedAmount, 0, "released");
    }

    function testNothingBeforeCliff() public {
        vm.prank(minter);
        uint256 sid = agt.createVestingSchedule(alice, 1_000e18, false);
        vm.warp(block.timestamp + 15 days);
        assertEq(agt.releasableAmount(alice, sid), 0, "antes do cliff");
    }

    function testLinearReleaseAt50Percent() public {
        vm.prank(minter);
        uint256 sid = agt.createVestingSchedule(alice, 1_000e18, false);
        vm.warp(block.timestamp + 30 days + 45 days); // cliff + metade do vesting
        assertApproxEqAbs(agt.releasableAmount(alice, sid), 500e18, 10e18, "50%");
    }

    function testFullReleaseAfterVesting() public {
        vm.prank(minter);
        uint256 sid = agt.createVestingSchedule(alice, 1_000e18, false);
        vm.warp(block.timestamp + 121 days);
        assertEq(agt.releasableAmount(alice, sid), 1_000e18, "100%");
        vm.prank(alice);
        agt.releaseVestedTokens(sid);
        assertEq(agt.balanceOf(alice), 1_000e18, "saldo alice");
    }

    function testRevertUnauthorizedMinter() public {
        vm.prank(alice);
        vm.expectRevert("AGT: nao e minter");
        agt.createVestingSchedule(alice, 1e18, false);
    }

    function testRevertDoubleRelease() public {
        vm.prank(minter);
        uint256 sid = agt.createVestingSchedule(alice, 1_000e18, false);
        vm.warp(block.timestamp + 121 days);
        vm.prank(alice);
        agt.releaseVestedTokens(sid);
        vm.prank(alice);
        vm.expectRevert("AGT: nada a liberar");
        agt.releaseVestedTokens(sid);
    }

    function testRevertWrongBeneficiary() public {
        vm.prank(minter);
        uint256 sid = agt.createVestingSchedule(alice, 1_000e18, false);
        vm.warp(block.timestamp + 121 days);
        vm.prank(minter);
        vm.expectRevert("AGT: nao e o beneficiario");
        agt.releaseVestedTokens(sid);
    }
}
