const mongoose = require("mongoose");

// This schema stores all users - citizens AND land officers.
// 'role' field decides what type of user this is.
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true, // no two users can have same email
    },
    password: {
      type: String,
      required: true, // we will store this as a HASHED password (bcrypt), never plain text
    },
    role: {
      type: String,
      enum: ["citizen", "officer"], // only these two values allowed
      default: "citizen",
    },
  },
  { timestamps: true } // adds createdAt, updatedAt automatically
);

module.exports = mongoose.model("User", userSchema);
