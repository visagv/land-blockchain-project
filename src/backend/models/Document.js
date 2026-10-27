const mongoose = require("mongoose");

// This schema stores EVERY land document uploaded by a citizen.
const documentSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // links this document to the citizen who uploaded it
      required: true,
    },
    landId: {
      type: String, // e.g. Survey Number / Land Registration Number
      required: true,
    },
    fileName: {
      type: String, // original file name of the uploaded document
      required: true,
    },
    filePath: {
      type: String, // where the file is stored on our server
      required: true,
    },
    documentHash: {
      type: String, // SHA-256 hash of the file (generated after officer approves it)
      default: null,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "flagged"],
      // pending  -> waiting for officer review
      // approved -> officer verified it, hash generated + stored on blockchain
      // rejected -> officer rejected it
      // flagged  -> looks like a duplicate/conflicting claim, needs manual check
      default: "pending",
    },
    remarks: {
      type: String, // officer can write a reason for rejection/flagging
      default: "",
    },
    blockNumber: { type: Number, default: null },
    blockchainTxHash: {
      type: String, // the transaction hash returned by the blockchain after we store the document hash
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Document", documentSchema);
