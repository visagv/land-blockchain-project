require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");

const authRoutes = require("./routes/authRoutes");
const documentRoutes = require("./routes/documentRoutes");

process.env.MONGO_URI ||= "mongodb://127.0.0.1:27017/land-blockchain-db";
process.env.JWT_SECRET ||= "landchain-demo-secret";
const systemRoutes = require("./routes/systemRoutes");

const app = express();

// ---------- Middleware ----------
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads"))); // so uploaded files can be viewed

// ---------- Serve the frontend (HTML/CSS/JS) ----------
app.use(express.static(path.join(__dirname, "..", "frontend")));

// ---------- API Routes ----------
app.use("/api/auth", authRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api", systemRoutes);

// ---------- Connect to MongoDB ----------
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected successfully."))
  .catch((err) => console.error("MongoDB connection error:", err));

// ---------- Start server ----------
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
