import express from "express";
import {
  registerNormalEvent,
  purchaseMerchandise,
} from "../controllers/registrationcontroller.js";
import { protect } from "../middleware/authmiddleware.js";

const router = express.Router();

router.post("/register", protect, registerNormalEvent);
router.post("/purchase", protect, purchaseMerchandise);

export default router;
