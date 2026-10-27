const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { passwordError } = require("../utils/validators");

// ---------------- REGISTER ----------------
// POST /api/auth/register
// Used by BOTH citizen and officer (role comes from frontend form)
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const weak = passwordError(password);
    if (weak) return res.status(400).json({ message: weak });

    // 1. Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered." });
    }

    // 2. Hash the password before saving (NEVER store plain text password)
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 3. Create the user
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      role: role || "citizen",
    });

    await newUser.save();

    res.status(201).json({ message: "Registration successful. Please login." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error during registration." });
  }
});

// ---------------- LOGIN ----------------
// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password." });
    }

    // 2. Compare entered password with hashed password in DB
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password." });
    }

    // 3. Create a JWT token - this proves the user is logged in for future requests
    const token = jwt.sign(
      { id: user._id, role: user.role, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: "1d" } // token valid for 1 day
    );

    res.json({
      message: "Login successful.",
      token,
      user: { id: user._id, name: user.name, role: user.role, email: user.email },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error during login." });
  }
});

module.exports = router;
