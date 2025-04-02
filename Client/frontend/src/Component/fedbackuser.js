import React, { useEffect, useState } from 'react';
import axios from 'axios';
import '../cssStyle/fedbackuser.css';

const FedbackUser = () => {
  const [feedbacks, setFeedbacks] = useState([]);

  useEffect(() => {
    const fetchFeedbacks = async () => {
      try {
        const response = await axios.get('https://fin-tracker-ncbx.onrender.com/api/fedback');
        setFeedbacks(response.data);
      } catch (error) {
        console.error('Error fetching feedbacks:', error);
      }
    };

    fetchFeedbacks();
  }, []);

  // Function to create initials from the user's name
  const getInitials = (name) => {
    return name.split(' ').map(part => part[0]).join('').toUpperCase();
  };

  // Array of colors for the avatar background
  const avatarColors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEEAD', '#FF9F43'];

  return (
    <div className="ft-feedback-page">
      <header className="ft-page-header">
        <div className="ft-header-gradient">
          <h1>User Testimonials</h1>
          <p className="ft-header-subtitle">What our users say about us</p>
        </div>
      </header>
      
      <div className="ft-feedback-container">
        <div className="ft-feedback-window">
          {feedbacks.map((feedback, index) => {
            const color = avatarColors[index % avatarColors.length];
            return (
              <div key={index} className="ft-feedback-card">
                <div className="ft-quote-icon">❝</div>
                <div className="ft-avatar-container" style={{ backgroundColor: color }}>
                  {getInitials(feedback.username)}
                </div>
                <div className="ft-feedback-content">
                  <div className="ft-user-info">
                    <span className="ft-username">{feedback.username}</span>
                    <div className="ft-rating-stars">
                      {[...Array(5)].map((_, i) => (
                        <span key={i} className={`ft-star ${i < (feedback.rating || 5) ? 'filled' : ''}`}>★</span>
                      ))}
                    </div>
                  </div>
                  <p className="ft-feedback-text">{feedback.message}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default FedbackUser;
