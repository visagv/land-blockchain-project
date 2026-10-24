// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

// Stores the SHA-256 hash of each approved land document.
// Every write emits an event, so the full history stays on the ledger.
contract LandRegistry {
    struct Record {
        string documentHash;
        address addedBy;
        uint256 timestamp;
    }

    mapping(string => Record) private records;

    event RecordAdded(string landId, string documentHash, address recordedBy, uint256 timestamp);

    function addRecord(string memory landId, string memory documentHash) public {
        records[landId] = Record(documentHash, msg.sender, block.timestamp);
        emit RecordAdded(landId, documentHash, msg.sender, block.timestamp);
    }

    function getRecord(string memory landId)
        public
        view
        returns (string memory documentHash, address addedBy, uint256 timestamp)
    {
        Record memory r = records[landId];
        return (r.documentHash, r.addedBy, r.timestamp);
    }
}
