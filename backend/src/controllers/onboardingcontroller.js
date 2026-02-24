import user from "../models/user.js";

// Handle onboarding - save interests / followed clubs and mark as onboarded
export const handleOnboarding = async (req, res) => {
  try {
    const userId = req.user._id;
    const { interests, followedClubs } = req.body;

    const updatePayload = {
      isOnboarded: true,
      onboardingCompletedAt: new Date(),
    };

    // Interests are optional but must be an array when provided
    if (interests !== undefined) {
      if (!Array.isArray(interests)) {
        return res.status(400).json({
          success: false,
          error: "Interests must be an array",
        });
      }
      updatePayload.interests = interests;
    }

    // Followed clubs (selected in onboarding) are optional but must be an array
    if (followedClubs !== undefined) {
      if (!Array.isArray(followedClubs)) {
        return res.status(400).json({
          success: false,
          error: "followedClubs must be an array",
        });
      }
      // Mongoose will cast string IDs to ObjectId for followedClubs schema
      updatePayload.followedClubs = followedClubs;
    }

    // Find and update user with onboarding data
    const updatedUser = await user.findByIdAndUpdate(userId, updatePayload, {
      new: true,
    });

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    res.json({
      success: true,
      message: "Onboarding completed successfully",
      data: {
        user: updatedUser,
      },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};
