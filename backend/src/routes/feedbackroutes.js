import express from "express";
import {
  submitFeedback,
  getEventFeedback,
  getMyFeedback,
} from "../controllers/feedbackcontroller.js";
import { protect } from "../middleware/authmiddleware.js";

const router = express.Router();

router.post("/", protect, submitFeedback);
router.get("/event/:eventId", protect, getEventFeedback);
router.get("/my", protect, getMyFeedback);

export default router;
