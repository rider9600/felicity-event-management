import express from "express";
import {
  createTeam,
  joinTeamByCode,
  respondToInvite,
  getTeam,
  getEventTeams,
  getUserTeams,
  deleteTeam,
} from "../controllers/teamcontroller.js";
import { protect } from "../middleware/authmiddleware.js";

const router = express.Router();

router.post("/", protect, createTeam);
router.post("/join", protect, joinTeamByCode);
router.put("/:teamId/respond", protect, respondToInvite);
router.get("/:teamId", protect, getTeam);
router.get("/event/:eventId", getEventTeams);
router.get("/user/teams", protect, getUserTeams);
router.delete("/:teamId", protect, deleteTeam);

export default router;
