const jwt = require("jsonwebtoken");
const User = require("../models/User");

async function auth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : "";
    if (!token) return res.status(401).json({ message: "Please login first." });

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "development_secret_change_me");
    const user = await User.findById(decoded.id).select("-password");
    if (!user) return res.status(401).json({ message: "User not found." });

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Session expired. Please login again." });
  }
}

function managerOnly(req, res, next) {
  if (req.user.role !== "manager") return res.status(403).json({ message: "Manager access only." });
  next();
}

module.exports = { auth, managerOnly };
