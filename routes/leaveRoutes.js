const express = require("express");
const Leave = require("../models/Leave");
const User = require("../models/User");
const { auth, managerOnly } = require("../middleware/auth");

const router = express.Router();

function countDays(from, to) {
  const a = new Date(from); const b = new Date(to);
  a.setHours(0,0,0,0); b.setHours(0,0,0,0);
  return Math.floor((b - a) / 86400000) + 1;
}

// Employee: apply for leave
router.post("/", auth, async (req, res) => {
  try {
    if (req.user.role !== "employee") return res.status(403).json({ message: "Only employees can apply for leave." });
    const { leaveType, fromDate, toDate, reason } = req.body;
    if (!leaveType || !fromDate || !toDate || !reason?.trim()) {
      return res.status(400).json({ message: "Please fill all leave application fields." });
    }
    if (!["Casual Leave", "Medical Leave"].includes(leaveType)) {
      return res.status(400).json({ message: "Select a valid leave type." });
    }
    const days = countDays(fromDate, toDate);
    if (Number.isNaN(days) || days < 1) return res.status(400).json({ message: "To date must be on or after from date." });

    const balance = leaveType === "Casual Leave" ? req.user.casualLeave : req.user.medicalLeave;
    if (days > balance) return res.status(400).json({ message: `Insufficient balance. Available: ${balance} day(s).` });

    const overlap = await Leave.findOne({
      employee: req.user._id,
      status: { $in: ["Pending", "Approved"] },
      fromDate: { $lte: new Date(toDate) },
      toDate: { $gte: new Date(fromDate) }
    });
    if (overlap) return res.status(400).json({ message: "You already have a pending or approved leave during these dates." });

    const leave = await Leave.create({
      employee: req.user._id, leaveType, fromDate, toDate, days, reason: reason.trim()
    });
    res.status(201).json({ message: "Leave application submitted to manager.", leave });
  } catch (error) {
    res.status(500).json({ message: "Could not submit leave.", error: error.message });
  }
});

// Employee: view own applications and balance
router.get("/mine", auth, async (req, res) => {
  if (req.user.role !== "employee") return res.status(403).json({ message: "Employee access only." });
  const leaves = await Leave.find({ employee: req.user._id }).sort({ createdAt: -1 });
  res.json({ leaves, balance: { casualLeave: req.user.casualLeave, medicalLeave: req.user.medicalLeave } });
});

// Manager: view every employee request
router.get("/all", auth, managerOnly, async (req, res) => {
  const leaves = await Leave.find()
    .populate("employee", "name email registerNumber department year")
    .sort({ createdAt: -1 });
  res.json({ leaves });
});

// Manager: approve or reject
router.patch("/:id/status", auth, managerOnly, async (req, res) => {
  try {
    const { status, managerComment = "" } = req.body;
    if (!["Approved", "Rejected"].includes(status)) return res.status(400).json({ message: "Choose Approved or Rejected." });

    const leave = await Leave.findById(req.params.id);
    if (!leave) return res.status(404).json({ message: "Leave request not found." });
    if (leave.status !== "Pending") return res.status(400).json({ message: "This request has already been processed." });

    if (status === "Approved") {
      const employee = await User.findById(leave.employee);
      const field = leave.leaveType === "Casual Leave" ? "casualLeave" : "medicalLeave";
      if (employee[field] < leave.days) return res.status(400).json({ message: "Employee no longer has enough leave balance." });
      employee[field] -= leave.days;
      await employee.save();
    }
    leave.status = status;
    leave.managerComment = managerComment;
    await leave.save();
    res.json({ message: `Leave ${status.toLowerCase()} successfully.`, leave });
  } catch (error) {
    res.status(500).json({ message: "Could not update leave status.", error: error.message });
  }
});

module.exports = router;
