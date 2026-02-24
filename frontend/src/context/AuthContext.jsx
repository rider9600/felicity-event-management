import React, { createContext, useContext, useReducer, useEffect } from "react";
const AuthContext = createContext();

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
const authReducer = (state, action) => {
  switch (action.type) {
    case "LOGIN_START":
      return {
        ...state,
        loading: true,
        error: null,
      };
    case "LOGIN_SUCCESS":
      return {
        ...state,
        loading: false,
        isAuthenticated: true,
        user: action.payload.user,
        token: action.payload.token,
        error: null,
      };
    case "LOGIN_FAILURE":
      return {
        ...state,
        loading: false,
        isAuthenticated: false,
        user: null,
        token: null,
        error: action.payload,
      };
    case "LOGOUT":
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        token: null,
        error: null,
      };
    case "TOKEN_REFRESH":
      return {
        ...state,
        token: action.payload,
      };
    case "UPDATE_USER": {
      const mergedUser = { ...(state.user || {}), ...(action.payload || {}) };
      currentUser = mergedUser;
      try {
        localStorage.setItem("user", JSON.stringify(mergedUser));
      } catch {
        // ignore storage errors
      }
      return {
        ...state,
        user: mergedUser,
      };
    }
    case "CLEAR_ERROR":
      return {
        ...state,
        error: null,
      };
    default:
      return state;
  }
};

// import { useAuth } from "../context/AuthContext";
// import { useApi } from "../hooks/useApi";
const initialState = {
  isAuthenticated: false,
  user: null,
  token: null,
  loading: false,
  error: null,
};

// Global token storage for API requests
let currentToken = null;
let currentUser = null;
let currentRefreshToken = null;

// Called by useApi to update the token after a refresh
export const setCurrentToken = (newToken) => {
  currentToken = newToken;
  localStorage.setItem("token", newToken);
};
export const getStoredRefreshToken = () => {
  return currentRefreshToken || localStorage.getItem("refreshToken");
};

const loadStoredAuth = () => {
  try {
    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");
    const parsedUser = storedUser ? JSON.parse(storedUser) : null;
    return { token: storedToken, user: parsedUser };
  } catch (error) {
    return { token: null, user: null };
  }
};

// Token getter for API interceptors
export const getCurrentToken = () => {
  if (currentToken) {
    return currentToken;
  }
  try {
    return localStorage.getItem("token");
  } catch (error) {
    return null;
  }
};
export const getCurrentUser = () => currentUser;
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Restore auth state from localStorage on mount
  useEffect(() => {
    const { token, user } = loadStoredAuth();
    if (token && user) {
      currentToken = token;
      currentUser = user;
      dispatch({
        type: "LOGIN_SUCCESS",
        payload: { token, user },
      });
    }
  }, []);

  const login = async (email, password) => {
    dispatch({ type: "LOGIN_START" });

    try {
      // API call to backend for authentication
      const response = await fetch(`${API_BASE_URL}/point/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok && data.user) {
        const nextToken = data.token || null;
        const nextRefreshToken = data.refreshToken || null;
        currentToken = nextToken;
        currentRefreshToken = nextRefreshToken;
        currentUser = data.user;
        if (nextToken) {
          localStorage.setItem("token", nextToken);
        }
        if (nextRefreshToken) {
          localStorage.setItem("refreshToken", nextRefreshToken);
        }
        localStorage.setItem("user", JSON.stringify(data.user));

        dispatch({
          type: "LOGIN_SUCCESS",
          payload: {
            token: nextToken,
            user: data.user,
          },
        });
        return { success: true };
      } else {
        dispatch({
          type: "LOGIN_FAILURE",
          payload: data.msg || "Invalid email or password",
        });
        return {
          success: false,
          error: data.msg || "Invalid email or password",
        };
      }
    } catch (error) {
      const errorMessage =
        "Unable to connect to server. Please try again later.";
      dispatch({
        type: "LOGIN_FAILURE",
        payload: errorMessage,
      });
      return { success: false, error: errorMessage };
    }
  };

  const register = async (userData) => {
    dispatch({ type: "LOGIN_START" });

    try {
      console.log("Attempting registration with data:", userData);

      // API call to backend for registration
      const response = await fetch(`${API_BASE_URL}/point/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });

      console.log("Registration response status:", response.status);
      const data = await response.json();
      console.log("Registration response data:", data);

      if (response.ok && (data.user || data.email)) {
        // Auto-login after successful registration
        console.log("Registration successful, attempting login...");
        return await login(userData.email, userData.password);
      } else {
        console.log("Registration failed:", data);
        dispatch({
          type: "LOGIN_FAILURE",
          payload: data.msg || data.error || "Registration failed",
        });
        return {
          success: false,
          error: data.msg || data.error || "Registration failed",
        };
      }
    } catch (error) {
      console.error("Registration network error:", error);
      const errorMessage = "Network error. Please try again.";
      dispatch({
        type: "LOGIN_FAILURE",
        payload: errorMessage,
      });
      return { success: false, error: errorMessage };
    }
  };

const logout = async () => {
  try {
    const token = localStorage.getItem("token");
    if (token) {
      await fetch(
        `${
          import.meta.env.VITE_API_BASE_URL || "http://localhost:5000"
        }/point/auth/logout`,
        {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
    }
  } catch (error) {
    console.log("Logout request failed, clearing local session anyway", error);
  }

  // Clear local session regardless of server response
  currentToken = null;
  currentUser = null;
  localStorage.removeItem("token");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("user");
  dispatch({ type: "LOGOUT" });
};




  const updateUser = (userData) => {
    const updatedUser = { ...state.user, ...userData };
    currentUser = updatedUser;
    try {
      localStorage.setItem("user", JSON.stringify(updatedUser));
    } catch (error) {
      // Ignore storage errors
    }
    dispatch({ type: "UPDATE_USER", payload: userData });
  };

  const clearError = () => {
    dispatch({ type: "CLEAR_ERROR" });
  };

  const value = {
    ...state,
    login,
    register,
    logout,
    updateUser,
    clearError,
    dispatch,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default AuthContext;
