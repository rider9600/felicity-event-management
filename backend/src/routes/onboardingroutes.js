import express from "express";
import { handleOnboarding } from "../controllers/onboardingcontroller.js";
import { protect } from "../middleware/authmiddleware.js";

const router = express.Router();

// PUT endpoint for onboarding - save interests and mark user as onboarded
router.put("/", protect, handleOnboarding);

export default router;
