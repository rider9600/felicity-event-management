import fetch from "node-fetch";

// Post new event to Discord via webhook
export const postToDiscord = async (webhookUrl, eventDetails) => {
  if (!webhookUrl) return false;
  try {
    const message = {
      embeds: [
        {
          title: `New Event: ${eventDetails.eventName}`,
          description:
            eventDetails.eventDescription || "No description provided.",
          color: 0x00ff00,
          fields: [
            { name: "Type", value: eventDetails.eventType, inline: true },
            {
              name: "Start Date",
              value: eventDetails.eventStartDate,
              inline: true,
            },
            {
              name: "End Date",
              value: eventDetails.eventEndDate,
              inline: true,
            },
            {
              name: "Registration Fee",
              value: `₹${eventDetails.registrationFee || 0}`,
              inline: true,
            },
            {
              name: "Registration Deadline",
              value: eventDetails.registrationDeadline,
              inline: true,
            },
          ],
          footer: { text: "Felicity Platform" },
        },
      ],
    };
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(message),
    });
    return response.ok;
  } catch (err) {
    console.error("Discord webhook error:", err);
    return false;
  }
};
