// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/DaoVoting.sol";

contract DaoVotingTest is Test {
    DaoVoting public daoVoting;
    address public owner = address(1);
    address public nonOwner = address(2);

    function setUp() public {
        vm.prank(owner);
        daoVoting = new DaoVoting();
    }

    function testFinalizeProposal() public {
        vm.prank(owner);
        daoVoting.finalizeProposal(1, "hash123", 100, 50);

        (string memory hash, uint256 forVotes, uint256 againstVotes, bool isFinalized) = daoVoting.proposals(1);
        
        assertEq(hash, "hash123");
        assertEq(forVotes, 100);
        assertEq(againstVotes, 50);
        assertTrue(isFinalized);
    }

    function testCannotFinalizeTwice() public {
        vm.startPrank(owner);
        daoVoting.finalizeProposal(1, "hash123", 100, 50);
        
        vm.expectRevert("Proposal already finalized");
        daoVoting.finalizeProposal(1, "hash123", 120, 60);
        vm.stopPrank();
    }

    function testOnlyOwnerCanFinalize() public {
        vm.prank(nonOwner);
        // Ownable uses a custom error in ^0.8.20 typically, but expectRevert catches any revert if empty
        vm.expectRevert();
        daoVoting.finalizeProposal(1, "hash123", 100, 50);
    }
}
