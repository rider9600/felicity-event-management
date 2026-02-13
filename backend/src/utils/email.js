import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
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
  try {
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
        <p><strong>Status:</strong> ${ticketDetails.status}</p>
        <p>Scan the QR code below at the event:</p>
        <img src="${qrCodeDataURL}" alt="Ticket QR Code" />
        <p>Thank you for registering!</p>
      `,
    };
    await transporter.sendMail(mailOptions);
    return true;
  } catch (err) {
    console.error("Email sending error:", err);
    return false;
  }
};

// Send generic email
export const sendEmail = async (to, subject, htmlContent) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to,
      subject,
      html: htmlContent,
    };
    await transporter.sendMail(mailOptions);
    return true;
  } catch (err) {
    console.error("Email sending error:", err);
    return false;
  }
};
