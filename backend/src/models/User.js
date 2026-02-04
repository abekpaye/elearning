const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      minlength: 2,
      maxlength: 50
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Invalid email format"]
    },
    passwordHash: {
      type: String,
      required: true
    },
    role: {
      type: String,
      enum: ["student", "instructor"],
      default: "student"
    }
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    versionKey: false
  }
);

module.exports = mongoose.model("User", userSchema);
