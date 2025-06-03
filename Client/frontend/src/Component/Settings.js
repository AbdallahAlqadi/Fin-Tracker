// src/components/Settings.jsx
import React, { useState } from "react";

function Settings() {
  // The token must have been stored previously in sessionStorage
  const token = sessionStorage.getItem("jwt");

  // State for delete confirmation (optional) and modal visibility
  const [showEditModal, setShowEditModal] = useState(false);

  // Form state for editing user data
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
  });

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
        // Optionally, clear the form or re-fetch user data here
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
        alert("All expenses have been deleted successfully.");
        // If you want to refresh the UI (e.g., re-fetch data), do it here
      } else {
        alert(data.error || "An error occurred while attempting to delete.");
      }
    } catch (err) {
      console.error("Error deleting all budget items:", err);
      alert("Unable to connect to the server. Please try again.");
    }
  };

  return (
    <>
      {/* Button to delete all budget */}
      <button
        style={{
          padding: "10px 20px",
          backgroundColor: "#e74c3c",
          color: "#fff",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer",
          marginRight: "10px",
        }}
        onClick={handleDeleteAll}
      >
        Delete All Budget
      </button>

      {/* Button to open the Edit Profile modal */}
      <button
        style={{
          padding: "10px 20px",
          backgroundColor: "#3498db",
          color: "#fff",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer",
        }}
        onClick={() => setShowEditModal(true)}
      >
        Edit Profile
      </button>

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: "rgba(0,0,0,0.4)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: "#fff",
              padding: "20px",
              borderRadius: "8px",
              width: "320px",
              boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
            }}
          >
            <h2 style={{ marginBottom: "15px", textAlign: "center" }}>
              Edit Profile
            </h2>
            <form onSubmit={handleUpdateUser}>
              <div style={{ marginBottom: "10px" }}>
                <label style={{ display: "block", marginBottom: "5px" }}>
                  Username
                </label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="New username"
                  style={{
                    width: "100%",
                    padding: "8px",
                    boxSizing: "border-box",
                    borderRadius: "4px",
                    border: "1px solid #ccc",
                  }}
                />
              </div>
              <div style={{ marginBottom: "10px" }}>
                <label style={{ display: "block", marginBottom: "5px" }}>
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="New email"
                  style={{
                    width: "100%",
                    padding: "8px",
                    boxSizing: "border-box",
                    borderRadius: "4px",
                    border: "1px solid #ccc",
                  }}
                />
              </div>
              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", marginBottom: "5px" }}>
                  Password
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="New password"
                  style={{
                    width: "100%",
                    padding: "8px",
                    boxSizing: "border-box",
                    borderRadius: "4px",
                    border: "1px solid #ccc",
                  }}
                />
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  style={{
                    padding: "8px 16px",
                    backgroundColor: "#bdc3c7",
                    color: "#fff",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: "8px 16px",
                    backgroundColor: "#2ecc71",
                    color: "#fff",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export default Settings;
