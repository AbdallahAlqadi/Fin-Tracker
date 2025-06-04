// src/components/Settings.jsx
import React, { useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";
import {
  FaTrash,
  FaUserEdit,
  FaTimes,
  FaUserSlash,
  FaCommentDots,
  FaPaperPlane,
  FaCheckCircle,
  FaExclamationCircle,
  FaUserCircle,
  FaEnvelopeOpenText,
  FaLock,
  FaCommentAlt,
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
      Swal.fire({
        icon: "warning",
        title: "Not Logged In",
        text: "No valid token found. Please log in first.",
      });
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
        Swal.fire({
          icon: "success",
          title: "Profile Updated",
          text: "Your profile has been updated successfully.",
        });
        setShowEditModal(false);
      } else {
        Swal.fire({
          icon: "error",
          title: "Update Failed",
          text: data.message || "An error occurred while updating your profile.",
        });
      }
    } catch (err) {
      console.error("Error updating user data:", err);
      Swal.fire({
        icon: "error",
        title: "Server Unreachable",
        text: "Unable to connect to the server. Please try again.",
      });
    }
  };

  // Delete all budget items
  const handleDeleteAll = async () => {
    if (!token) {
      Swal.fire({
        icon: "warning",
        title: "Not Logged In",
        text: "No valid token found. Please log in first.",
      });
      return;
    }

    const result = await Swal.fire({
      title: "Delete All Budget Items?",
      text: "This action will permanently delete all budget items. Are you sure?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, delete all",
      cancelButtonText: "Cancel",
    });

    if (result.isConfirmed) {
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
          Swal.fire({
            icon: "success",
            title: "Deleted",
            text: "All budget items have been deleted successfully.",
          });
        } else {
          Swal.fire({
            icon: "error",
            title: "Deletion Failed",
            text: data.error || "An error occurred while attempting to delete.",
          });
        }
      } catch (err) {
        console.error("Error deleting all budget items:", err);
        Swal.fire({
          icon: "error",
          title: "Server Unreachable",
          text: "Unable to connect to the server. Please try again.",
        });
      }
    }
  };

  // Delete user account
  const handleDeleteAccount = async () => {
    if (!token) {
      Swal.fire({
        icon: "warning",
        title: "Not Logged In",
        text: "No valid token found. Please log in first.",
      });
      return;
    }

    const result = await Swal.fire({
      title: "Delete Account?",
      text: "This action will permanently delete your account. Continue?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#8b5cf6",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, delete account",
      cancelButtonText: "Cancel",
    });

    if (result.isConfirmed) {
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
          Swal.fire({
            icon: "success",
            title: "Account Deleted",
            text: "Your account has been deleted successfully.",
          }).then(() => {
            sessionStorage.removeItem("jwt");
            // Optionally, redirect to login or home page here
          });
        } else {
          Swal.fire({
            icon: "error",
            title: "Deletion Failed",
            text: data.message || "An error occurred while deleting your account.",
          });
        }
      } catch (err) {
        console.error("Error deleting user account:", err);
        Swal.fire({
          icon: "error",
          title: "Server Unreachable",
          text: "Unable to connect to the server. Please try again.",
        });
      }
    }
  };

  // Submit feedback
  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    if (!token) {
      Swal.fire({
        icon: "warning",
        title: "Not Logged In",
        text: "No valid token found. Please log in first.",
      });
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
        <h1>
          <FaUserCircle className="header-icon" /> Account Settings
        </h1>
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
              <h2>
                <FaUserEdit className="modal-header-icon" /> Edit Profile
              </h2>
              <button className="modal-close" onClick={() => setShowEditModal(false)}>
                <FaTimes />
              </button>
            </div>
            <form onSubmit={handleUpdateUser}>
              <div className="form-group">
                <label htmlFor="username">
                  <FaUserCircle className="input-icon" /> Username
                </label>
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
                <label htmlFor="email">
                  <FaEnvelopeOpenText className="input-icon" /> Email
                </label>
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
                <label htmlFor="password">
                  <FaLock className="input-icon" /> Password
                </label>
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
              <h2>
                <FaCommentAlt className="modal-header-icon" /> Send Feedback
              </h2>
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
          margin: 0;
          padding: 0;
        }

        /* Main Container Styles */
        .settings-container {
          padding: 2.5rem 1.5rem;
          font-family: 'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif;
          max-width: 1000px;
          margin: 2rem auto;
          color: #334155;
          background-color: #ffffff;
          border-radius: 16px;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.05);
        }

        /* Header Styles */
        .settings-header {
          text-align: center;
          margin-bottom: 2.5rem;
          padding-bottom: 1.5rem;
          border-bottom: 1px solid #e2e8f0;
        }

        .settings-header h1 {
          font-size: 2.5rem;
          font-weight: 700;
          color: #1e293b;
          display: inline-flex;
          align-items: center;
          gap: 0.75rem;
        }

        .header-icon {
          color: #3b82f6;
          font-size: 2.5rem;
        }

        .settings-subtitle {
          font-size: 1rem;
          color: #64748b;
          margin-top: 0.5rem;
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
          padding: 0.75rem 1.25rem;
          font-size: 1rem;
          font-weight: 600;
          border: none;
          border-radius: 12px;
          cursor: pointer;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
          min-width: 180px;
          justify-content: center;
        }

        .settings-button:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
        }

        .settings-button:active {
          transform: translateY(0);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
        }

        .primary-button {
          background-color: #3b82f6;
          color: #ffffff;
        }

        .primary-button:hover {
          background-color: #2563eb;
        }

        .danger-button {
          background-color: #ef4444;
          color: #ffffff;
        }

        .danger-button:hover {
          background-color: #dc2626;
        }

        .warning-button {
          background-color: #f59e0b;
          color: #ffffff;
        }

        .warning-button:hover {
          background-color: #d97706;
        }

        .success-button {
          background-color: #10b981;
          color: #ffffff;
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
          background-color: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(3px);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
          animation: fadeIn 0.25s ease;
        }

        .modal-content {
          background-color: #ffffff;
          padding: 2rem;
          border-radius: 16px;
          width: 90%;
          max-width: 500px;
          box-shadow: 0 32px 64px rgba(0, 0, 0, 0.08);
          position: relative;
          animation: slideIn 0.25s ease;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
          padding-bottom: 0.75rem;
          border-bottom: 1px solid #e2e8f0;
        }

        .modal-header h2 {
          font-size: 1.75rem;
          font-weight: 700;
          color: #1e293b;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
        }

        .modal-header-icon {
          color: #3b82f6;
          font-size: 1.75rem;
        }

        .modal-close {
          background: none;
          border: none;
          cursor: pointer;
          color: #64748b;
          font-size: 1.5rem;
          padding: 0.25rem;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          transition: background-color 0.2s ease, color 0.2s ease;
        }

        .modal-close:hover {
          background-color: #f1f5f9;
          color: #334155;
        }

        /* Form Styles */
        .form-group {
          margin-bottom: 1.5rem;
        }

        .form-group label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.5rem;
          font-weight: 500;
          color: #334155;
          font-size: 1rem;
        }

        .input-icon {
          color: #3b82f6;
        }

        .form-input, .form-textarea {
          width: 100%;
          padding: 0.75rem 1rem;
          border-radius: 10px;
          border: 1px solid #cbd5e1;
          font-size: 1rem;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
          background-color: #f1f5f9;
        }

        .form-input:focus, .form-textarea:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
          background-color: #ffffff;
        }

        .form-textarea {
          height: 140px;
          resize: vertical;
        }

        .form-button {
          width: 100%;
          padding: 0.875rem;
          border: none;
          border-radius: 10px;
          font-weight: 600;
          font-size: 1rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          margin-top: 0.5rem;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
          background-color: #10b981;
          color: #ffffff;
        }

        .form-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
        }

        .form-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
        }

        /* Feedback Message */
        .feedback-message {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-top: 1rem;
          padding: 0.75rem 1rem;
          border-radius: 10px;
          font-size: 0.95rem;
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
            font-size: 2rem;
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
