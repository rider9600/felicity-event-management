import Team from "../models/team.js";
import Ticket from "../models/ticket.js";
import Event from "../models/event.js";
import User from "../models/user.js";
import crypto from "crypto";

// Generate unique invite code
const generateInviteCode = () =>
  crypto.randomBytes(6).toString("hex").toUpperCase();

// Create a new team
export const createTeam = async (req, res) => {
  try {
    const { eventId, teamName, teamSize } = req.body;
    const leaderId = req.user._id;

    // Validate event exists and is published
    const event = await Event.findById(eventId);
    if (!event)
      return res.status(404).json({ success: false, error: "Event not found" });
    if (event.status !== "published") {
      return res
        .status(400)
        .json({ success: false, error: "Event not published" });
    }

    // Validate team size
    if (!teamSize || teamSize < 2 || teamSize > 10) {
      return res
        .status(400)
        .json({ success: false, error: "Team size must be between 2 and 10" });
    }

    // Check leader is participant
    const leader = await User.findById(leaderId);
    if (leader.role !== "participant") {
      return res
        .status(403)
        .json({ success: false, error: "Only participants can create teams" });
    }

    const inviteCode = generateInviteCode();

    const team = new Team({
      eventId,
      leaderId,
      teamName,
      teamSize,
      inviteCode,
      members: [
        {
          userId: leaderId,
          status: "accepted",
          joinedAt: new Date(),
        },
      ],
    });

    await team.save();

    res.status(201).json({ success: true, team });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Invite member to team via code (member self-invites)
export const joinTeamByCode = async (req, res) => {
  try {
    const { inviteCode, eventId } = req.body;
    const userId = req.user._id;

    const team = await Team.findOne({ inviteCode, eventId });
    if (!team)
      return res
        .status(404)
        .json({ success: false, error: "Invalid invite code" });

    // Check if already a member
    if (team.members.some((m) => String(m.userId) === String(userId))) {
      return res
        .status(400)
        .json({ success: false, error: "Already a team member" });
    }

    // Check team size
    const acceptedCount = team.members.filter(
      (m) => m.status === "accepted",
    ).length;
    if (acceptedCount >= team.teamSize) {
      return res.status(400).json({ success: false, error: "Team is full" });
    }

    team.members.push({
      userId,
      status: "invited",
    });

    await team.save();

    res.json({ success: true, team });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Accept or decline team invite
export const respondToInvite = async (req, res) => {
  try {
    const { teamId } = req.params;
    const { response } = req.body; // "accept" or "decline"
    const userId = req.user._id;

    if (!["accept", "decline"].includes(response)) {
      return res
        .status(400)
        .json({
          success: false,
          error: "Response must be 'accept' or 'decline'",
        });
    }

    const team = await Team.findById(teamId).populate("eventId");
    if (!team)
      return res.status(404).json({ success: false, error: "Team not found" });

    const memberIdx = team.members.findIndex(
      (m) => String(m.userId) === String(userId),
    );
    if (memberIdx === -1) {
      return res
        .status(404)
        .json({ success: false, error: "You are not invited to this team" });
    }

    if (response === "accept") {
      team.members[memberIdx].status = "accepted";
      team.members[memberIdx].joinedAt = new Date();

      // Check if all members accepted
      const acceptedCount = team.members.filter(
        (m) => m.status === "accepted",
      ).length;
      if (acceptedCount === team.teamSize) {
        team.status = "complete";
        team.registrationComplete = true;
        team.registrationCompletedAt = new Date();

        // Auto-generate tickets for all accepted members (transaction-like)
        try {
          for (const member of team.members.filter(
            (m) => m.status === "accepted",
          )) {
            const ticketId = `TEAM-${team._id.toString().slice(0, 8)}-${member.userId.toString().slice(0, 8)}-${Date.now()}`;

            const ticket = new Ticket({
              ticketId,
              participantId: member.userId,
              eventId: teamId,
              teamId: team._id,
              status: "active",
              paymentStatus: "not_required",
            });

            await ticket.save();
          }

          // Increment event registration count
          const event = await Event.findById(team.eventId);
          event.registrationCount =
            (event.registrationCount || 0) +
            team.members.filter((m) => m.status === "accepted").length;
          await event.save();
        } catch (ticketErr) {
          console.error("Ticket auto-generation error:", ticketErr);
          return res
            .status(500)
            .json({ success: false, error: "Failed to generate tickets" });
        }
      }
    } else {
      team.members[memberIdx].status = "declined";
    }

    await team.save();

    res.json({ success: true, team });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Get team details
export const getTeam = async (req, res) => {
  try {
    const { teamId } = req.params;
    const team = await Team.findById(teamId)
      .populate("eventId", "eventName eventType")
      .populate("leaderId", "firstname lastname email")
      .populate("members.userId", "firstname lastname email");

    if (!team)
      return res.status(404).json({ success: false, error: "Team not found" });

    res.json({ success: true, team });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Get teams for an event
export const getEventTeams = async (req, res) => {
  try {
    const { eventId } = req.params;
    const teams = await Team.find({ eventId }).populate(
      "leaderId members.userId",
    );

    res.json({ success: true, teams });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Get user's teams
export const getUserTeams = async (req, res) => {
  try {
    const userId = req.user._id;
    const teams = await Team.find({ "members.userId": userId })
      .populate("eventId", "eventName")
      .populate("leaderId", "firstname lastname");

    res.json({ success: true, teams });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Delete team (leader only)
export const deleteTeam = async (req, res) => {
  try {
    const { teamId } = req.params;
    const userId = req.user._id;

    const team = await Team.findById(teamId);
    if (!team)
      return res.status(404).json({ success: false, error: "Team not found" });

    if (String(team.leaderId) !== String(userId)) {
      return res
        .status(403)
        .json({ success: false, error: "Only leader can delete team" });
    }

    // Prevent deletion if registration complete
    if (team.registrationComplete) {
      return res
        .status(400)
        .json({ success: false, error: "Cannot delete a completed team" });
    }

    await Team.findByIdAndDelete(teamId);

    res.json({ success: true, message: "Team deleted" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
