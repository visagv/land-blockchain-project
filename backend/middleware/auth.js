const jwt = require("jsonwebtoken");

// Checks the "Authorization: Bearer <token>" header and attaches req.user
function verifyToken(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ message: "Not logged in. Token missing." });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (err) {
    res.status(401).json({ message: "Session expired or invalid. Please login again." });
  }
}

// Only land officers may pass
function verifyOfficer(req, res, next) {
  if (!req.user || req.user.role !== "officer") {
    return res.status(403).json({ message: "Access denied. Officers only." });
  }
  next();
}

module.exports = { verifyToken, verifyOfficer };
