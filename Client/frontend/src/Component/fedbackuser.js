import React, { useEffect, useState } from 'react';
import axios from 'axios';
import '../cssStyle/fedbackuser.css';

const FedbackUser = () => {
  const [feedbacks, setFeedbacks] = useState([]);

  useEffect(() => {
    const fetchFeedbacks = async () => {
      try {
        const response = await axios.get('http://127.0.0.1:5004/api/fedback');
        setFeedbacks(response.data);
      } catch (error) {
        console.error('Error fetching feedbacks:', error);
      }
    };

    fetchFeedbacks();
  }, []);

  return (
    <div className="feedback-page">
      <header className="page-header">
        <h1>User Feedback</h1>
      </header>
      <div className="feedback-container">
        <div className="feedback-window">
          {feedbacks.map((feedback, index) => (
            <div key={index} className="feedback-message">
              <div className="message-avatar">
                <img 
                  src="https://static.vecteezy.com/system/resources/previews/019/879/186/large_2x/user-icon-on-transparent-background-free-png.png" 
                  alt="User Avatar" 
                />
              </div>
              <div className="message-content">
                <span className="message-username">{feedback.username}</span>
                <p className="message-text">{feedback.message}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FedbackUser;
