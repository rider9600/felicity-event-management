import express from "express";
import {
  setPreferences,
  getPreferences,
} from "../controllers/preferencescontroller.js";
import { protect } from "../middleware/authmiddleware.js";

const router = express.Router();

router.post("/set", protect, setPreferences);
router.get("/get", protect, getPreferences);

export default router;
