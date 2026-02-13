import QRCode from "qrcode";

// Generate QR code as base64 data URL
export const generateQRCode = async (data) => {
  try {
    const qrCodeDataURL = await QRCode.toDataURL(JSON.stringify(data));
    return qrCodeDataURL;
  } catch (err) {
    console.error("QR Code generation error:", err);
    return null;
  }
};
