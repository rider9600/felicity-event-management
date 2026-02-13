
import user from "../models/user.js";
import Ticket from "../models/ticket.js";
import Event from "../models/event.js";

// Get participant dashboard with upcoming events and history
export const getDashboard = async (req, res) => {
  try {
    const participantId = req.user._id;
    const tickets = await Ticket.find({ participantId }).populate("eventId");
    const now = new Date();
    // Upcoming events
    const upcoming = tickets.filter(
      (t) =>
        t.eventId &&
        new Date(t.eventId.eventStartDate) > now &&
        t.status === "active",
    );
    // History by type and status
    const normalHistory = tickets.filter(
      (t) => t.eventId && t.eventId.eventType === "normal",
    );
    const merchandiseHistory = tickets.filter(
      (t) => t.eventId && t.eventId.eventType === "merchandise",
    );
    const completed = tickets.filter((t) => t.status === "completed");
    const cancelledRejected = tickets.filter(
      (t) => t.status === "cancelled" || t.status === "rejected",
    );
    res.json({
      upcoming,
      normalHistory,
      merchandiseHistory,
      completed,
      cancelledRejected,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update participant profile (only allowed fields)
export const updateProfile = async (req, res) => {
  try {
    const participantId = req.user._id;
    const {
      firstname,
      lastname,
      contactNumber,
      college,
      interests,
      followedClubs,
    } = req.body;
    const updates = {};
    if (firstname) updates.firstname = firstname;
    if (lastname) updates.lastname = lastname;
    if (contactNumber) updates.contactNumber = contactNumber;
    if (college) updates.college = college;
    if (interests) updates.interests = interests;
    if (followedClubs) updates.followedClubs = followedClubs;
    const participant = await user.findByIdAndUpdate(participantId, updates, {
      new: true,
    });
    const { password: _, ...safeUser } = participant._doc;
    res.json({ message: "Profile updated", participant: safeUser });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get participant profile
export const getProfile = async (req, res) => {
  try {
    const participantId = req.user._id;
    const participant = await user.findById(participantId).select("-password");
    res.json(participant);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
// Get organizers a participant follows
export const getFollowedOrganizers = async (req, res) => {
  try {
    const participantId = req.user._id;
    const participant = await user
      .findById(participantId)
      .select("followedClubs");
    if (!participant)
      return res.status(404).json({ message: "Participant not found" });
    // Populate organizer details
    const organizers = await user
      .find({ _id: { $in: participant.followedClubs }, role: "organizer" })
      .select("firstname lastname organizerName email");
    res.json(organizers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Complete onboarding
export const completeOnboarding = async (req, res) => {
  try {
    const participantId = req.user._id;
    const { interests, followedClubs } = req.body;
    
    const updates = {
      interests,
      followedClubs,
      isOnboarded: true,
      onboardingCompletedAt: new Date()
    };
    
    const participant = await user.findByIdAndUpdate(participantId, updates, {
      new: true,
    });
    const { password: _, ...safeUser } = participant._doc;
    res.json({ message: "Onboarding completed", participant: safeUser });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get recommended events based on preferences
export const getRecommendedEvents = async (req, res) => {
  try {
    const participantId = req.user._id;
    const participant = await user.findById(participantId).select("interests followedClubs");
    
    let filter = { status: "published" };
    let events = await Event.find(filter)
      .populate("organizerId", "firstname lastname organizerName")
      .populate("club", "name");
    
    // Sort by preferences: followed clubs first, then interests match
    events = events.sort((a, b) => {
      const aFollowed = participant.followedClubs.includes(a.organizerId._id) || 
                      (a.club && participant.followedClubs.includes(a.club._id));
      const bFollowed = participant.followedClubs.includes(b.organizerId._id) || 
                      (b.club && participant.followedClubs.includes(b.club._id));
      
      if (aFollowed && !bFollowed) return -1;
      if (!aFollowed && bFollowed) return 1;
      
      // Then sort by interests match
      const aInterestMatch = a.eventTags.some(tag => participant.interests.includes(tag));
      const bInterestMatch = b.eventTags.some(tag => participant.interests.includes(tag));
      
      if (aInterestMatch && !bInterestMatch) return -1;
      if (!aInterestMatch && bInterestMatch) return 1;
      
      return 0;
    });
    
    res.json(events);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};