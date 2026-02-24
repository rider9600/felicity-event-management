import express from "express";
import cors from "cors";
import authroutes from "./routes/authroutes.js";
import { protect } from "./middleware/authmiddleware.js";
import adminroutes from "./routes/adminroutes.js";
import eventroutes from "./routes/eventroutes.js";
import registrationroutes from "./routes/registrationroutes.js";
import ticketroutes from "./routes/ticketroutes.js";
import preferencesroutes from "./routes/preferencesroutes.js";
import clubroutes from "./routes/clubroutes.js";
import participantdashboardroutes from "./routes/participantdashboardroutes.js";
import organizerdashboardroutes from "./routes/organizerdashboardroutes.js";
import admindashboardroutes from "./routes/admindashboardroutes.js";
import organizeranalyticsroutes from "./routes/organizeranalyticsroutes.js";
import adminanalyticsroutes from "./routes/adminanalyticsroutes.js";
import passwordroutes from "./routes/passwordroutes.js";
import eventworkflowroutes from "./routes/eventworkflowroutes.js";
import participantlistroutes from "./routes/participantlistroutes.js";
import onboardingroutes from "./routes/onboardingroutes.js";
import teamroutes from "./routes/teamroutes.js";
import feedbackroutes from "./routes/feedbackroutes.js";
import merchandiseroutes from "./routes/merchandiseroutes.js";
import chatroutes from "./routes/chatroutes.js";
import forumroutes from "./routes/forumroutes.js";
import path from "path";

const app = express();

// CORS configuration: allow frontend origins + credentials
const allowedOrigins = [
  "http://localhost:5173",
  "https://felicity-event-management-smoky.vercel.app",
];

app.use(
  cors({
    origin(origin, callback) {
      // Allow non-browser or same-origin requests
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    credentials: true,
  }),
);

app.use(express.json());
// Serve uploaded payment proofs
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));
app.use("/point/auth", authroutes);
app.use("/point/admin", adminroutes);
app.use("/point/events", eventroutes);
app.use("/point/registration", registrationroutes);
app.use("/point/tickets", ticketroutes);
app.use("/point/preferences", preferencesroutes);
app.use("/point/clubs", clubroutes);
app.use("/point/participant", participantdashboardroutes);
app.use("/point/organizer", organizerdashboardroutes);
app.use("/point/admin-dashboard", admindashboardroutes);
app.use("/point/organizer-analytics", organizeranalyticsroutes);
app.use("/point/admin-analytics", adminanalyticsroutes);
app.use("/point/password", passwordroutes);
app.use("/point/event-workflow", eventworkflowroutes);
app.use("/point/participants", participantlistroutes);
app.use("/point/user/onboarding", onboardingroutes);
app.use("/point/teams", teamroutes);
app.use("/point/feedback", feedbackroutes);
app.use("/point/merchandise", merchandiseroutes);
app.use("/point/chat", chatroutes);
app.use("/point/forum", forumroutes);
app.get("/point/test", protect, (req, res) => {
  res.json({
    message: "protect route working",
    user: req.user,
  });
});
export default app;
