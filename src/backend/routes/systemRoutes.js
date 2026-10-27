const express = require("express");
const mongoose = require("mongoose");
const { getLedger, health } = require("../utils/blockchainUtil");
const router = express.Router();

router.get("/health", async (req, res) => {
  const chain = await health();
  res.json({ server: true, mongo: mongoose.connection.readyState === 1, ...chain });
});

router.get("/ledger", async (req, res) => {
  try { res.json(await getLedger()); }
  catch (e) { res.status(500).json({ message: "Blockchain not reachable: " + e.message }); }
});

module.exports = router;
