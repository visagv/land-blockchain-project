const jwt = require("jsonwebtoken");

// This checks: "Is this person logged in?"
// It reads the token sent by the frontend and verifies it.
function verifyToken(req, res, next) {
  const authHeader = req.headers["authorization"]; // frontend sends: Authorization: Bearer <token>

  if (!authHeader) {
    return res.status(401).json({ message: "No token provided. Please login." });
  }

  const token = authHeader.split(" ")[1]; // "Bearer xxxxx" -> take xxxxx

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // now every route after this can use req.user.id and req.user.role
    next(); // move to the next function (the actual route)
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token." });
  }
}

// This checks: "Is this person a Land Officer?"
// We use this on admin-only routes (approve/reject documents).
function verifyOfficer(req, res, next) {
  if (req.user.role !== "officer") {
    return res.status(403).json({ message: "Access denied. Officers only." });
  }
  next();
}

module.exports = { verifyToken, verifyOfficer };
