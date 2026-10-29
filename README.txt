LEAVE MANAGEMENT SYSTEM - RUN IN VS CODE

Requirements:
1. Node.js installed
2. MongoDB Community Server running locally OR a MongoDB Atlas connection string

Project setup:
1. Extract this ZIP.
2. Open the extracted folder in VS Code.
3. Open Terminal > New Terminal.
4. Run: npm install
5. Copy .env.example and rename the copy to .env.
6. If using local MongoDB, keep:
   MONGO_URI=mongodb://127.0.0.1:27017/leave_management
7. Start the app:
   npm start
8. Open: http://localhost:5000

MANAGER LOGIN:
Email: manager@company.com
Password: Manager@123
Role: Manager

EMPLOYEE LOGIN:
Use Employee Register to create an employee account. Registration automatically creates an employee login.

WORKFLOW:
1. Employee registers and logs in.
2. Employee applies for Casual Leave or Medical Leave.
3. Application is saved in MongoDB with Pending status.
4. Manager logs in and sees all employee requests.
5. Manager clicks Approve or Reject.
6. Employee refreshes/logs in to see the updated status.
7. Leave balance is reduced only when the manager approves.

DEFAULT BALANCE:
Casual Leave: 12 days
Medical Leave: 10 days

IMPORTANT:
- Change JWT_SECRET and manager password in .env before real deployment.
- This is a classroom/demo application. Do not use default credentials in production.
- The manager account is created automatically on the first server start if it does not already exist.
