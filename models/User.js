
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  registerNumber: {
    type: String,
    default: ""
  },
  department: {
    type: String,
    default: ""
  },
  year: {
    type: String,
    default: ""
  },
  staffId: {
    type: String,
    default: ""
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ["employee", "manager"],
    default: "employee"
  },
  casualLeave: {
    type: Number,
    default: 12
  },
  medicalLeave: {
    type: Number,
    default: 10
  }
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);
