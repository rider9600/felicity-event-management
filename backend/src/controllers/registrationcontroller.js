import Ticket from "../models/ticket.js";
import Event from "../models/event.js";
import user from "../models/user.js";
import crypto from "crypto";
import { generateQRCode } from "../utils/qrcode.js";
import { sendTicketEmail } from "../utils/email.js";

// Register for a normal event
export const registerNormalEvent = async (req, res) => {
  try {
    const { eventId, formData } = req.body;
    const participantId = req.user._id;

    // Check for duplicate registration
    const existingTicket = await Ticket.findOne({ participantId, eventId });
    if (existingTicket) {
      return res.status(400).json({ msg: "Already registered for this event" });
    }

    const participant = await user.findById(participantId);
    const event = await Event.findById(eventId);

    if (!event || event.eventType !== "normal") {
      return res.status(400).json({ msg: "Invalid event type" });
    }

    // Check deadline
    if (new Date() > new Date(event.registrationDeadline)) {
      return res.status(400).json({ msg: "Registration deadline passed" });
    }

    // Check registration limit
    const count = await Ticket.countDocuments({ eventId });
    if (event.registrationLimit && count >= event.registrationLimit) {
      return res.status(400).json({ msg: "Registration limit reached" });
    }

    // Check eligibility
    if (event.eligibility) {
      if (
        event.eligibility === "iiit" &&
        participant.participantType !== "iiit"
      ) {
        return res.status(400).json({ msg: "Only IIIT students are eligible" });
      }
    }

    // Validate form data against custom form
    if (event.customForm && formData) 
    {
      const requiredFields = event.customForm.fields?.filter((field) => field.required) || [];
      for(const field of requiredFields) 
      {
        if(!formData[field.name]) 
        {
          return res.status(400).json({ msg: `Required field ${field.name} is missing` });
        }
      }
    }

    // Lock custom form after first registration if not already locked
    if (!event.customFormLocked && count === 0) {
      event.customFormLocked = true;
    }

    // Generate ticket
    const ticketId = crypto.randomBytes(8).toString("hex");
    const qrData = { ticketId, eventId, participantId };
    const qrCode = await generateQRCode(qrData);

    const ticket = new Ticket({
      ticketId,
      participantId,
      eventId,
      status: "active",
      qrCode,
      formData,
    });

    // Update event registration count and save atomically
    await Promise.all([
      ticket.save(),
      Event.findByIdAndUpdate(eventId, {
        $inc: { registrationCount: 1 },
        customFormLocked: event.customFormLocked,
      }),
    ]);

    // Send confirmation email
    await sendTicketEmail(
      participant.email,
      `Your Ticket for ${event.eventName}`,
      {
        ticketId,
        eventName: event.eventName,
        eventType: event.eventType,
        eventDate: event.eventStartDate,
        status: "active",
      },
      qrCode,
    );

    res.status(201).json({ msg: "Registered successfully", ticket });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Purchase merchandise event
export const purchaseMerchandise = async (req, res) => {
  try {
    const { eventId, itemName, size, color, variant } = req.body;
    const participantId = req.user._id;

    const participant = await user.findById(participantId);
    const event = await Event.findById(eventId);

    if (!event || event.eventType !== "merchandise") {
      return res.status(400).json({ msg: "Invalid event type" });
    }

    // Check deadline
    if (new Date() > new Date(event.registrationDeadline)) {
      return res.status(400).json({ msg: "Purchase deadline passed" });
    }

    // Find item index for atomic update
    const itemIndex = event.merchandise.items.findIndex(
      (i) =>
        i.name === itemName &&
        i.size === size &&
        i.color === color &&
        i.variant === variant,
    );

    if (itemIndex === -1) {
      return res.status(400).json({ msg: "Item not found" });
    }

    const item = event.merchandise.items[itemIndex];

    if (item.stock <= 0) {
      return res.status(400).json({ msg: "Item out of stock" });
    }

    // Check for duplicate purchase
    const existingPurchase = await Ticket.findOne({
      eventId,
      participantId,
      "purchaseDetails.name": itemName,
      "purchaseDetails.size": size,
      "purchaseDetails.color": color,
      "purchaseDetails.variant": variant,
    });

    if (existingPurchase) {
      return res.status(400).json({ msg: "Already purchased this item" });
    }

    // Check purchase limit
    const purchases = await Ticket.countDocuments({
      eventId,
      participantId,
      "purchaseDetails.name": itemName,
    });

    if (item.purchaseLimit && purchases >= item.purchaseLimit) {
      return res.status(400).json({ msg: "Purchase limit reached" });
    }

    // Atomic stock decrement using MongoDB $inc operator
    const updateResult = await Event.updateOne(
      {
        _id: eventId,
        [`merchandise.items.${itemIndex}.stock`]: { $gt: 0 },
      },
      {
        $inc: {
          [`merchandise.items.${itemIndex}.stock`]: -1,
          registrationCount: 1,
          revenue: item.price || 0,
        },
      },
    );

    if (updateResult.modifiedCount === 0) {
      return res
        .status(400)
        .json({ msg: "Item out of stock or concurrent purchase" });
    }

    // Generate ticket
    const ticketId = crypto.randomBytes(8).toString("hex");
    const qrData = { ticketId, eventId, participantId, item: itemName };
    const qrCode = await generateQRCode(qrData);

    const ticket = new Ticket({
      ticketId,
      participantId,
      eventId,
      status: "active",
      qrCode,
      purchaseDetails: {
        name: itemName,
        size,
        color,
        variant,
        price: item.price || 0,
      },
      paymentStatus: "paid",
    });

    await ticket.save();

    // Send confirmation email
    await sendTicketEmail(
      participant.email,
      `Your Purchase for ${event.eventName}`,
      {
        ticketId,
        eventName: event.eventName,
        eventType: event.eventType,
        eventDate: event.eventStartDate,
        status: "active",
      },
      qrCode,
    );

    res.status(201).json({ msg: "Purchase successful", ticket });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
