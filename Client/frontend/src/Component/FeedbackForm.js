import React, { useState } from 'react';
import axios from 'axios';
import '../cssStyle/FeedbackForm.css';

const FeedbackForm = ({ user }) => {
  const [feedback, setFeedback] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:5000/api/feedback', { feedback });
      setMessage('تم إرسال التعليق بنجاح!');
      setFeedback('');
    } catch (error) {
      setMessage('حدث خطأ أثناء إرسال التعليق.');
    }
  };

  return (
    <div className="feedback-form">
      <h2>شاركنا برأيك</h2>
      {user && (
        <div className="user-info">
          <p>اسم المستخدم: {user.name}</p>
          <p>البريد الإلكتروني: {user.email}</p>
        </div>
      )}
      <form onSubmit={handleSubmit}>
        <textarea
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="اكتب تعليقك هنا..."
          required
        />
        <button type="submit">إرسال</button>
      </form>
      <p className={message ? "show" : ""}>{message}</p>
    </div>
  );
};

export default FeedbackForm;