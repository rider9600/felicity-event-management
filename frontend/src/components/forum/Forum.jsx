import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import { useApi } from "../../hooks/useApi";
import { useForumSocket } from "../../hooks/useForumSocket";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";
import "./Forum.css";

const Forum = ({ eventId }) => {
  const { user } = useAuth();
  const { apiCall } = useApi();

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterType, setFilterType] = useState("all");
  const [sortBy, setSortBy] = useState("recent");
  const [notificationBadge, setNotificationBadge] = useState(0);

  const loadForumPosts = async () => {
    try {
      const result = await apiCall(`/point/forum/${eventId}`, {
        method: "GET",
      });

      console.log("Forum API Response:", result);

      if (result.success && result.posts) {
        const unreadCount = result.posts.filter(
          (p) =>
            p.createdAt >
            (localStorage.getItem(`forum_${eventId}_lastRead`) || 0),
        ).length;

        setNotificationBadge(unreadCount);
        setMessages(result.posts);
        setError(null);
      } else {
        setError(result.error || "Failed to load forum posts");
      }
    } catch (err) {
      console.error("Error loading forum posts:", err);
      setError(err.message || "Error loading forum posts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadForumPosts();
    const interval = setInterval(loadForumPosts, 5000);
    return () => clearInterval(interval);
  }, [eventId]);

  // 👇 fixed callback deps (prevents stale updates)
  const handleSocketMessage = useCallback(() => {
    loadForumPosts();
  }, [eventId]);

  useForumSocket(eventId, handleSocketMessage, localStorage.getItem("token"));

  const handlePostMessage = async (content, type) => {
    try {
      const result = await apiCall(`/point/forum/${eventId}`, {
        method: "POST",
        body: JSON.stringify({ content, type, parentPostId: null }),
      });

      if (result.success) {
        setMessages((prev) => [result.post || result.data?.post, ...prev]);
        setError(null);
      } else {
        setError("Failed to post message");
      }
    } catch (err) {
      console.error("Error posting message:", err);
      setError("Error posting message");
    }
  };

  const handleReplyToMessage = async (parentPostId, content) => {
    try {
      const result = await apiCall(`/point/forum/${eventId}`, {
        method: "POST",
        body: JSON.stringify({ content, type: "message", parentPostId }),
      });

      if (result.success) {
        setMessages((prev) => [...prev, result.post || result.data?.post]);
        setError(null);
      } else {
        setError("Failed to post reply");
      }
    } catch (err) {
      console.error("Error posting reply:", err);
      setError("Error posting reply");
    }
  };

  const handleDeleteMessage = async (postId) => {
    try {
      const result = await apiCall(`/point/forum/${eventId}/${postId}`, {
        method: "DELETE",
      });

      if (result.success) {
        setMessages((prev) => prev.filter((m) => m._id !== postId));
        setError(null);
      } else {
        setError("Failed to delete message");
      }
    } catch (err) {
      console.error("Error deleting message:", err);
      setError("Error deleting message");
    }
  };

  const handlePinMessage = async (postId) => {
    try {
      const result = await apiCall(`/point/forum/${eventId}/${postId}/pin`, {
        method: "PUT",
      });

      if (result.success) {
        setMessages((prev) =>
          prev.map((m) =>
            m._id === postId ? { ...m, isPinned: !m.isPinned } : m,
          ),
        );
        setError(null);
      } else {
        setError("Failed to pin message");
      }
    } catch (err) {
      console.error("Error pinning message:", err);
      setError("Error pinning message");
    }
  };

  const handleReactToMessage = async (postId, emoji) => {
    try {
      const result = await apiCall(`/point/forum/${eventId}/${postId}/react`, {
        method: "POST",
        body: JSON.stringify({ emoji }),
      });

      if (result.success) {
        setMessages((prev) =>
          prev.map((m) =>
            m._id === postId ? { ...m, reactions: result.reactions } : m,
          ),
        );
        setError(null);
      } else {
        setError("Failed to add reaction");
      }
    } catch (err) {
      console.error("Error reacting to message:", err);
      setError("Error reacting to message");
    }
  };

  const filteredMessages = messages.filter((m) => {
    if (filterType === "announcements") return m.type === "announcement";
    if (filterType === "questions") return m.type === "question";
    return true;
  });

  // Separate pinned and unpinned messages
  const pinnedMessages = filteredMessages.filter((m) => m.isPinned);
  const unpinnedMessages = filteredMessages.filter((m) => !m.isPinned);

  // Sort unpinned messages based on sortBy selection
  const sortedUnpinnedMessages = [...unpinnedMessages].sort((a, b) => {
    if (sortBy === "oldest")
      return new Date(a.createdAt) - new Date(b.createdAt);
    // Default to recent (newest first)
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  // Combine: pinned messages first, then unpinned sorted messages
  const sortedMessages = [...pinnedMessages, ...sortedUnpinnedMessages];

  return (
    <div className="forum-container">
      <div className="forum-header">
        <div className="forum-title-section">
          <h3>💬 Event Forum</h3>
          {notificationBadge > 0 && (
            <span className="notification-badge">{notificationBadge}</span>
          )}
        </div>

        <div className="forum-controls">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="forum-filter"
          >
            <option value="all">All Messages</option>
            <option value="announcements">Announcements Only</option>
            <option value="questions">Questions Only</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="forum-sort"
          >
            <option value="recent">Recent First</option>
            <option value="oldest">Oldest First</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="forum-error">
          ⚠️ {error}
          <button
            onClick={() => {
              setError(null);
              loadForumPosts();
            }}
            style={{
              marginLeft: "10px",
              padding: "4px 12px",
              background: "#ef4444",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "0.9rem",
            }}
          >
            Retry
          </button>
        </div>
      )}

      <div className="forum-content">
        <MessageInput onPostMessage={handlePostMessage} eventId={eventId} />

        {loading ? (
          <div className="forum-loading">
            ⏳ Loading forum for event: {eventId}...
            <p
              style={{
                fontSize: "0.85rem",
                color: "#888",
                marginTop: "8px",
              }}
            >
              If this takes too long, make sure backend is running on
              http://localhost:5000
            </p>
          </div>
        ) : sortedMessages.length === 0 ? (
          <div className="forum-empty">
            <p>No messages yet. Be the first to post! 🚀</p>
          </div>
        ) : (
          <>
            {pinnedMessages.length > 0 && (
              <div className="pinned-section">
                <div className="pinned-header">
                  📌 <strong>Pinned Messages</strong> ({pinnedMessages.length})
                </div>
              </div>
            )}
            <MessageList
              messages={sortedMessages}
              onReply={handleReplyToMessage}
              onDelete={handleDeleteMessage}
              onPin={handlePinMessage}
              onReact={handleReactToMessage}
              eventId={eventId}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default Forum;
