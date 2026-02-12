import axios from "axios";
import { API_BASE_URL } from "../utils/constants";

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor - add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor - handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

// Auth APIs
export const authAPI = {
  signup: (data) => api.post("/auth/signup", data),
  login: (data) => api.post("/auth/login", data),
  getProfile: () => api.get("/auth/profile"),
  updateProfile: (data) => api.put("/auth/profile", data),
  changePassword: (data) => api.put("/auth/change-password", data),
};

// Participant APIs
export const participantAPI = {
  updatePreferences: (data) => api.put("/participant/preferences", data),
  getRegistrations: () => api.get("/participant/registrations"),
  getFollowedOrganizers: () => api.get("/participant/followed-organizers"),
  followOrganizer: (organizerId) =>
    api.post(`/participant/follow/${organizerId}`),
  unfollowOrganizer: (organizerId) =>
    api.delete(`/participant/follow/${organizerId}`),
  getOrganizerDetail: (organizerId) =>
    api.get(`/participant/organizers/${organizerId}`),
};

// Event APIs
export const eventAPI = {
  getAll: (params) => api.get("/events", { params }),
  getById: (id) => api.get(`/events/${id}`),
  getTrending: () => api.get("/events/trending"),
  register: (id, data) => api.post(`/events/${id}/register`, data),
  purchaseMerchandise: (id, data) => api.post(`/events/${id}/purchase`, data),
  getTicket: (ticketId) => api.get(`/tickets/${ticketId}`),
};

// Organizer APIs
export const organizerAPI = {
  // For participant-side organizers listing, use participant organizers endpoint
  getAll: (params) => api.get("/participant/organizers", { params }),
  getById: (id) => api.get(`/organizers/${id}`),
  updateProfile: (data) => api.put("/organizer/profile", data),
  createEvent: (data) => api.post("/organizer/events", data),
  updateEvent: (id, data) => api.put(`/organizer/events/${id}`, data),
  getMyEvents: () => api.get("/organizer/events"),
  getEventAnalytics: (id) => api.get(`/organizer/events/${id}/analytics`),
  getEventParticipants: (id, params) =>
    api.get(`/organizer/events/${id}/participants`, { params }),
  exportParticipants: (id) =>
    api.get(`/organizer/events/${id}/participants/export`, {
      responseType: "blob",
    }),
  markAttendance: (eventId, participantId) =>
    api.post(`/organizer/events/${eventId}/attendance/${participantId}`),
  updateWebhook: (data) => api.put("/organizer/webhook", data),
  publishEvent: (id) => api.put(`/organizer/events/${id}/publish`),
};

// Admin APIs
export const adminAPI = {
  getOrganizers: () => api.get("/admin/organizers"),
  createOrganizer: (data) => api.post("/admin/organizers", data),
  disableOrganizer: (id) => api.put(`/admin/organizers/${id}/disable`),
  enableOrganizer: (id) => api.put(`/admin/organizers/${id}/enable`),
  deleteOrganizer: (id) => api.delete(`/admin/organizers/${id}`),
  resetPassword: (userId, data) =>
    api.put(`/admin/users/${userId}/reset-password`, data),
  getPasswordResetRequests: () => api.get("/admin/password-reset-requests"),
  handlePasswordReset: (id, data) =>
    api.post(`/admin/password-reset/${id}`, data),
  getStats: () => api.get("/admin/stats"),
};

export default api;
