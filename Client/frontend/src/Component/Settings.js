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

  // Base styles
  const buttonStyle = {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "12px 24px",
    fontSize: "16px",
    fontWeight: 500,
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    transition: "background-color 0.2s ease",
  };

  const containerStyle = {
    display: "flex",
    gap: "16px",
    marginTop: "20px",
    flexWrap: "wrap",
    justifyContent: "center",
  };

  const modalOverlayStyle = {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100vw",
    height: "100vh",
    backgroundColor: "rgba(0,0,0,0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  };

  const modalStyle = {
    backgroundColor: "#fff",
    padding: "24px",
    borderRadius: "8px",
    width: "420px",
    boxShadow: "0 4px 14px rgba(0,0,0,0.3)",
    position: "relative",
  };

  const closeIconStyle = {
    position: "absolute",
    top: "16px",
    right: "16px",
    cursor: "pointer",
    fontSize: "18px",
    color: "#555",
  };

  const formGroupStyle = {
    marginBottom: "16px",
  };

  const labelStyle = {
    display: "block",
    marginBottom: "6px",
    fontWeight: 500,
    color: "#333",
  };

  const inputStyle = {
    width: "100%",
    padding: "10px",
    borderRadius: "6px",
    border: "1px solid #ccc",
    fontSize: "14px",
    boxSizing: "border-box",
  };

  const textareaStyle = {
    width: "100%",
    height: "100px",
    padding: "10px",
    borderRadius: "6px",
    border: "1px solid #ccc",
    fontSize: "14px",
    resize: "vertical",
    boxSizing: "border-box",
  };

  const formButtonStyle = {
    ...buttonStyle,
    justifyContent: "center",
    width: "100%",
    marginTop: "8px",
  };

  const feedbackMessageStyle = {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginTop: "12px",
    fontSize: "14px",
  };

  return (
    <div style={{ padding: "40px 20px", fontFamily: "Arial, sans-serif" }}>
      <h1 style={{ textAlign: "center", marginBottom: "24px", color: "#2c3e50" }}>
        Account Settings
      </h1>

      <div style={containerStyle}>
        {/* Delete All Budget Button */}
        <button
          style={{
            ...buttonStyle,
            backgroundColor: "#e74c3c",
            color: "#fff",
          }}
          onClick={handleDeleteAll}
          onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#c0392b")}
          onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "#e74c3c")}
        >
          <FaTrash />
          Delete All Budget
        </button>

        {/* Edit Profile Button */}
        <button
          style={{
            ...buttonStyle,
            backgroundColor: "#3498db",
            color: "#fff",
          }}
          onClick={() => setShowEditModal(true)}
          onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#2980b9")}
          onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "#3498db")}
        >
          <FaUserEdit />
          Edit Profile
        </button>

        {/* Delete Account Button */}
        <button
          style={{
            ...buttonStyle,
            backgroundColor: "#8e44ad",
            color: "#fff",
          }}
          onClick={handleDeleteAccount}
          onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#71368a")}
          onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "#8e44ad")}
        >
          <FaUserSlash />
          Delete Account
        </button>

        {/* Give Feedback Button */}
        <button
          style={{
            ...buttonStyle,
            backgroundColor: "#27ae60",
            color: "#fff",
          }}
          onClick={() => setShowFeedbackModal(true)}
          onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#229954")}
          onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "#27ae60")}
        >
          <FaCommentDots />
          Give Feedback
        </button>
      </div>

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div style={modalOverlayStyle}>
          <div style={modalStyle}>
            <FaTimes
              style={closeIconStyle}
              onClick={() => setShowEditModal(false)}
            />
            <h2 style={{ marginBottom: "20px", textAlign: "center", color: "#2c3e50" }}>
              Edit Profile
            </h2>
            <form onSubmit={handleUpdateUser}>
              <div style={formGroupStyle}>
                <label style={labelStyle}>Username</label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="New username"
                  style={inputStyle}
                />
              </div>
              <div style={formGroupStyle}>
                <label style={labelStyle}>Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="New email"
                  style={inputStyle}
                />
              </div>
              <div style={formGroupStyle}>
                <label style={labelStyle}>Password</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="New password"
                  style={inputStyle}
                />
              </div>
              <button
                type="submit"
                style={{
                  ...formButtonStyle,
                  backgroundColor: "#2ecc71",
                  color: "#fff",
                }}
                onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#27ae60")}
                onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "#2ecc71")}
              >
                Save Changes
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Feedback Modal */}
      {showFeedbackModal && (
        <div style={modalOverlayStyle}>
          <div style={modalStyle}>
            <FaTimes
              style={closeIconStyle}
              onClick={() => setShowFeedbackModal(false)}
            />
            <h2 style={{ marginBottom: "20px", textAlign: "center", color: "#2c3e50" }}>
              Send Feedback
            </h2>
            <form onSubmit={handleFeedbackSubmit}>
              <div style={formGroupStyle}>
                <textarea
                  name="feedback"
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  placeholder="Write your comment here..."
                  style={textareaStyle}
                  required
                />
              </div>
              <button
                type="submit"
                style={{
                  ...formButtonStyle,
                  backgroundColor: "#27ae60",
                  color: "#fff",
                }}
                disabled={feedbackSubmitting}
                onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#229954")}
                onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "#27ae60")}
              >
                {feedbackSubmitting ? "Sending..." : "Send Feedback"} <FaPaperPlane />
              </button>
            </form>
            {feedbackMessage.text && (
              <div
                style={{
                  ...feedbackMessageStyle,
                  color: feedbackMessage.type === "success" ? "#27ae60" : "#e74c3c",
                }}
              >
                {feedbackMessage.type === "success" ? <FaCheckCircle /> : <FaExclamationCircle />}{" "}
                {feedbackMessage.text}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Settings;
