// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/WorkspaceSBT.sol";

contract WorkspaceSBTTest is Test {
    WorkspaceSBT public sbt;
    address public admin = address(1);
    address public user = address(2);
    address public hacker = address(3);

    function setUp() public {
        vm.prank(admin);
        sbt = new WorkspaceSBT();
    }

    function test_MintByOwner() public {
        vm.prank(admin);
        sbt.mint(user, 1, 1);
        assertEq(sbt.balanceOf(user, 1), 1);
    }

    function test_Fail_MintByNonOwner() public {
        vm.prank(hacker);
        vm.expectRevert(); // OwnableUnauthorizedAccount
        sbt.mint(user, 1, 1);
    }

    function test_Fail_Transfer() public {
        vm.prank(admin);
        sbt.mint(user, 1, 1);
        
        vm.prank(user);
        vm.expectRevert("Tokens are Soulbound and non-transferable");
        sbt.safeTransferFrom(user, hacker, 1, 1, "");
    }
}
