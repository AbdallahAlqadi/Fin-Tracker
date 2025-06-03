// src/components/Settings.jsx
import React, { useState } from "react";
import axios from "axios";
import {
  FaTrash,
  FaUserEdit,
  FaTimes,
  FaUserSlash,
  FaCommentDots,
  FaPaperPlane,
  FaCheckCircle,
  FaExclamationCircle,
} from "react-icons/fa";

function Settings() {
  // The token must have been stored previously in sessionStorage
  const token = sessionStorage.getItem("jwt");

  // State for modal visibility
  const [showEditModal, setShowEditModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

  // Form state for editing user data
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
  });

  // Feedback form state
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState({ text: "", type: "" });

  // Handle input changes in the edit form
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Submit updated user data
  const handleUpdateUser = async (e) => {
    e.preventDefault();
    if (!token) {
      alert("No valid token found. Please log in first.");
      return;
    }

    try {
      const response = await fetch("http://127.0.0.1:5004/api/updateuser", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Auth: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });
      const data = await response.json();

      if (response.ok) {
        alert("Your profile has been updated successfully.");
        setShowEditModal(false);
      } else {
        alert(data.message || "An error occurred while updating your profile.");
      }
    } catch (err) {
      console.error("Error updating user data:", err);
      alert("Unable to connect to the server. Please try again.");
    }
  };

  // Delete all budget items
  const handleDeleteAll = async () => {
    if (!token) {
      alert("No valid token found. Please log in first.");
      return;
    }

    if (!window.confirm("Are you sure you want to delete all budget items?")) {
      return;
    }

    try {
      const response = await fetch("http://127.0.0.1:5004/api/deleteallBudget", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Auth: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (response.ok) {
        alert("All budget items have been deleted successfully.");
      } else {
        alert(data.error || "An error occurred while attempting to delete.");
      }
    } catch (err) {
      console.error("Error deleting all budget items:", err);
      alert("Unable to connect to the server. Please try again.");
    }
  };

  // Delete user account
  const handleDeleteAccount = async () => {
    if (!token) {
      alert("No valid token found. Please log in first.");
      return;
    }

    if (!window.confirm("This action will permanently delete your account. Continue?")) {
      return;
    }

    try {
      const response = await fetch("http://127.0.0.1:5004/api/deleteuser", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Auth: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (response.ok) {
        alert("Your account has been deleted successfully.");
        sessionStorage.removeItem("jwt");
      } else {
        alert(data.message || "An error occurred while deleting your account.");
      }
    } catch (err) {
      console.error("Error deleting user account:", err);
      alert("Unable to connect to the server. Please try again.");
    }
  };

  // Submit feedback
  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    if (!token) {
      alert("No valid token found. Please log in first.");
      return;
    }

    setFeedbackSubmitting(true);
    setFeedbackMessage({ text: "", type: "" });

    const username = sessionStorage.getItem("username") || "";

    try {
      await axios.post("http://127.0.0.1:5004/api/fedback", {
        username: username,
        message: feedbackText,
      });

      setFeedbackMessage({
        text: "Your feedback has been sent successfully! Thank you 💙",
        type: "success",
      });
      setFeedbackText("");
    } catch (error) {
      setFeedbackMessage({
        text: "An error occurred while sending. Please try again! ❌",
        type: "error",
      });
    }

    setFeedbackSubmitting(false);
  };

  return (
    <div className="settings-container">
      <div className="settings-header">
        <h1>Account Settings</h1>
        <p className="settings-subtitle">Manage your account preferences and data</p>
      </div>

      <div className="settings-actions">
        {/* Delete All Budget Button */}
        <button
          className="settings-button danger-button"
          onClick={handleDeleteAll}
        >
          <FaTrash />
          <span>Delete All Budget</span>
        </button>

        {/* Edit Profile Button */}
        <button
          className="settings-button primary-button"
          onClick={() => setShowEditModal(true)}
        >
          <FaUserEdit />
          <span>Edit Profile</span>
        </button>

        {/* Delete Account Button */}
        <button
          className="settings-button warning-button"
          onClick={handleDeleteAccount}
        >
          <FaUserSlash />
          <span>Delete Account</span>
        </button>

        {/* Give Feedback Button */}
        <button
          className="settings-button success-button"
          onClick={() => setShowFeedbackModal(true)}
        >
          <FaCommentDots />
          <span>Give Feedback</span>
        </button>
      </div>

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Edit Profile</h2>
              <button className="modal-close" onClick={() => setShowEditModal(false)}>
                <FaTimes />
              </button>
            </div>
            <form onSubmit={handleUpdateUser}>
              <div className="form-group">
                <label htmlFor="username">Username</label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="New username"
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="New email"
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label htmlFor="password">Password</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="New password"
                  className="form-input"
                />
              </div>
              <button
                type="submit"
                className="form-button success-button"
              >
                Save Changes
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Feedback Modal */}
      {showFeedbackModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Send Feedback</h2>
              <button className="modal-close" onClick={() => setShowFeedbackModal(false)}>
                <FaTimes />
              </button>
            </div>
            <form onSubmit={handleFeedbackSubmit}>
              <div className="form-group">
                <textarea
                  name="feedback"
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  placeholder="Write your comment here..."
                  className="form-textarea"
                  required
                />
              </div>
              <button
                type="submit"
                className="form-button success-button"
                disabled={feedbackSubmitting}
              >
                {feedbackSubmitting ? "Sending..." : "Send Feedback"} <FaPaperPlane />
              </button>
            </form>
            {feedbackMessage.text && (
              <div
                className={`feedback-message ${
                  feedbackMessage.type === "success" ? "success" : "error"
                }`}
              >
                {feedbackMessage.type === "success" ? <FaCheckCircle /> : <FaExclamationCircle />}{" "}
                {feedbackMessage.text}
              </div>
            )}
          </div>
        </div>
      )}

      {/* CSS Styles */}
      <style jsx>{`
        /* Modern CSS Reset */
        *, *::before, *::after {
          box-sizing: border-box;
        }

        /* Main Container Styles */
        .settings-container {
          padding: 2.5rem 1.5rem;
          font-family: 'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif;
          max-width: 1200px;
          margin: 0 auto;
          color: #334155;
          background-color: #f8fafc;
          border-radius: 12px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        }

        /* Header Styles */
        .settings-header {
          text-align: center;
          margin-bottom: 2.5rem;
          padding-bottom: 1.5rem;
          border-bottom: 1px solid #e2e8f0;
        }

        .settings-header h1 {
          font-size: 2.25rem;
          font-weight: 700;
          color: #1e293b;
          margin-bottom: 0.5rem;
        }

        .settings-subtitle {
          font-size: 1rem;
          color: #64748b;
          margin-top: 0;
        }

        /* Button Container */
        .settings-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 1rem;
          justify-content: center;
          margin-bottom: 2rem;
        }

        /* Button Styles */
        .settings-button {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.875rem 1.5rem;
          font-size: 0.95rem;
          font-weight: 600;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          min-width: 200px;
          justify-content: center;
        }

        .settings-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .settings-button:active {
          transform: translateY(0);
        }

        .primary-button {
          background-color: #3b82f6;
          color: white;
        }

        .primary-button:hover {
          background-color: #2563eb;
        }

        .danger-button {
          background-color: #ef4444;
          color: white;
        }

        .danger-button:hover {
          background-color: #dc2626;
        }

        .warning-button {
          background-color: #8b5cf6;
          color: white;
        }

        .warning-button:hover {
          background-color: #7c3aed;
        }

        .success-button {
          background-color: #10b981;
          color: white;
        }

        .success-button:hover {
          background-color: #059669;
        }

        /* Modal Styles */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background-color: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(4px);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
          animation: fadeIn 0.3s ease;
        }

        .modal-content {
          background-color: white;
          padding: 2rem;
          border-radius: 12px;
          width: 90%;
          max-width: 480px;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          position: relative;
          animation: slideIn 0.3s ease;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid #e2e8f0;
        }

        .modal-header h2 {
          font-size: 1.5rem;
          font-weight: 700;
          color: #1e293b;
          margin: 0;
        }

        .modal-close {
          background: none;
          border: none;
          cursor: pointer;
          color: #64748b;
          font-size: 1.25rem;
          padding: 0.25rem;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          transition: all 0.2s ease;
        }

        .modal-close:hover {
          background-color: #f1f5f9;
          color: #334155;
        }

        /* Form Styles */
        .form-group {
          margin-bottom: 1.25rem;
        }

        .form-group label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 500;
          color: #334155;
          font-size: 0.95rem;
        }

        .form-input, .form-textarea {
          width: 100%;
          padding: 0.75rem 1rem;
          border-radius: 8px;
          border: 1px solid #cbd5e1;
          font-size: 0.95rem;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
          background-color: #f8fafc;
        }

        .form-input:focus, .form-textarea:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
        }

        .form-textarea {
          height: 120px;
          resize: vertical;
        }

        .form-button {
          width: 100%;
          padding: 0.875rem;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          font-size: 0.95rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          transition: all 0.2s ease;
          margin-top: 0.5rem;
        }

        .form-button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        /* Feedback Message */
        .feedback-message {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-top: 1rem;
          padding: 0.75rem;
          border-radius: 8px;
          font-size: 0.9rem;
        }

        .feedback-message.success {
          background-color: rgba(16, 185, 129, 0.1);
          color: #059669;
        }

        .feedback-message.error {
          background-color: rgba(239, 68, 68, 0.1);
          color: #dc2626;
        }

        /* Animations */
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideIn {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        /* Responsive Styles */
        @media (max-width: 768px) {
          .settings-button {
            width: 100%;
          }
          
          .settings-header h1 {
            font-size: 1.75rem;
          }
          
          .modal-content {
            padding: 1.5rem;
          }
        }
      `}</style>
    </div>
  );
}

export default Settings;
