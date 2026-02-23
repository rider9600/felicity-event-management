import { useState, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { setCurrentToken, getStoredRefreshToken } from "../context/AuthContext";

export const useApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { token, logout, dispatch } = useAuth();

  // Prevent multiple simultaneous refresh attempts
  const isRefreshing = useRef(false);

  const doRefresh = async () => {
    if (isRefreshing.current) return null;
    isRefreshing.current = true;
    try {
      const refreshToken = getStoredRefreshToken();
      if (!refreshToken) return null;

      const res = await fetch("http://localhost:5000/point/auth/refresh-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });
      if (!res.ok) return null;
      const data = await res.json();
      if (!data.token) return null;

      // Persist and update the new token everywhere
      setCurrentToken(data.token);
      // Also update React context state so useAuth().token is current
      if (typeof dispatch === "function") {
        dispatch({ type: "TOKEN_REFRESH", payload: data.token });
      }
      return data.token;
    } catch {
      return null;
    } finally {
      isRefreshing.current = false;
    }
  };

  const apiCall = async (url, options = {}) => {
    setLoading(true);
    setError(null);

    const makeRequest = async (accessToken) => {
      const config = {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
          ...options.headers,
        },
      };
      return fetch(`http://localhost:5000${url}`, config);
    };

    try {
      let response = await makeRequest(token);

      // If 401 — attempt silent refresh then retry once
      if (response.status === 401) {
        const newToken = await doRefresh();
        if (newToken) {
          // Retry original request with the fresh token
          response = await makeRequest(newToken);
        } else {
          // Refresh also failed → force logout
          logout();
          throw new Error("Session expired. Please login again.");
        }
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.msg || data.error || "Something went wrong");
      }

      setLoading(false);
      return data;
    } catch (err) {
      setError(err.message);
      setLoading(false);
      return { success: false, error: err.message };
    }
  };

  return { loading, error, apiCall, setError };
};


// Specific API functions
export const useEventApi = () => {
  const { apiCall, loading, error } = useApi();

  const getEvents = () => apiCall("/point/events");
  const getEventById = (id) => apiCall(`/point/events/${id}`);
  const createEvent = (eventData) =>
    apiCall("/point/events", {
      method: "POST",
      body: JSON.stringify(eventData),
    });
  const updateEvent = (id, eventData) =>
    apiCall(`/point/events/${id}`, {
      method: "PUT",
      body: JSON.stringify(eventData),
    });
  const deleteEvent = (id) =>
    apiCall(`/point/events/${id}`, {
      method: "DELETE",
    });
  const searchEvents = (params) => {
    const queryString = new URLSearchParams(params).toString();
    return apiCall(`/point/events/search?${queryString}`);
  };

  return {
    loading,
    error,
    getEvents,
    getEventById,
    createEvent,
    updateEvent,
    deleteEvent,
    searchEvents,
  };
};

export const useTicketApi = () => {
  const { apiCall, loading, error } = useApi();

  const getMyTickets = () => apiCall("/point/tickets/my");
  const registerForEvent = (eventData) =>
    apiCall("/point/registration/register", {
      method: "POST",
      body: JSON.stringify(eventData),
    });
  const purchaseMerchandise = (purchaseData) =>
    apiCall("/point/registration/purchase", {
      method: "POST",
      body: JSON.stringify(purchaseData),
    });

  return {
    loading,
    error,
    getMyTickets,
    registerForEvent,
    purchaseMerchandise,
  };
};
