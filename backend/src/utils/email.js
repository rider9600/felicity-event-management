import nodemailer from "nodemailer";

// Check if email credentials are actually configured (not placeholder values)
const emailConfigured = () => {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;
  return (
    user &&
    pass &&
    !user.includes("your_email") &&
    !user.includes("your_gmail") &&
    !pass.includes("your_app_password") &&
    !pass.includes("your_16char")
  );
};

const createTransporter = () =>
  nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

// Send email with ticket details
export const sendTicketEmail = async (
  to,
  subject,
  ticketDetails,
  qrCodeDataURL,
) => {
  if (!emailConfigured()) {
    console.log(
      `[Email] Skipping ticket email to ${to} — EMAIL_USER/EMAIL_PASS not configured.`,
    );
    return false;
  }
  try {
    const transporter = createTransporter();
    const base64Data = qrCodeDataURL.replace(/^data:image\/png;base64,/, "");
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to,
      subject,
      html: `
    <h2>Your Ticket for ${ticketDetails.eventName}</h2>
    <p><strong>Ticket ID:</strong> ${ticketDetails.ticketId}</p>
    <p><strong>Event:</strong> ${ticketDetails.eventName}</p>
    <p><strong>Event Type:</strong> ${ticketDetails.eventType}</p>
    <p><strong>Date:</strong> ${ticketDetails.eventDate}</p>
    <p><strong>Venue:</strong> ${ticketDetails.venue || "TBD"}</p>
    <p><strong>Participant:</strong> ${ticketDetails.participantName}</p>
    <p><strong>Status:</strong> ${ticketDetails.status}</p>
    ${ticketDetails.purchaseItem ? `<p><strong>Item:</strong> ${ticketDetails.purchaseItem} (${ticketDetails.purchaseSize})</p>` : ""}
    <p>Scan the QR code below at the event:</p>
    <img src="cid:qrcode" alt="Ticket QR Code" />
    <p>Thank you for registering!</p>
  `,
      attachments: [
        {
          filename: "qrcode.png",
          content: base64Data,
          encoding: "base64",
          cid: "qrcode", // must match the cid in the img src
        },
      ],
    };
    await transporter.sendMail(mailOptions);
    console.log(`[Email] Ticket email sent to ${to}`);
    return true;
  } catch (err) {
    console.error("Email sending error:", err.message);
    return false;
  }
};

// Send generic email
export const sendEmail = async (to, subject, htmlContent) => {
  if (!emailConfigured()) {
    console.log(
      `[Email] Skipping email to ${to} — EMAIL_USER/EMAIL_PASS not configured.`,
    );
    return false;
  }
  try {
    const transporter = createTransporter();
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to,
      subject,
      html: htmlContent,
    };
    await transporter.sendMail(mailOptions);
    return true;
  } catch (err) {
    console.error("Email sending error:", err.message);
    return false;
  }
};
