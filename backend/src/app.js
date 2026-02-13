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

const app = express();
app.use(cors());
app.use(express.json());
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
app.get("/point/test", protect, (req, res) => {
  res.json({
    message: "protect route working",
    user: req.user,
  });
});
export default app;
