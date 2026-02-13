import express from "express";
import { getAdminAnalytics } from "../controllers/adminanalyticscontroller.js";
import { protect } from "../middleware/authmiddleware.js";
const router = express.Router();
router.get("/", protect, getAdminAnalytics);
export default router;
