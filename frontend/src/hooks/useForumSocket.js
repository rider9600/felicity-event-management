import { useEffect, useRef } from "react";
import io from "socket.io-client";

// Socket.io connection for real-time forum updates
let socket = null;

const SOCKET_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL || window.location.origin).replace(
    /\/point$/,
    "",
  );

export const useForumSocket = (eventId, onNewMessage, token) => {
  const socketRef = useRef(null);

  useEffect(() => {
    if (!eventId) return;

    // Connect to WebSocket if not already connected
    if (!socket) {
      socket = io(SOCKET_BASE_URL, {
        auth: {
          token: token || localStorage.getItem("token"),
        },
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5,
      });
    }

    socketRef.current = socket;

    // Join forum room
    socket.emit("join_forum", eventId);

    // Listen for new messages
    socket.on("newForumMessage", (data) => {
      if (onNewMessage) {
        onNewMessage(data);
      }
    });

    // Listen for message updates (reactions, pins, deletes)
    socket.on("forumMessageUpdated", (data) => {
      if (onNewMessage) {
        onNewMessage(data);
      }
    });

    // Listen for message deleted
    socket.on("forumMessageDeleted", (data) => {
      if (onNewMessage) {
        onNewMessage(data);
      }
    });

    // Listen for typing indicators
    socket.on("forum_user_typing", (data) => {
      // Can be used to show typing indicators
    });

    socket.on("forum_user_stopped_typing", (data) => {
      // Can be used to hide typing indicators
    });

    return () => {
      // Leave forum room but don't disconnect socket
      socket.emit("leave_forum", eventId);
    };
  }, [eventId, onNewMessage, token]);

  return socketRef.current;
};

export const disconnectForumSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export default useForumSocket;
