// API Base URL - update this when backend is deployed
export const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// User Roles
export const USER_ROLES = {
  PARTICIPANT: "participant",
  ORGANIZER: "organizer",
  ADMIN: "admin",
};

// Participant Types
export const PARTICIPANT_TYPES = {
  IIIT: "iiit",
  NON_IIIT: "non-iiit",
};

// Event Types
export const EVENT_TYPES = {
  NORMAL: "normal",
  MERCHANDISE: "merchandise",
};

// Event Status
export const EVENT_STATUS = {
  DRAFT: "draft",
  PUBLISHED: "published",
  ONGOING: "ongoing",
  COMPLETED: "completed",
  CLOSED: "closed",
};

// Registration Status
export const REGISTRATION_STATUS = {
  REGISTERED: "registered",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
  REJECTED: "rejected",
};

// Organizer Categories
export const ORGANIZER_CATEGORIES = [
  "Technical Club",
  "Cultural Club",
  "Sports Club",
  "Fest Team",
  "Council",
  "Other",
];

// Areas of Interest
export const AREAS_OF_INTEREST = [
  "Technology",
  "Coding",
  "AI/ML",
  "Web Development",
  "App Development",
  "Cybersecurity",
  "Robotics",
  "Music",
  "Dance",
  "Drama",
  "Art",
  "Photography",
  "Sports",
  "Gaming",
  "Literature",
  "Entrepreneurship",
  "Social Service",
];

// Form Field Types
export const FORM_FIELD_TYPES = {
  TEXT: "text",
  TEXTAREA: "textarea",
  EMAIL: "email",
  NUMBER: "number",
  DATE: "date",
  DROPDOWN: "dropdown",
  CHECKBOX: "checkbox",
  RADIO: "radio",
  FILE: "file",
};
