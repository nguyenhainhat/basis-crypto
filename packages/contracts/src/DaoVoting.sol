// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

contract DaoVoting is Ownable {
    struct Proposal {
        string hash;
        uint256 forVotes;
        uint256 againstVotes;
        bool isFinalized;
    }

    mapping(uint256 => Proposal) public proposals;
    uint256 public proposalCount;

    event ProposalFinalized(uint256 indexed proposalId, string hash, uint256 forVotes, uint256 againstVotes);

    constructor() Ownable(msg.sender) {}

    function finalizeProposal(uint256 _proposalId, string calldata _hash, uint256 _forVotes, uint256 _againstVotes) external onlyOwner {
        require(!proposals[_proposalId].isFinalized, "Proposal already finalized");

        proposals[_proposalId] = Proposal({
            hash: _hash,
            forVotes: _forVotes,
            againstVotes: _againstVotes,
            isFinalized: true
        });
        
        if (_proposalId >= proposalCount) {
            proposalCount = _proposalId + 1;
        }

        emit ProposalFinalized(_proposalId, _hash, _forVotes, _againstVotes);
    }
}
