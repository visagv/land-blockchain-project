const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const Document = require("../models/Document");
const fs = require("fs");
const { landIdError } = require("../utils/validators");
const { verifyToken, verifyOfficer } = require("../middleware/auth");
const { generateFileHash } = require("../utils/hashUtil");
const { storeHashOnBlockchain, getHashFromBlockchain } = require("../utils/blockchainUtil");

// ---------- Multer setup (handles file uploads) ----------
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => {
    // avoid duplicate filenames: timestamp + original name
    cb(null, Date.now() + "-" + file.originalname);
  },
});
const upload = multer({ storage });

// ==========================================================
// 1. CITIZEN: Upload a land document
// POST /api/documents/upload   (protected - citizen must be logged in)
// ==========================================================
router.post("/upload", verifyToken, upload.single("document"), async (req, res) => {
  try {
    const { landId } = req.body;
    const badId = landIdError(landId);
    if (badId) { if (req.file) fs.unlink(req.file.path, () => {}); return res.status(400).json({ message: badId }); }

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded." });
    }

    // Check if this landId already has an APPROVED document from someone else
    // -> this is how we catch conflicting/duplicate claims
    const existingApproved = await Document.findOne({ landId, status: "approved" });

    const newDoc = new Document({
      owner: req.user.id,
      landId,
      fileName: req.file.originalname,
      filePath: req.file.path,
      status: existingApproved ? "flagged" : "pending",
      remarks: existingApproved
        ? "This Land ID already has an approved document. Flagged for officer review."
        : "",
    });

    await newDoc.save();

    res.status(201).json({
      message: "Document uploaded successfully. Awaiting officer verification.",
      document: newDoc,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error during upload." });
  }
});

// ==========================================================
// 2. CITIZEN: Track my own uploaded documents
// GET /api/documents/my-documents
// ==========================================================
router.get("/my-documents", verifyToken, async (req, res) => {
  try {
    const docs = await Document.find({ owner: req.user.id }).sort({ createdAt: -1 });
    res.json(docs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error." });
  }
});

// ==========================================================
// 3. OFFICER: View all pending/flagged documents
// GET /api/documents/all   (protected - officer only)
// ==========================================================
router.get("/all", verifyToken, verifyOfficer, async (req, res) => {
  try {
    const docs = await Document.find().populate("owner", "name email").sort({ createdAt: -1 });
    res.json(docs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error." });
  }
});

// ==========================================================
// 4. OFFICER: Approve a document
// PUT /api/documents/:id/approve   (protected - officer only)
// This is where SHA-256 + Blockchain actually happen.
// ==========================================================
router.put("/:id/approve", verifyToken, verifyOfficer, async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: "Document not found." });

    if (doc.status === "approved") return res.status(400).json({ message: "Already approved." });
    const clash = await Document.findOne({ landId: doc.landId, status: "approved", _id: { $ne: doc._id } });
    if (clash) return res.status(400).json({ message: "This Land ID already has an approved document. Reject this one as a conflicting claim." });

    // Step 1: generate SHA-256 hash of the uploaded file
    const hash = generateFileHash(doc.filePath);

    // Step 2: store that hash on the blockchain
    const { txHash, blockNumber } = await storeHashOnBlockchain(doc.landId, hash);

    // Step 3: update our database record
    doc.status = "approved";
    doc.documentHash = hash;
    doc.blockchainTxHash = txHash;
    doc.blockNumber = blockNumber;
    doc.remarks = "Approved and recorded on blockchain.";
    await doc.save();

    res.json({ message: "Document approved and recorded on blockchain.", document: doc });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error during approval.", error: err.message });
  }
});

// ==========================================================
// 5. OFFICER: Reject a document
// PUT /api/documents/:id/reject
// ==========================================================
router.put("/:id/reject", verifyToken, verifyOfficer, async (req, res) => {
  try {
    const { remarks } = req.body;
    const doc = await Document.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: "Document not found." });

    doc.status = "rejected";
    doc.remarks = remarks || "Rejected by officer.";
    await doc.save();

    res.json({ message: "Document rejected.", document: doc });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error." });
  }
});

// ==========================================================
// 6. PUBLIC: Verify a document by Land ID
// POST /api/documents/verify   (no login required - public page)
// Citizen/public uploads the document again -> we hash it -> compare with blockchain
// ==========================================================
router.post("/verify", upload.single("document"), async (req, res) => {
  try {
    const { landId } = req.body;
    const badId = landIdError(landId);
    if (badId) { if (req.file) fs.unlink(req.file.path, () => {}); return res.status(400).json({ message: badId }); }

    if (!req.file) {
      return res.status(400).json({ message: "Please upload the document to verify." });
    }

    // Step 1: hash the newly uploaded file
    const newHash = generateFileHash(req.file.path);

    // Step 2: get the ORIGINAL stored hash from the blockchain
    const record = await getHashFromBlockchain(landId);

    if (!record.documentHash) {
      return res.status(404).json({
        message: "No verified record found on blockchain for this Land ID.",
        result: "NOT_FOUND",
      });
    }

    // Step 3: compare
    fs.unlink(req.file.path, () => {});
    const isMatch = newHash === record.documentHash;
    const doc = await Document.findOne({ landId, status: "approved" }).sort({ updatedAt: -1 });

    res.json({
      result: isMatch ? "VERIFIED_UNCHANGED" : "TAMPERED_OR_MODIFIED",
      message: isMatch
        ? "Document matches the verified record. No tampering detected."
        : "Document hash does NOT match the blockchain record. Document may have been modified.",
      storedHash: record.documentHash,
      uploadedFileHash: newHash,
      blockchainTimestamp: record.timestamp,
      proof: { txHash: doc && doc.blockchainTxHash, blockNumber: doc && doc.blockNumber, recordedBy: record.addedBy, contract: record.contract, timestamp: record.timestamp },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error during verification.", error: err.message });
  }
});

module.exports = router;
