import React, { useState } from "react";
import MessageItem from "./MessageItem";
import "./MessageList.css";

const MessageList = ({
  messages,
  onReply,
  onDelete,
  onPin,
  onReact,
  eventId,
}) => {
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyContent, setReplyContent] = useState("");

  // Get only parent messages (no parentPostId)
  const parentMessages = messages.filter((m) => !m.parentPostId);

  const getReplies = (parentId) => {
    return messages.filter((m) => String(m.parentPostId) === String(parentId));
  };

  const handleSendReply = (parentId) => {
    if (replyContent.trim()) {
      onReply(parentId, replyContent);
      setReplyContent("");
      setReplyingTo(null);
    }
  };

  return (
    <div className="message-list">
      {parentMessages.map((parentMessage) => {
        const replies = getReplies(parentMessage._id);
        return (
          <div key={parentMessage._id} className="message-thread">
            <MessageItem
              message={parentMessage}
              onReply={() => setReplyingTo(parentMessage._id)}
              onDelete={onDelete}
              onPin={onPin}
              onReact={onReact}
              isParent
            />

            {/* Thread replies */}
            {replies.length > 0 && (
              <div className="thread-replies">
                {replies.map((reply) => (
                  <MessageItem
                    key={reply._id}
                    message={reply}
                    onReply={() => {}}
                    onDelete={onDelete}
                    onPin={() => {}}
                    onReact={onReact}
                    isReply
                  />
                ))}
              </div>
            )}

            {/* Reply input for this thread */}
            {replyingTo === parentMessage._id && (
              <div className="reply-input-container">
                <textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="Write a reply..."
                  className="reply-textarea"
                  rows="3"
                />
                <div className="reply-actions">
                  <button
                    onClick={() => {
                      setReplyingTo(null);
                      setReplyContent("");
                    }}
                    className="btn-cancel"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleSendReply(parentMessage._id)}
                    className="btn-send"
                    disabled={!replyContent.trim()}
                  >
                    Send Reply
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default MessageList;
