import user from "../models/user.js";

// List all approved clubs/organizers
export const listClubs = async (req, res) => {
  try {
    const clubs = await user.find({ role: "organizer" });
    res.json(clubs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Follow/unfollow club
export const followClub = async (req, res) => {
  try {
    const participantId = req.user._id;
    const { clubId, action } = req.body;
    const participant = await user.findById(participantId);
    if (action === "follow") {
      if (!participant.followedClubs) participant.followedClubs = [];
      if (!participant.followedClubs.includes(clubId))
        participant.followedClubs.push(clubId);
    } else if (action === "unfollow") {
      participant.followedClubs = participant.followedClubs.filter(
        (id) => id !== clubId,
      );
    }
    await participant.save();
    res.json({ message: `Club ${action}ed successfully` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
