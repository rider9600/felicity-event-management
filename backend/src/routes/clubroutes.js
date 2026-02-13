import express from "express";
import { listClubs, followClub } from "../controllers/clubcontroller.js";
import { protect } from "../middleware/authmiddleware.js";
const router = express.Router();
router.get("/list", listClubs);
router.post("/follow", protect, followClub);
export default router;
