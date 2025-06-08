// src/components/Settings.jsx
import React, { useState, useEffect } from "react";
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
  FaMoneyBillWave,
  FaExchangeAlt,
} from "react-icons/fa";

function Settings() {
  // يجب أن يكون التوكن قد تم تخزينه مسبقًا في sessionStorage
  const token = sessionStorage.getItem("jwt");

  // حالة لرؤية النوافذ المنبثقة
  const [showEditModal, setShowEditModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);

  // حالة النموذج لتعديل بيانات المستخدم
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
  });

  // حالة نموذج الملاحظات
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState({ text: "", type: "" });

  // حالة العملة
  const [selectedCurrency, setSelectedCurrency] = useState("JOD");
  const [exchangeRates, setExchangeRates] = useState({});
  const [currencyLoading, setCurrencyLoading] = useState(false);

  // العملات المتاحة
  const currencies = [
    { code: "JOD", name: "Jordanian Dinar", symbol: "JOD" },
    { code: "USD", name: "US Dollar", symbol: "$" },
    { code: "EUR", name: "Euro", symbol: "€" },
    { code: "GBP", name: "British Pound", symbol: "£" },
    { code: "SAR", name: "Saudi Riyal", symbol: "SAR" },
    { code: "AED", name: "UAE Dirham", symbol: "AED" },
    { code: "EGP", name: "Egyptian Pound", symbol: "EGP" },
    { code: "KWD", name: "Kuwaiti Dinar", symbol: "KWD" },
    { code: "QAR", name: "Qatari Riyal", symbol: "QAR" },
    { code: "BHD", name: "Bahraini Dinar", symbol: "BHD" },
    { code: "OMR", name: "Omani Rial", symbol: "OMR" },
    { code: "LBP", name: "Lebanese Pound", symbol: "LBP" },
    { code: "SYP", name: "Syrian Pound", symbol: "SYP" },
    { code: "IQD", name: "Iraqi Dinar", symbol: "IQD" },
    { code: "TRY", name: "Turkish Lira", symbol: "₺" },
    { code: "JPY", name: "Japanese Yen", symbol: "¥" },
    { code: "CNY", name: "Chinese Yuan", symbol: "¥" },
    { code: "CAD", name: "Canadian Dollar", symbol: "C$" },
    { code: "AUD", name: "Australian Dollar", symbol: "A$" },
    { code: "CHF", name: "Swiss Franc", symbol: "CHF" },
  ];

  // تحميل تفضيل العملة المحفوظ عند تحميل المكون
  useEffect(() => {
    const savedCurrency = localStorage.getItem("selectedCurrency");
    if (savedCurrency) {
      setSelectedCurrency(savedCurrency);
    }
    fetchExchangeRates();
  }, []);

  // جلب أسعار الصرف من واجهة برمجة تطبيقات خارجية
  const fetchExchangeRates = async () => {
    setCurrencyLoading(true);
    try {
      // استخدام ExchangeRate-API وهي مجانية ولا تتطلب مفتاح API
      const response = await fetch("https://api.exchangerate-api.com/v4/latest/JOD");
      const data = await response.json();
      setExchangeRates(data.rates);
      
      // تخزين الأسعار في localStorage مع طابع زمني للتخزين المؤقت
      localStorage.setItem("exchangeRates", JSON.stringify({
        rates: data.rates,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.error("Error fetching exchange rates:", error);
      
      // محاولة تحميل الأسعار المخزنة مؤقتًا إذا فشلت واجهة برمجة التطبيقات
      const cachedRates = localStorage.getItem("exchangeRates");
      if (cachedRates) {
        const parsed = JSON.parse(cachedRates);
        // استخدام الأسعار المخزنة مؤقتًا إذا كانت أقدم من ساعة واحدة
        if (Date.now() - parsed.timestamp < 3600000) {
          setExchangeRates(parsed.rates);
        }
      }
      
      Swal.fire({
        icon: "warning",
        title: "Warning",
        text: "Unable to update exchange rates. Using cached rates.",
      });
    } finally {
      setCurrencyLoading(false);
    }
  };

  // التعامل مع اختيار العملة
  const handleCurrencyChange = (currencyCode) => {
    setSelectedCurrency(currencyCode);
    localStorage.setItem("selectedCurrency", currencyCode);
    
    // إطلاق حدث مخصص لإعلام المكونات الأخرى
    window.dispatchEvent(new CustomEvent("currencyChanged"));
    
    Swal.fire({
      icon: "success",
      title: "Currency Changed",
      text: `Currency changed to ${currencies.find(c => c.code === currencyCode)?.name}`,
      timer: 2000,
      showConfirmButton: false,
    });
  };

  // التعامل مع تغييرات الإدخال في نموذج التعديل
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // إرسال بيانات المستخدم المحدثة
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

  // حذف جميع عناصر الميزانية
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

  // حذف حساب المستخدم
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
            // اختياريًا ، أعد التوجيه إلى صفحة تسجيل الدخول أو الصفحة الرئيسية هنا
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

  // إرسال الملاحظات
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
        {/* زر إعدادات العملة */}
        <button
          className="settings-button currency-button"
          onClick={() => setShowCurrencyModal(true)}
        >
          <FaMoneyBillWave />
          <span>Currency Settings</span>
        </button>

        {/* زر حذف جميع الميزانية */}
        <button
          className="settings-button danger-button"
          onClick={handleDeleteAll}
        >
          <FaTrash />
          <span>Delete All Budget</span>
        </button>

        {/* زر تعديل الملف الشخصي */}
        <button
          className="settings-button primary-button"
          onClick={() => setShowEditModal(true)}
        >
          <FaUserEdit />
          <span>Edit Profile</span>
        </button>

        {/* زر حذف الحساب */}
        <button
          className="settings-button warning-button"
          onClick={handleDeleteAccount}
        >
          <FaUserSlash />
          <span>Delete Account</span>
        </button>

        {/* زر إعطاء ملاحظات */}
        <button
          className="settings-button success-button"
          onClick={() => setShowFeedbackModal(true)}
        >
          <FaCommentDots />
          <span>Give Feedback</span>
        </button>
      </div>

      {/* نافذة اختيار العملة */}
      {showCurrencyModal && (
        <div className="modal-overlay">
          <div className="modal-content currency-modal">
            <div className="modal-header">
              <h2>
                <FaExchangeAlt className="modal-header-icon" /> Currency Settings
              </h2>
              <button className="modal-close" onClick={() => setShowCurrencyModal(false)}>
                <FaTimes />
              </button>
            </div>
            <div className="currency-content">
              <div className="current-currency">
                <p>Current Currency: <strong>{currencies.find(c => c.code === selectedCurrency)?.name}</strong></p>
                <button 
                  className="refresh-rates-btn"
                  onClick={fetchExchangeRates}
                  disabled={currencyLoading}
                >
                  {currencyLoading ? "Updating..." : "Refresh Rates"}
                </button>
              </div>
              <div className="currency-grid">
                {currencies.map((currency) => (
                  <div
                    key={currency.code}
                    className={`currency-item ${selectedCurrency === currency.code ? 'selected' : ''}`}
                    onClick={() => handleCurrencyChange(currency.code)}
                  >
                    <div className="currency-symbol">{currency.symbol}</div>
                    <div className="currency-info">
                      <div className="currency-code">{currency.code}</div>
                      <div className="currency-name">{currency.name}</div>
                    </div>
                    {selectedCurrency === currency.code && (
                      <FaCheckCircle className="selected-icon" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* نافذة تعديل الملف الشخصي */}
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

      {/* نافذة الملاحظات */}
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

      {/* أنماط CSS */}
      <style jsx>{`
        /* إعادة تعيين CSS حديثة */
        *, *::before, *::after {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        /* أنماط الحاوية الرئيسية */
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

        /* أنماط الترويسة */
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

        /* حاوية الأزرار */
        .settings-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 1rem;
          justify-content: center;
          margin-bottom: 2rem;
        }

        /* أنماط الأزرار */
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

        .currency-button {
          background-color: #8b5cf6;
          color: #ffffff;
        }

        .currency-button:hover {
          background-color: #7c3aed;
        }

        /* أنماط النوافذ المنبثقة */
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
          max-height: 90vh;
          overflow-y: auto;
        }

        .currency-modal {
          max-width: 700px;
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
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .modal-header-icon {
          color: #3b82f6;
        }

        .modal-close {
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          color: #64748b;
          padding: 0.5rem;
          border-radius: 8px;
          transition: background-color 0.2s ease;
        }

        .modal-close:hover {
          background-color: #f1f5f9;
          color: #334155;
        }

        /* أنماط خاصة بنافذة العملة */
        .current-currency {
          background-color: #f8fafc;
          padding: 1rem;
          border-radius: 12px;
          margin-bottom: 1.5rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .refresh-rates-btn {
          background-color: #3b82f6;
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 8px;
          cursor: pointer;
          font-size: 0.875rem;
          transition: background-color 0.2s ease;
        }

        .refresh-rates-btn:hover:not(:disabled) {
          background-color: #2563eb;
        }

        .refresh-rates-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .currency-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 1rem;
          max-height: 400px;
          overflow-y: auto;
        }

        .currency-item {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem;
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
          position: relative;
        }

        .currency-item:hover {
          border-color: #3b82f6;
          background-color: #f8fafc;
        }

        .currency-item.selected {
          border-color: #10b981;
          background-color: #ecfdf5;
        }

        .currency-symbol {
          font-size: 1.5rem;
          font-weight: bold;
          color: #3b82f6;
          min-width: 2rem;
          text-align: center;
        }

        .currency-info {
          flex: 1;
        }

        .currency-code {
          font-weight: 600;
          color: #1e293b;
          font-size: 0.875rem;
        }

        .currency-name {
          color: #64748b;
          font-size: 0.75rem;
        }

        .selected-icon {
          color: #10b981;
          font-size: 1.25rem;
          position: absolute;
          top: 0.5rem;
          right: 0.5rem;
        }

        /* أنماط النماذج */
        .form-group {
          margin-bottom: 1.5rem;
        }

        .form-group label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.5rem;
          font-weight: 600;
          color: #374151;
        }

        .input-icon {
          color: #6b7280;
        }

        .form-input, .form-textarea {
          width: 100%;
          padding: 0.75rem 1rem;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          font-size: 1rem;
          transition: border-color 0.2s ease;
        }

        .form-input:focus, .form-textarea:focus {
          outline: none;
          border-color: #3b82f6;
        }

        .form-textarea {
          min-height: 120px;
          resize: vertical;
        }

        .form-button {
          width: 100%;
          padding: 0.875rem 1.5rem;
          font-size: 1rem;
          font-weight: 600;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          transition: background-color 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
        }

        .form-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        /* رسالة الملاحظات */
        .feedback-message {
          margin-top: 1rem;
          padding: 0.75rem 1rem;
          border-radius: 8px;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-weight: 500;
        }

        .feedback-message.success {
          background-color: #d1fae5;
          color: #065f46;
          border: 1px solid #a7f3d0;
        }

        .feedback-message.error {
          background-color: #fee2e2;
          color: #991b1b;
          border: 1px solid #fca5a5;
        }

        /* الحركات */
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideIn {
          from { 
            opacity: 0;
            transform: translateY(-20px);
          }
          to { 
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* التصميم المتجاوب */
        @media (max-width: 768px) {
          .settings-container {
            padding: 1.5rem 1rem;
            margin: 1rem auto;
          }

          .settings-header h1 {
            font-size: 2rem;
          }

          .settings-actions {
            flex-direction: column;
            align-items: center;
          }

          .settings-button {
            width: 100%;
            max-width: 300px;
          }

          .modal-content {
            width: 95%;
            padding: 1.5rem;
          }

          .currency-grid {
            grid-template-columns: 1fr;
          }

          .current-currency {
            flex-direction: column;
            text-align: center;
          }
        }
      `}</style>
    </div>
  );
}

export default Settings;
