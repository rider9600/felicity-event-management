import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import Message from "../models/message.js";

export const setupSocketIO = (server) => {
  const io = new Server(server, {
    cors: {
      origin: ["http://localhost:5173", "http://localhost:3000"],
      credentials: true,
    },
  });

  // Middleware: authenticate socket connection
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error("Authentication error"));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret");
      socket.userId = decoded.id;
      socket.user = decoded;
      next();
    } catch (err) {
      next(new Error("Authentication error"));
    }
  });

  // Active users per team (for presence tracking)
  const teamUsers = new Map();

  io.on("connection", (socket) => {
    console.log(`✅ User connected: ${socket.userId}`);

    // ─── TEAM CHAT ROOMS ──────────────────────────────────────────────────────

    // Join team room
    socket.on("join_team", (teamId) => {
      socket.join(`team-${teamId}`);

      if (!teamUsers.has(teamId)) teamUsers.set(teamId, []);
      if (!teamUsers.get(teamId).includes(socket.userId)) {
        teamUsers.get(teamId).push(socket.userId);
      }

      // Broadcast user joined
      io.to(`team-${teamId}`).emit("user_joined", {
        userId: socket.userId,
        onlineUsers: teamUsers.get(teamId),
      });

      console.log(`📍 User ${socket.userId} joined team ${teamId}`);
    });

    // Leave team room
    socket.on("leave_team", (teamId) => {
      socket.leave(`team-${teamId}`);
      const users = teamUsers.get(teamId) || [];
      teamUsers.set(
        teamId,
        users.filter((u) => u !== socket.userId),
      );

      io.to(`team-${teamId}`).emit("user_left", {
        userId: socket.userId,
        onlineUsers: teamUsers.get(teamId),
      });

      console.log(`👋 User ${socket.userId} left team ${teamId}`);
    });

    // Typing indicator
    socket.on("typing", (teamId) => {
      socket
        .to(`team-${teamId}`)
        .emit("user_typing", { userId: socket.userId });
    });

    socket.on("stop_typing", (teamId) => {
      socket
        .to(`team-${teamId}`)
        .emit("user_stopped_typing", { userId: socket.userId });
    });

    // Send message
    socket.on("send_message", async (data) => {
      const { teamId, content, fileUrl, fileType } = data;

      try {
        // Save message to DB
        const message = new Message({
          teamId,
          senderId: socket.userId,
          content: content || "",
          fileUrl: fileUrl || null,
          fileType: fileType || null,
        });

        await message.save();
        await message.populate("senderId", "firstname lastname email");

        // Broadcast to team
        io.to(`team-${teamId}`).emit("new_message", message);
      } catch (err) {
        socket.emit("message_error", { error: err.message });
      }
    });

    // ─── EVENT DISCUSSION FORUM ROOMS ────────────────────────────────────────

    // Join event forum room
    socket.on("join_forum", (eventId) => {
      socket.join(`forum-${eventId}`);
      console.log(`💬 User ${socket.userId} joined forum for event ${eventId}`);
    });

    // Leave event forum room
    socket.on("leave_forum", (eventId) => {
      socket.leave(`forum-${eventId}`);
      console.log(`👋 User ${socket.userId} left forum for event ${eventId}`);
    });

    // Forum typing indicator
    socket.on("forum_typing", (eventId) => {
      socket.to(`forum-${eventId}`).emit("forum_user_typing", { userId: socket.userId });
    });

    socket.on("forum_stop_typing", (eventId) => {
      socket.to(`forum-${eventId}`).emit("forum_user_stopped_typing", { userId: socket.userId });
    });

    // ─── DISCONNECT ───────────────────────────────────────────────────────────

    // Disconnect
    socket.on("disconnect", () => {
      // Remove from all teams
      for (const [teamId, users] of teamUsers.entries()) {
        const filtered = users.filter((u) => u !== socket.userId);
        teamUsers.set(teamId, filtered);

        if (filtered.length > 0) {
          io.to(`team-${teamId}`).emit("user_left", {
            userId: socket.userId,
            onlineUsers: filtered,
          });
        }
      }

      console.log(`❌ User disconnected: ${socket.userId}`);
    });
  });

  return io;
};

