import axios from "axios";
import { getCurrentToken } from "../context/AuthContext.js";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

// Create axios instance with base configuration
const api = axios.create({
  baseURL: `${API_BASE_URL}/point`,
  timeout: 10000,
  withCredentials: false,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = getCurrentToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response interceptor to handle common errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - redirect to login
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

// API endpoints
export const authAPI = {
  login: (email, password) => api.post("/auth/login", { email, password }),
  register: (userData) => api.post("/auth/register", userData),
  logout: () => api.post("/auth/logout"),
};

export const eventsAPI = {
  getAll: () => api.get("/events"),
  getById: (id) => api.get(`/events/${id}`),
  create: (eventData) => api.post("/events", eventData),
  update: (id, eventData) => api.put(`/events/${id}`, eventData),
  delete: (id) => api.delete(`/events/${id}`),
};

export const registrationAPI = {
  register: (eventId, userData) =>
    api.post("/registration", { eventId, ...userData }),
  getMyRegistrations: () => api.get("/registration/my"),
  cancelRegistration: (registrationId) =>
    api.delete(`/registration/${registrationId}`),
};

export const ticketsAPI = {
  getMyTickets: () => api.get("/tickets/my"),
  getTicket: (ticketId) => api.get(`/tickets/${ticketId}`),
};

export const dashboardAPI = {
  participant: () => api.get("/participant/dashboard"),
  organizer: () => api.get("/organizer/dashboard"),
  admin: () => api.get("/admin-dashboard"),
};

export const analyticsAPI = {
  organizer: () => api.get("/organizer-analytics"),
  admin: () => api.get("/admin-analytics"),
};

export default api;
