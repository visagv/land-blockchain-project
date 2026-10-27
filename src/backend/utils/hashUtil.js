const crypto = require("crypto");
const fs = require("fs");

// Reads a file from disk and returns its SHA-256 hash.
// This is used TWICE in our project:
// 1. When officer APPROVES a document -> generate hash -> store on blockchain
// 2. When ANYONE wants to VERIFY a document later -> generate hash again -> compare
function generateFileHash(filePath) {
  const fileBuffer = fs.readFileSync(filePath); // read the file as raw bytes
  const hashSum = crypto.createHash("sha256"); // create a SHA-256 hash object
  hashSum.update(fileBuffer); // feed the file bytes into it
  const hex = hashSum.digest("hex"); // get the final hash as a hex string
  return hex;
}

module.exports = { generateFileHash };
