import React, { useState } from 'react';
import axios from 'axios';
import '../cssStyle/FeedbackForm.css';

const FeedbackForm = () => {
  const [feedback, setFeedback] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    const username = sessionStorage.getItem('username');

    if (!username) {
      setMessage('يجب تسجيل الدخول أولاً.');
      return;
    }

    try {
      const response = await axios.post('http://127.0.0.1:5004/api/fedback', 
       {
        username:username, 
        message:feedback 
      });

      setMessage('تم إرسال التعليق بنجاح!');
      setFeedback(''); 
    } catch (error) {
      setMessage('حدث خطأ أثناء إرسال التعليق.');
    }
  };

  return (
    <div className="feedback-form">
      <h2>شاركنا برأيك</h2>
      <form onSubmit={handleSubmit}>
        <textarea
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="اكتب تعليقك هنا..."
          required
        />
        <button type="submit">إرسال</button>
      </form>
      {message && <p className="message">{message}</p>}
    </div>
  );
};

export default FeedbackForm;