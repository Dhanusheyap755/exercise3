
const API_BASE = "https://leave-management-system-3-7b4w.onrender.com";

// =====================================
// FORM NAVIGATION
// =====================================

function hideAllForms() {
    document.getElementById("studentLoginForm").classList.add("hidden");
    document.getElementById("studentRegisterForm").classList.add("hidden");
    document.getElementById("staffLoginForm").classList.add("hidden");

    document.querySelectorAll(".tab").forEach(tab => {
        tab.classList.remove("active");
    });
}

function showStudentLogin() {
    hideAllForms();
    document.getElementById("studentLoginForm").classList.remove("hidden");
    document.querySelectorAll(".tab")[0].classList.add("active");
}

function showStudentRegister() {
    hideAllForms();
    document.getElementById("studentRegisterForm").classList.remove("hidden");
    document.querySelectorAll(".tab")[1].classList.add("active");
}

function showStaffLogin() {
    hideAllForms();
    document.getElementById("staffLoginForm").classList.remove("hidden");
    document.querySelectorAll(".tab")[2].classList.add("active");
}

// =====================================
// STUDENT REGISTRATION
// =====================================

document.getElementById("studentRegisterForm").addEventListener("submit", async function(e) {
    e.preventDefault();

    const studentData = {
        name: document.getElementById("studentName").value,
        registerNumber: document.getElementById("registerNumber").value,
        department: document.getElementById("department").value,
        year: document.getElementById("year").value,
        email: document.getElementById("studentEmail").value,
        password: document.getElementById("studentPassword").value
    };

    try {
        const response = await fetch(`${API_BASE}/api/auth/register`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(studentData)
        });

        const result = await response.json();

        document.getElementById("message").textContent = result.message;

        if (response.ok) {
            document.getElementById("studentRegisterForm").reset();
        }

    } catch (error) {
        console.error("Registration error:", error);

        document.getElementById("message").textContent =
            "Server connection failed!";
    }
});

// =====================================
// STUDENT LOGIN
// =====================================

document.getElementById("studentLoginForm").addEventListener("submit", async function(e) {
    e.preventDefault();

    const loginData = {
        email: document.getElementById("studentLoginEmail").value,
        password: document.getElementById("studentLoginPassword").value,
        role: "employee"
    };

    try {
        const response = await fetch(`${API_BASE}/api/auth/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(loginData)
        });

        const result = await response.json();

        document.getElementById("message").textContent = result.message;

        if (response.ok) {
            localStorage.setItem("token", result.token);
            localStorage.setItem("user", JSON.stringify(result.user));

            document.getElementById("authSection").classList.add("hidden");
            document.getElementById("studentDashboard").classList.remove("hidden");

            await loadStudentDashboard();
        }

    } catch (error) {
        console.error("Student login error:", error);

        document.getElementById("message").textContent =
            "Server connection failed!";
    }
});

// =====================================
// STAFF LOGIN
// =====================================

document.getElementById("staffLoginForm").addEventListener("submit", async function(e) {
    e.preventDefault();

    const loginData = {
        staffId: document.getElementById("staffId").value,
        email: document.getElementById("staffEmail").value,
        password: document.getElementById("staffPassword").value,
        role: "manager"
    };

    try {
        const response = await fetch(`${API_BASE}/api/auth/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(loginData)
        });

        const result = await response.json();

        document.getElementById("message").textContent = result.message;

        if (response.ok) {
            localStorage.setItem("token", result.token);
            localStorage.setItem("user", JSON.stringify(result.user));

            document.getElementById("authSection").classList.add("hidden");
            document.getElementById("staffDashboard").classList.remove("hidden");

            await loadStaffDashboard();
        }

    } catch (error) {
        console.error("Staff login error:", error);

        document.getElementById("message").textContent =
            "Server connection failed!";
    }
});

// =====================================
// STUDENT DASHBOARD
// =====================================

async function loadStudentDashboard() {
    const user = JSON.parse(localStorage.getItem("user"));

    if (!user) {
        alert("Please login again.");
        return;
    }

    document.getElementById("dashboardName").textContent = user.name || "";
    document.getElementById("dashboardRegisterNumber").textContent = user.registerNumber || "";
    document.getElementById("dashboardDepartment").textContent = user.department || "";
    document.getElementById("dashboardYear").textContent = user.year || "";
    document.getElementById("dashboardEmail").textContent = user.email || "";

    const token = localStorage.getItem("token");

    try {
        const response = await fetch(`${API_BASE}/api/leaves/mine`, {
            method: "GET",
            headers: {
                "Authorization": "Bearer " + token
            }
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || "Unable to load dashboard.");
        }

        document.getElementById("casualBalance").textContent =
            result.balance.casualLeave;

        document.getElementById("medicalBalance").textContent =
            result.balance.medicalLeave;

        const historyBody = document.getElementById("leaveHistoryBody");

        if (!result.leaves || result.leaves.length === 0) {
            historyBody.innerHTML =
                '<tr><td colspan="6">No leave applications yet.</td></tr>';
            return;
        }

        historyBody.innerHTML = result.leaves.map(leave => `
            <tr>
                <td>${leave.leaveType}</td>
                <td>${new Date(leave.fromDate).toLocaleDateString()}</td>
                <td>${new Date(leave.toDate).toLocaleDateString()}</td>
                <td>${leave.days}</td>
                <td>${leave.status}</td>
                <td>${leave.managerComment || "-"}</td>
            </tr>
        `).join("");

    } catch (error) {
        console.error("Dashboard error:", error);
        alert(error.message);
    }
}

// =====================================
// LOGOUT
// =====================================

function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    document.getElementById("studentDashboard").classList.add("hidden");
    document.getElementById("staffDashboard").classList.add("hidden");

    document.getElementById("authSection").classList.remove("hidden");

    document.getElementById("message").textContent = "";

    showStudentLogin();
}

// =====================================
// APPLY LEAVE
// =====================================

document.getElementById("applyLeaveForm").addEventListener("submit", async function(e) {
    e.preventDefault();

    const leaveData = {
        leaveType: document.getElementById("leaveType").value,
        fromDate: document.getElementById("fromDate").value,
        toDate: document.getElementById("toDate").value,
        reason: document.getElementById("leaveReason").value
    };

    const token = localStorage.getItem("token");

    try {
        const response = await fetch(`${API_BASE}/api/leaves`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + token
            },
            body: JSON.stringify(leaveData)
        });

        const result = await response.json();

        document.getElementById("message").textContent = result.message;

        if (response.ok) {
            document.getElementById("applyLeaveForm").reset();

            await loadStudentDashboard();

            alert("Leave application submitted successfully!");
        }

    } catch (error) {
        console.error("Apply leave error:", error);

        document.getElementById("message").textContent =
            "Server connection failed!";
    }
});

// =====================================
// STAFF DASHBOARD
// =====================================

async function loadStaffDashboard() {
    const user = JSON.parse(localStorage.getItem("user"));

    if (!user) {
        alert("Please login again.");
        return;
    }

    document.getElementById("staffDashboardName").textContent = user.name || "";
    document.getElementById("staffDashboardId").textContent = user.staffId || "";
    document.getElementById("staffDashboardEmail").textContent = user.email || "";

    const token = localStorage.getItem("token");

    try {
        const response = await fetch(`${API_BASE}/api/leaves/all`, {
            method: "GET",
            headers: {
                "Authorization": "Bearer " + token
            }
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || "Unable to load leave applications.");
        }

        const table = document.getElementById("staffLeaveTable");

        if (!result.leaves || result.leaves.length === 0) {
            table.innerHTML = `
                <tr>
                    <td colspan="10">No leave applications found.</td>
                </tr>
            `;
            return;
        }

        table.innerHTML = result.leaves.map(leave => `
            <tr>
                <td>${leave.employee?.name || "-"}</td>
                <td>${leave.employee?.registerNumber || "-"}</td>
                <td>${leave.employee?.department || "-"}</td>
                <td>${leave.leaveType}</td>
                <td>${new Date(leave.fromDate).toLocaleDateString()}</td>
                <td>${new Date(leave.toDate).toLocaleDateString()}</td>
                <td>${leave.days}</td>
                <td>${leave.reason}</td>
                <td>${leave.status}</td>
                <td>
                    ${
                        leave.status === "Pending"
                        ? `
                            <button onclick="updateLeaveStatus('${leave._id}', 'Approved')">
                                Approve
                            </button>

                            <button onclick="updateLeaveStatus('${leave._id}', 'Rejected')">
                                Reject
                            </button>
                        `
                        : leave.status
                    }
                </td>
            </tr>
        `).join("");

    } catch (error) {
        console.error("Staff Dashboard Error:", error);
        alert(error.message);
    }
}

// =====================================
// APPROVE OR REJECT LEAVE
// =====================================

async function updateLeaveStatus(leaveId, status) {
    const managerComment = prompt("Enter staff comment (optional):");

    if (managerComment === null) {
        return;
    }

    const token = localStorage.getItem("token");

    try {
        const response = await fetch(`${API_BASE}/api/leaves/${leaveId}/status`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + token
            },
            body: JSON.stringify({
                status: status,
                managerComment: managerComment
            })
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || "Unable to update leave status.");
        }

        alert(result.message);

        await loadStaffDashboard();

    } catch (error) {
        console.error("Update leave status error:", error);
        alert(error.message);
    }
}
