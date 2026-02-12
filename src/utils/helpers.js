import { format } from "date-fns";

// Format date to readable string
export const formatDate = (date, formatStr = "PPP") => {
  if (!date) return "";
  return format(new Date(date), formatStr);
};

// Format date and time
export const formatDateTime = (date) => {
  if (!date) return "";
  return format(new Date(date), "PPP p");
};

// Format currency
export const formatCurrency = (amount) => {
  return `₹${amount.toLocaleString("en-IN")}`;
};

// Truncate text
export const truncateText = (text, maxLength = 100) => {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
};

// Generate unique ID
export const generateId = () => {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

// Download blob as file
export const downloadFile = (blob, filename) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

// Get initials from name
export const getInitials = (firstName, lastName) => {
  return `${firstName?.charAt(0) || ""}${lastName?.charAt(0) || ""}`.toUpperCase();
};

// Check if registration is open
export const isRegistrationOpen = (event) => {
  const now = new Date();
  const deadline = new Date(event.registrationDeadline);
  return now < deadline && event.status === "published";
};
