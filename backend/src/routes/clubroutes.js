import express from "express";
import Club from "../models/club.js";
import user from "../models/user.js";
import { protect } from "../middleware/authmiddleware.js";
import { adminOnly } from "../middleware/rolemiddleware.js";

const router = express.Router();

// GET /point/clubs  — list all clubs
router.get("/", async (req, res) => {
  try {
    const clubs = await Club.find().populate("organizers", "firstname lastname email").lean();
    res.json({ success: true, data: clubs });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Also support old /list path for backwards compatibility
router.get("/list", async (req, res) => {
  try {
    const clubs = await Club.find().populate("organizers", "firstname lastname email").lean();
    res.json({ success: true, data: clubs });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /point/clubs  — Admin: create a new club
router.post("/", protect, adminOnly, async (req, res) => {
  try {
    const { name, description, category } = req.body;
    if (!name) return res.status(400).json({ success: false, error: "Club name is required" });
    const existing = await Club.findOne({ name });
    if (existing) return res.status(400).json({ success: false, error: "A club with this name already exists" });
    const club = new Club({ name, description, category });
    await club.save();
    res.status(201).json({ success: true, data: club });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /point/clubs/:id  — Admin: delete a club
router.delete("/:id", protect, adminOnly, async (req, res) => {
  try {
    await Club.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Club deleted" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /point/clubs/follow  — Participant: follow/unfollow a club
router.put("/follow", protect, async (req, res) => {
  try {
    const participantId = req.user._id;
    const { clubId, action } = req.body;
    const participant = await user.findById(participantId);
    if (!participant) return res.status(404).json({ success: false, error: "Participant not found" });

    if (!participant.followedClubs) participant.followedClubs = [];

    if (action === "follow") {
      if (!participant.followedClubs.map(String).includes(String(clubId))) {
        participant.followedClubs.push(clubId);
      }
    } else if (action === "unfollow") {
      participant.followedClubs = participant.followedClubs.filter(
        (id) => String(id) !== String(clubId)
      );
    } else {
      return res.status(400).json({ success: false, error: "Invalid action. Use 'follow' or 'unfollow'" });
    }

    await participant.save();
    res.json({ success: true, message: `Club ${action}ed successfully`, followedClubs: participant.followedClubs });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
