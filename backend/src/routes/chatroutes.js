import express from "express";
import {
  getTeamChatHistory,
  storeMessage,
  markMessageAsRead,
} from "../controllers/chatcontroller.js";
import { protect } from "../middleware/authmiddleware.js";

const router = express.Router();

router.get("/:teamId/history", protect, getTeamChatHistory);
router.post("/message", protect, storeMessage);
router.put("/:messageId/read", protect, markMessageAsRead);

export default router;
