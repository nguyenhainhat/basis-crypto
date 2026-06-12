// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title WorkspaceSBT
 * @dev Soulbound Token (SBT) for dWorkspace achievements.
 * These tokens are non-transferable and represent permanent reputation.
 */
contract WorkspaceSBT is ERC1155, Ownable {
    string public name = "dWorkspace Soulbound Achievement";
    string public symbol = "dWSA";

    constructor() ERC1155("https://api.dworkspace.com/metadata/{id}.json") Ownable(msg.sender) {}

    /**
     * @dev Mints an achievement to a user.
     * Only the owner (the dWorkspace backend/governance) can mint.
     */
    function mint(address account, uint256 id, uint256 amount) external onlyOwner {
        _mint(account, id, amount, "");
    }

    /**
     * @dev Overriding transfer functions to make tokens Soulbound.
     * Any attempt to transfer will revert.
     */
    function safeTransferFrom(
        address,
        address,
        uint256,
        uint256,
        bytes memory
    ) public pure override {
        revert("Tokens are Soulbound and non-transferable");
    }

    function safeBatchTransferFrom(
        address,
        address,
        uint256[] memory,
        uint256[] memory,
        bytes memory
    ) public pure override {
        revert("Tokens are Soulbound and non-transferable");
    }

    /**
     * @dev Approvals are disabled for Soulbound tokens.
     */
    function setApprovalForAll(address, bool) public pure override {
        revert("Approvals are disabled for Soulbound tokens");
    }

    /**
     * @dev Optional: Update URI for metadata
     */
    function setURI(string memory newuri) external onlyOwner {
        _setURI(newuri);
    }
}
