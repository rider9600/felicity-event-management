import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import "./MessageInput.css";

const MessageInput = ({ onPostMessage, eventId }) => {
  const { user } = useAuth();
  const [content, setContent] = useState("");
  const [type, setType] = useState("message"); // message, question, announcement (only for organizers)
  const [posting, setPosting] = useState(false);

  const isOrganizer = user?.role === "organizer" || user?.role === "admin";

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;

    setPosting(true);
    try {
      await onPostMessage(content, type);
      setContent("");
      setType("message");
    } catch (error) {
      console.error("Error posting message:", error);
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="message-input-container">
      <div className="user-avatar">{user?.firstname?.charAt(0) || "U"}</div>

      <form onSubmit={handleSubmit} className="message-input-form">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Share your thoughts, ask a question, or leave a comment..."
          className="message-textarea"
          rows="3"
          disabled={posting}
        />

        <div className="message-input-footer">
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="message-type-select"
            disabled={posting}
          >
            <option value="message">💬 Message</option>
            <option value="question">❓ Question</option>
            {isOrganizer && (
              <option value="announcement">📢 Announcement</option>
            )}
          </select>

          <button
            type="submit"
            className="btn-post"
            disabled={!content.trim() || posting}
          >
            {posting ? "Posting..." : "Post"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default MessageInput;
