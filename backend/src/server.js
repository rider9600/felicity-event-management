import app from "./app.js";
import dotenv from "dotenv";
import connectdb from "./config/db.js";
import createadmin from "./utils/createadmin.js";
import { setupSocketIO } from "./utils/socketio.js";
import http from "http";

dotenv.config();

const PORT = 5000;

// Initialize server
const initializeServer = async () => {
  try {
    // Create HTTP server for Socket.IO
    const server = http.createServer(app);

    // Setup Socket.IO
    const io = setupSocketIO(server);
    // Expose io to controllers via app
    app.set("io", io);
    console.log("✅ Socket.IO initialized");


    // Connect to database
    await connectdb();
    console.log("✅ Database connected");

    // Create admin user if needed
    await createadmin();
    console.log("✅ Admin check complete");

    // Start server
    server.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("❌ Server initialization error:", err);
    process.exit(1);
  }
};

initializeServer();
