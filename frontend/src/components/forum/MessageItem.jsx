import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import "./MessageItem.css";

const MessageItem = ({
  message,
  onReply,
  onDelete,
  onPin,
  onReact,
  isParent = false,
  isReply = false,
}) => {
  const { user } = useAuth();
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showActions, setShowActions] = useState(false);

  const isOrganizer = user?.role === "organizer" || user?.role === "admin";
  const isAuthor = String(message.authorId?._id) === String(user?._id);
  const canModerate = isOrganizer || isAuthor;
  const canDelete = isOrganizer || isAuthor;

  const emojis = ["👍", "❤️", "😂", "😮", "😢", "🔥", "🎉", "👏"];

  const getMessageTypeIcon = () => {
    switch (message.type) {
      case "announcement":
        return "📢";
      case "question":
        return "❓";
      default:
        return "💬";
    }
  };

  const getReactionCount = (emoji) => {
    return message.reactions?.filter((r) => r.emoji === emoji).length || 0;
  };

  const getUserReaction = (emoji) => {
    return message.reactions?.some(
      (r) => r.emoji === emoji && String(r.userId) === String(user?._id),
    );
  };

  const formatDate = (date) => {
    const d = new Date(date);
    const now = new Date();
    const diffMs = now - d;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString();
  };

  return (
    <div
      className={`message-item ${isReply ? "message-reply" : "message-parent"} ${
        message.isPinned ? "pinned-message" : ""
      }`}
    >
      <div className="message-header">
        <div className="message-author-info">
          <div className="author-avatar">
            {message.authorId?.firstname?.charAt(0) || "U"}
          </div>
          <div className="author-details">
            <div className="author-name">
              <span className="author-role">
                {message.authorId?.role === "organizer"
                  ? "🎯 Organizer"
                  : message.authorId?.role === "admin"
                    ? "⚙️ Admin"
                    : "👤 Participant"}
              </span>
              <strong>
                {message.authorId?.firstname} {message.authorId?.lastname}
              </strong>
              {message.isPinned && (
                <span className="pinned-badge">📌 Pinned</span>
              )}
            </div>
            <div className="message-meta">
              {getMessageTypeIcon()} {message.type} •{" "}
              {formatDate(message.createdAt)}
            </div>
          </div>
        </div>

        {canModerate && (
          <div className="message-actions">
            <button
              className="action-btn"
              onClick={() => setShowActions(!showActions)}
              title="More actions"
            >
              ⋮
            </button>
            {showActions && (
              <div className="action-dropdown">
                {isParent && isOrganizer && (
                  <button
                    className="action-item"
                    onClick={() => {
                      onPin(message._id);
                      setShowActions(false);
                    }}
                  >
                    {message.isPinned ? "📍 Unpin" : "📌 Pin"}
                  </button>
                )}
                {canDelete && (
                  <button
                    className="action-item danger"
                    onClick={() => {
                      onDelete(message._id);
                      setShowActions(false);
                    }}
                  >
                    🗑️ Delete
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="message-content">{message.content}</div>

      <div className="message-footer">
        <div className="message-reactions">
          {emojis.map((emoji) => {
            const count = getReactionCount(emoji);
            const hasUserReacted = getUserReaction(emoji);
            return count > 0 || hasUserReacted ? (
              <button
                key={emoji}
                className={`reaction-btn ${hasUserReacted ? "active" : ""}`}
                onClick={() => onReact(message._id, emoji)}
                title={`You reacted with ${emoji}`}
              >
                {emoji}{" "}
                {count > 0 && <span className="reaction-count">{count}</span>}
              </button>
            ) : null;
          })}

          <button
            className="reaction-add-btn"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            title="Add reaction"
          >
            +
          </button>

          {showEmojiPicker && (
            <div className="emoji-picker">
              {emojis.map((emoji) => (
                <button
                  key={emoji}
                  className="emoji-option"
                  onClick={() => {
                    onReact(message._id, emoji);
                    setShowEmojiPicker(false);
                  }}
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>

        {isParent && !isReply && (
          <button className="reply-btn" onClick={onReply}>
            💬 Reply
          </button>
        )}
      </div>
    </div>
  );
};

export default MessageItem;
