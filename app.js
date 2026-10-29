require("dotenv").config();
const express = require("express");
const path = require("path");
const bcrypt = require("bcryptjs");
const connectDB = require("./config/db");
const User = require("./models/User");
const authRoutes = require("./routes/authRoutes");
const leaveRoutes = require("./routes/leaveRoutes");

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

app.use("/api/auth", authRoutes);
app.use("/api/leaves", leaveRoutes);
app.get("/api/health", (req, res) => res.json({ status: "OK", message: "Leave Management API is running." }));

async function seedManager() {
    const email = (process.env.STAFF_EMAIL || "").toLowerCase();

    const exists = await User.findOne({ email });

    if (!exists) {
        const password = await bcrypt.hash(
            process.env.STAFF_PASSWORD,
            10
        );

        await User.create({
            name: process.env.STAFF_NAME,
            staffId: process.env.STAFF_ID,
            email,
            password,
            role: "manager"
        });

        console.log("Staff account created:", email);
    } else {
        console.log("Staff account already exists:", email);
    }
}

const PORT = process.env.PORT || 5000;
connectDB()
  .then(seedManager)
  .then(() => app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`)))
  .catch(error => {
    console.error("Startup failed:", error.message);
    process.exit(1);
  });
