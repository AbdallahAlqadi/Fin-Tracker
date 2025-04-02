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

  // دالة لإنشاء الأحرف الأولى من اسم المستخدم
  const getInitials = (name) => {
    return name.split(' ').map(part => part[0]).join('').toUpperCase();
  };

  // ألوان متنوعة للأفاتار
  const avatarColors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEEAD', '#FF9F43'];

  return (
    <div className="feedback-page">
      <header className="page-header">
        <div className="header-gradient">
          <h1>User Testimonials</h1>
          <p className="header-subtitle">What our users say about us</p>
        </div>
      </header>
      
      <div className="feedback-container">
        <div className="feedback-window">
          {feedbacks.map((feedback, index) => {
            const color = avatarColors[index % avatarColors.length];
            return (
              <div key={index} className="feedback-card">
                <div className="quote-icon">❝</div>
                <div className="avatar-container" style={{ backgroundColor: color }}>
                  {getInitials(feedback.username)}
                </div>
                <div className="feedback-content">
                  <div className="user-info">
                    <span className="username">{feedback.username}</span>
                    <div className="rating-stars">
                      {[...Array(5)].map((_, i) => (
                        <span key={i} className={`star ${i < (feedback.rating || 5) ? 'filled' : ''}`}>★</span>
                      ))}
                    </div>
                  </div>
                  <p className="feedback-text">{feedback.message}</p>
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