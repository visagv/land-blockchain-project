// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// This smart contract's ONLY job:
// - Store a document's SHA-256 hash on the blockchain, linked to its landId
// - Let anyone later check what hash is stored for a landId
// We do NOT store the actual PDF file here - only the hash (a short text string).
contract LandDocument {

    // This structure represents one record stored on the blockchain.
    struct Record {
        string landId;        // e.g. Survey Number
        string documentHash;  // SHA-256 hash of the approved document
        address addedBy;      // wallet address of the officer who added it
        uint256 timestamp;    // when it was added
    }

    // landId => Record   (like a dictionary/map)
    mapping(string => Record) private records;

    // This event gets fired every time a new record is stored.
    // Our backend listens for this to get the transaction hash.
    event RecordAdded(string landId, string documentHash, address addedBy, uint256 timestamp);

    // Called by backend (via Ethers.js) after officer approves a document.
    function addRecord(string memory _landId, string memory _documentHash) public {
        records[_landId] = Record(_landId, _documentHash, msg.sender, block.timestamp);
        emit RecordAdded(_landId, _documentHash, msg.sender, block.timestamp);
    }

    // Called during verification - anyone can check the stored hash for a landId.
    function getRecord(string memory _landId) public view returns (string memory, address, uint256) {
        Record memory r = records[_landId];
        return (r.documentHash, r.addedBy, r.timestamp);
    }
}
