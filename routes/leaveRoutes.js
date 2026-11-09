
const express = require("express");
const Leave = require("../models/Leave");
const User = require("../models/User");
const { auth, managerOnly } = require("../middleware/auth");

const router = express.Router();

function countDays(from, to) {
    const a = new Date(from);
    const b = new Date(to);

    a.setHours(0, 0, 0, 0);
    b.setHours(0, 0, 0, 0);

    return Math.floor((b - a) / 86400000) + 1;
}

// Employee: apply for leave
router.post("/", auth, async (req, res) => {
    try {
        if (req.user.role !== "employee") {
            return res.status(403).json({
                message: "Only employees can apply for leave."
            });
        }

        const { leaveType, fromDate, toDate, reason } = req.body;

        if (!leaveType || !fromDate || !toDate || !reason?.trim()) {
            return res.status(400).json({
                message: "Please fill all leave application fields."
            });
        }

        if (!["Casual Leave", "Medical Leave"].includes(leaveType)) {
            return res.status(400).json({
                message: "Select a valid leave type."
            });
        }

        const days = countDays(fromDate, toDate);

        if (Number.isNaN(days) || days < 1) {
            return res.status(400).json({
                message: "To date must be on or after from date."
            });
        }

        const balance =
            leaveType === "Casual Leave"
                ? req.user.casualLeave
                : req.user.medicalLeave;

        if (days > balance) {
            return res.status(400).json({
                message: `Insufficient balance. Available: ${balance} day(s).`
            });
        }

        const overlap = await Leave.findOne({
            employee: req.user._id,
            status: { $in: ["Pending", "Approved"] },
            fromDate: { $lte: new Date(toDate) },
            toDate: { $gte: new Date(fromDate) }
        });

        if (overlap) {
            return res.status(400).json({
                message: "You already have a pending or approved leave during these dates."
            });
        }

        const leave = await Leave.create({
            employee: req.user._id,
            leaveType,
            fromDate,
            toDate,
            days,
            reason: reason.trim()
        });

        console.log("\n========== NEW LEAVE APPLICATION ==========");
        console.log("Student:", req.user.name);
        console.log("Register Number:", req.user.registerNumber);
        console.log("Email:", req.user.email);
        console.log("Leave ID:", leave._id.toString());
        console.log("Leave Type:", leave.leaveType);
        console.log("From Date:", leave.fromDate);
        console.log("To Date:", leave.toDate);
        console.log("Total Days:", leave.days);
        console.log("Reason:", leave.reason);
        console.log("Status:", leave.status);
        console.log("===========================================\n");

        res.status(201).json({
            message: "Leave application submitted to manager.",
            leave
        });

    } catch (error) {
        console.error("[LEAVE APPLICATION ERROR]", error.message);

        res.status(500).json({
            message: "Could not submit leave.",
            error: error.message
        });
    }
});


// Employee: view own applications and balance
router.get("/mine", auth, async (req, res) => {
    try {
        if (req.user.role !== "employee") {
            return res.status(403).json({
                message: "Employee access only."
            });
        }

        const leaves = await Leave.find({
            employee: req.user._id
        }).sort({ createdAt: -1 });

        console.log("\n========== STUDENT LEAVE HISTORY ==========");
        console.log("Student:", req.user.name);
        console.log("Register Number:", req.user.registerNumber);
        console.log("Applications Found:", leaves.length);
        console.log("Casual Leave Balance:", req.user.casualLeave);
        console.log("Medical Leave Balance:", req.user.medicalLeave);
        console.log("===========================================\n");

        res.json({
            leaves,
            balance: {
                casualLeave: req.user.casualLeave,
                medicalLeave: req.user.medicalLeave
            }
        });

    } catch (error) {
        console.error("[LEAVE HISTORY ERROR]", error.message);

        res.status(500).json({
            message: "Could not load leave history."
        });
    }
});


// Manager: view every employee request
router.get("/all", auth, managerOnly, async (req, res) => {
    try {
        const leaves = await Leave.find()
            .populate("employee", "name email registerNumber department year")
            .sort({ createdAt: -1 });

        console.log("\n========== STAFF VIEWING APPLICATIONS ==========");
        console.log("Staff:", req.user.name);
        console.log("Applications Found:", leaves.length);

        leaves.forEach((leave, index) => {
            console.log(`Application ${index + 1}:`, {
                student: leave.employee?.name || "-",
                registerNumber: leave.employee?.registerNumber || "-",
                leaveType: leave.leaveType,
                days: leave.days,
                status: leave.status
            });
        });

        console.log("================================================\n");

        res.json({ leaves });

    } catch (error) {
        console.error("[STAFF APPLICATIONS ERROR]", error.message);

        res.status(500).json({
            message: "Could not load leave applications."
        });
    }
});


// Manager: approve or reject leave
router.patch("/:id/status", auth, managerOnly, async (req, res) => {
    try {
        const { status, managerComment = "" } = req.body;

        if (!["Approved", "Rejected"].includes(status)) {
            return res.status(400).json({
                message: "Choose Approved or Rejected."
            });
        }

        const leave = await Leave.findById(req.params.id);

        if (!leave) {
            return res.status(404).json({
                message: "Leave request not found."
            });
        }

        if (leave.status !== "Pending") {
            return res.status(400).json({
                message: "This request has already been processed."
            });
        }

        if (status === "Approved") {
            const employee = await User.findById(leave.employee);

            if (!employee) {
                return res.status(404).json({
                    message: "Student account not found."
                });
            }

            const field =
                leave.leaveType === "Casual Leave"
                    ? "casualLeave"
                    : "medicalLeave";

            if (employee[field] < leave.days) {
                return res.status(400).json({
                    message: "Employee no longer has enough leave balance."
                });
            }

            employee[field] -= leave.days;
            await employee.save();

            console.log("[LEAVE BALANCE UPDATED]", {
                student: employee.name,
                leaveType: leave.leaveType,
                daysDeducted: leave.days,
                remainingBalance: employee[field]
            });
        }

        leave.status = status;
        leave.managerComment = managerComment;
        await leave.save();

        console.log("\n========== LEAVE STATUS UPDATED ==========");
        console.log("Staff:", req.user.name);
        console.log("Leave ID:", leave._id.toString());
        console.log("Student ID:", leave.employee.toString());
        console.log("Leave Type:", leave.leaveType);
        console.log("Status:", leave.status);
        console.log("Staff Comment:", leave.managerComment || "-");
        console.log("==========================================\n");

        res.json({
            message: `Leave ${status.toLowerCase()} successfully.`,
            leave
        });

    } catch (error) {
        console.error("[LEAVE STATUS UPDATE ERROR]", error.message);

        res.status(500).json({
            message: "Could not update leave status.",
            error: error.message
        });
    }
});

module.exports = router;
