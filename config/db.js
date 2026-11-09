
const mongoose = require("mongoose");
const dns = require("dns");

// Configure DNS servers
dns.setServers(["8.8.8.8", "8.8.4.4"]);

async function connectDB() {
  const uri = process.env.MONGO_URI;

  // Check MongoDB connection string
  if (!uri) {
    throw new Error(
      "MONGO_URI is missing. Please check your .env file."
    );
  }

  try {
    console.log("Connecting to MongoDB Atlas...");

    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 15000
    });

    console.log("MongoDB connected successfully!");
    console.log("Database name:", mongoose.connection.name);

  } catch (error) {
    console.error("\nMongoDB connection failed!");
    console.error("Error name:", error.name);
    console.error("Error message:", error.message);
    console.error("Error code:", error.code || "Not available");

    // Print individual server connection errors
    if (error.reason && error.reason.servers) {
      for (const [address, server] of error.reason.servers) {
        console.error("\nServer:", address);
        console.error("Server status:", server.type);

        if (server.error) {
          console.error("Server error:", server.error.name);
          console.error("Server details:", server.error.message);
          console.error(
            "Server error code:",
            server.error.code || "Not available"
          );
        }
      }
    }

    throw error;
  }
}

module.exports = connectDB;
