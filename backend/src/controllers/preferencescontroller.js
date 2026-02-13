import user from "../models/user.js";

// Set or update participant preferences
export const setPreferences = async (req, res) => {
  try {
    const participantId = req.user._id;
    const { interests, followedClubs } = req.body;
    const participant = await user.findById(participantId);
    if (interests) participant.interests = interests;
    if (followedClubs) participant.followedClubs = followedClubs;
    await participant.save();
    res.json({ message: "Preferences updated", participant });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get participant preferences
export const getPreferences = async (req, res) => {
  try {
    const participantId = req.user._id;
    const participant = await user.findById(participantId);
    res.json({
      interests: participant.interests,
      followedClubs: participant.followedClubs,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
