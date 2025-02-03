import React, { useState } from 'react';
import axios from 'axios';
import '../cssStyle/FeedbackForm.css';

const FeedbackForm = () => {
  const [feedback, setFeedback] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    const username = sessionStorage.getItem('username');

  

    try {
      const response = await axios.post('http://127.0.0.1:5004/api/fedback', 
       {
        username:username, 
        message:feedback 
      });
alert('done')
      setFeedback(''); 
    } catch (error) {
    }
  };

  return (
    <div className="feedback-form">
      <h2>Share your opinion with us</h2>
      <form onSubmit={handleSubmit}>
        <textarea
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="اكتب تعليقك هنا..."
          required
        />
        <button type="submit">إرسال</button>
      </form>
    </div>
  );
};

export default FeedbackForm;