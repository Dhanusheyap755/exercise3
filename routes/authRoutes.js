
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { auth } = require("../middleware/auth");

const router = express.Router();

const SECRET = process.env.JWT_SECRET || "leave_management_secret_2026";

// =====================================
// STUDENT REGISTRATION
// =====================================

router.post("/register", async (req, res) => {
    try {
        const {
            name,
            registerNumber,
            department,
            year,
            email,
            password
        } = req.body;

        if (
            !name ||
            !registerNumber ||
            !department ||
            !year ||
            !email ||
            !password
        ) {
            return res.status(400).json({
                message: "Please fill all student details."
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                message: "Password must contain at least 6 characters."
            });
        }

        const cleanEmail = email.trim().toLowerCase();
        const cleanRegisterNumber = registerNumber.trim();

        const existingUser = await User.findOne({
            $or: [
                { email: cleanEmail },
                { registerNumber: cleanRegisterNumber }
            ]
        });

        if (existingUser) {
            return res.status(409).json({
                message: "Email or Register Number already registered."
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await User.create({
            name: name.trim(),
            registerNumber: cleanRegisterNumber,
            department: department.trim(),
            year,
            email: cleanEmail,
            password: hashedPassword,
            role: "employee",
            casualLeave: 12,
            medicalLeave: 10
        });

        const token = jwt.sign(
            { id: newUser._id },
            SECRET,
            { expiresIn: "1d" }
        );
        console.log("[STUDENT REGISTERED]", {
    name: newUser.name,
    registerNumber: newUser.registerNumber,
    department: newUser.department,
    email: newUser.email
});
        res.status(201).json({
            message: "Student registration successful!",
            token,
            user: {
                id: newUser._id,
                name: newUser.name,
                registerNumber: newUser.registerNumber,
                department: newUser.department,
                year: newUser.year,
                email: newUser.email,
                role: newUser.role
            }
        });

    } catch (error) {
        console.error("STUDENT REGISTER ERROR:", error);

        res.status(500).json({
            message: "Registration failed.",
            error: error.message
        });
    }
});


// =====================================
// STUDENT AND STAFF LOGIN
// =====================================

router.post("/login", async (req, res) => {
    try {
        const {
            email,
            password,
            role,
            staffId
        } = req.body;

        if (!email || !password || !role) {
            return res.status(400).json({
                message: "Enter all login details."
            });
        }

        if (!["employee", "manager"].includes(role)) {
            return res.status(400).json({
                message: "Invalid login role."
            });
        }

        const user = await User.findOne({
            email: email.trim().toLowerCase()
        });

        if (!user) {
            return res.status(401).json({
                message: "Account not found."
            });
        }

        if (user.role !== role) {
            return res.status(401).json({
                message: "Please select the correct login role."
            });
        }

        // STAFF ID VERIFICATION
        if (role === "manager") {
            if (
                !staffId ||
                staffId.trim() !== user.staffId
            ) {
                return res.status(401).json({
                    message: "Invalid Staff ID."
                });
            }
        }

        const isMatch = await bcrypt.compare(
            password,
            user.password
        );

        if (!isMatch) {
            return res.status(401).json({
                message: "Incorrect password."
            });
        }

        const token = jwt.sign(
            { id: user._id },
            SECRET,
            { expiresIn: "1d" }
        );
        console.log("[LOGIN SUCCESS]", {
            name: user.name,
            email: user.email,
            role: user.role
       });
        res.json({
            message: "Login successful!",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                staffId: user.staffId,
                registerNumber: user.registerNumber,
                department: user.department,
                year: user.year,
                role: user.role,
                casualLeave: user.casualLeave,
                medicalLeave: user.medicalLeave
            }
        });

    } catch (error) {
        console.error("LOGIN ERROR:", error);

        res.status(500).json({
            message: "Login failed.",
            error: error.message
        });
    }
});


// =====================================
// CHECK LOGGED-IN USER
// =====================================

router.get("/me", auth, (req, res) => {
    res.json({
        user: req.user
    });
});

module.exports = router;
