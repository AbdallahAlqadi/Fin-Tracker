import React, { useState } from "react";
import axios from "axios";
import { FaPaperPlane, FaCheckCircle, FaExclamationCircle } from "react-icons/fa";
import "../cssStyle/FeedbackForm.css";

const FeedbackForm = () => {
  const [feedback, setFeedback] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage({ text: "", type: "" });

    const username = sessionStorage.getItem("username");

    try {
      await axios.post("https://fin-tracker-ncbx.onrender.com/fedback", {
        username: username,
        message: feedback,
      });

      setMessage({ text: "Your feedback has been sent successfully! Thank you 💙", type: "success" });
      setFeedback("");
    } catch (error) {
      setMessage({ text: "An error occurred while sending. Please try again! ❌", type: "error" });
    }

    setSubmitting(false);
  };

  return (
    <div className="feedback-container">
      <div className="feedback-card">
        <h2 className="feedback-title">💬 Share Your Thoughts About the Site</h2>
        <p className="feedback-subtitle">Your feedback helps us improve your experience 💡</p>
        <form onSubmit={handleSubmit} className="feedback-form">
          <textarea
            className="feedback-textarea"
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Write your comment here..."
            required
          />
          <button type="submit" className="feedback-button" disabled={submitting}>
            {submitting ? "Sending..." : "Send"} <FaPaperPlane />
          </button>
        </form>
        {message.text && (
          <p className={`feedback-message ${message.type}`}>
            {message.type === "success" ? <FaCheckCircle /> : <FaExclamationCircle />} {message.text}
          </p>
        )}
      </div>
    </div>
  );
};

export default FeedbackForm;
