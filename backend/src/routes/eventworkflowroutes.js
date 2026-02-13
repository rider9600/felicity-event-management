import express from "express";
import {
  publishEvent,
  closeEventRegistration,
  markEventCompleted,
} from "../controllers/eventworkflowcontroller.js";
import { protect } from "../middleware/authmiddleware.js";

const router = express.Router();

router.put("/publish/:id", protect, publishEvent);
router.put("/close/:id", protect, closeEventRegistration);
router.put("/complete/:id", protect, markEventCompleted);

export default router;
