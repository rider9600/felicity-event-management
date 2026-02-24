import Ticket from "../models/ticket.js";
import Event from "../models/event.js";
import user from "../models/user.js";
import crypto from "crypto";

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
    if (event.customForm && Array.isArray(event.customForm.fields)) {
      const requiredFields =
        event.customForm.fields.filter((field) => field && field.required) ||
        [];

      for (const field of requiredFields) {
        const key = (field.name || field.label || "").toString();
        if (!key) continue;

        const value = formData ? formData[key] : undefined;
        if (
          value === undefined ||
          value === null ||
          (typeof value === "string" && value.trim() === "")
        ) {
          const label = field.label || field.name || "field";
          return res.status(400).json({
            msg: `Required field "${label}" is missing`,
          });
        }
      }
    }

    // Lock custom form after first registration if not already locked
    if (!event.customFormLocked && count === 0) {
      event.customFormLocked = true;
    }

    // Generate ticket in PENDING payment state (no QR yet)
    const ticketId = crypto.randomBytes(8).toString("hex");

    const ticket = new Ticket({
      ticketId,
      participantId,
      eventId,
      status: "active",
      registrationStatus: "pending",
      formData,
      // paymentStatus defaults to "pending"
    });

    // Update event registration count and save atomically
    await Promise.all([
      ticket.save(),
      Event.findByIdAndUpdate(eventId, {
        $inc: { registrationCount: 1 },
        customFormLocked: event.customFormLocked,
      }),
    ]);

    // Email is deferred — will be sent when organizer accepts the registration
    res.status(201).json({ success: true, msg: "Registration submitted. Awaiting organizer approval.", ticket });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Purchase merchandise event
export const purchaseMerchandise = async (req, res) => {
  try {
    const {
      eventId,
      itemName,
      size,
      color,
      variant,
      quantity: rawQty,
    } = req.body;
    const quantity = Math.max(1, parseInt(rawQty, 10) || 1);
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

    // Find merchandise item
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

    if (item.stock < quantity) {
      return res
        .status(400)
        .json({ msg: `Only ${item.stock} in stock, cannot purchase ${quantity}` });
    }

    // Check purchase limit (total existing + requested quantity)
    const existingPurchases = await Ticket.countDocuments({
      eventId,
      participantId,
      "purchaseDetails.name": itemName,
    });

    if (item.purchaseLimit && existingPurchases + quantity > item.purchaseLimit) {
      const remaining = item.purchaseLimit - existingPurchases;
      if (remaining <= 0) {
        return res
          .status(400)
          .json({ msg: "Purchase limit reached for this item" });
      }
      return res.status(400).json({
        msg: `Purchase limit is ${item.purchaseLimit}. You can buy ${remaining} more.`,
      });
    }

    // Generate ticket in PENDING payment state (no QR yet)
    const ticketId = crypto.randomBytes(8).toString("hex");

    const ticket = new Ticket({
      ticketId,
      participantId,
      eventId,
      status: "active",
      purchaseDetails: {
        itemId: item._id,
        name: itemName,
        size,
        color,
        variant,
        quantity,
        price: item.price || 0,
      },
      paymentStatus: "pending",
    });

    await ticket.save();

    res.status(201).json({
      success: true,
      msg: "Purchase created. Please upload payment proof to complete payment.",
      ticket,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
