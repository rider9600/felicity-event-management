import user from "../models/user.js";

// Handle onboarding - save interests and mark as onboarded
export const handleOnboarding = async (req, res) => {
  try {
    const userId = req.user._id;
    const { interests } = req.body;

    // Validate interests is an array
    if (!Array.isArray(interests)) {
      return res.status(400).json({
        success: false,
        error: "Interests must be an array",
      });
    }

    // Find and update user with interests and onboarding status
    const updatedUser = await user.findByIdAndUpdate(
      userId,
      {
        interests: interests,
        isOnboarded: true,
        onboardingCompletedAt: new Date(),
      },
      { new: true },
    );

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
