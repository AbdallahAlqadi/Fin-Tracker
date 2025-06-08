import React, { useEffect, useState } from 'react';
import axios from 'axios';
import '../cssStyle/fedbackuser.css';

const FedbackUser = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchFeedbacks = async () => {
      try {
        setLoading(true);
        const response = await axios.get('http://127.0.0.1:5004/api/fedback');
        setFeedbacks(response.data);
        setError(null);
      } catch (error) {
        console.error('Error fetching feedbacks:', error);
        setError('Failed to load testimonials. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchFeedbacks();
  }, []);

  // Function to create initials from the user's name
  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(part => part[0]).join('').toUpperCase().slice(0, 2);
  };

  // Enhanced color palette for avatars
  const avatarColors = [
    '#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe', '#00f2fe',
    '#43e97b', '#38f9d7', '#ffecd2', '#fcb69f', '#a8edea', '#fed6e3',
    '#ff9a9e', '#fecfef', '#ffeaa7', '#fab1a0', '#fd79a8', '#fdcb6e'
  ];

  // Function to render star rating
  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating || 5);
    const hasHalfStar = (rating || 5) % 1 !== 0;
    
    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(<span key={i} className="ft-star filled">★</span>);
      } else if (i === fullStars && hasHalfStar) {
        stars.push(<span key={i} className="ft-star half-filled">★</span>);
      } else {
        stars.push(<span key={i} className="ft-star empty">☆</span>);
      }
    }
    return stars;
  };

  // Calculate average rating
  const averageRating = feedbacks.length > 0 
    ? (feedbacks.reduce((sum, feedback) => sum + (feedback.rating || 5), 0) / feedbacks.length).toFixed(1)
    : 5.0;

  if (loading) {
    return (
      <div className="ft-feedback-page">
        <div className="ft-loading-container">
          <div className="ft-loading-spinner"></div>
          <p className="ft-loading-text">Loading testimonials...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="ft-feedback-page">
        <div className="ft-error-container">
          <div className="ft-error-icon">⚠️</div>
          <p className="ft-error-text">{error}</p>
          <button 
            className="ft-retry-button"
            onClick={() => window.location.reload()}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="ft-feedback-page">
      {/* Hero Section */}
      <section className="ft-hero-section">
        <div className="ft-hero-background">
          <div className="ft-hero-pattern"></div>
          <div className="ft-floating-shapes">
            <div className="ft-shape ft-shape-1"></div>
            <div className="ft-shape ft-shape-2"></div>
            <div className="ft-shape ft-shape-3"></div>
          </div>
        </div>
        
        <div className="ft-hero-content">
          <div className="ft-hero-badge">
            <span className="ft-badge-icon">💬</span>
            <span>Customer Stories</span>
          </div>
          
          <h1 className="ft-hero-title">
            What Our <span className="ft-highlight">Amazing Users</span> Say
          </h1>
          
          <p className="ft-hero-subtitle">
            Discover how our platform has transformed the experience of thousands of users worldwide
          </p>
          
          <div className="ft-hero-stats">
            <div className="ft-stat-item">
              <span className="ft-stat-number">{feedbacks.length}+</span>
              <span className="ft-stat-label">Happy Customers</span>
            </div>
            <div className="ft-stat-divider"></div>
            <div className="ft-stat-item">
              <span className="ft-stat-number">{averageRating}</span>
              <span className="ft-stat-label">Average Rating</span>
            </div>
            <div className="ft-stat-divider"></div>
            <div className="ft-stat-item">
              <span className="ft-stat-number">99%</span>
              <span className="ft-stat-label">Satisfaction</span>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="ft-testimonials-section">
        <div className="ft-container">
          <div className="ft-section-header">
            <h2 className="ft-section-title">Real Stories from Real People</h2>
            <p className="ft-section-subtitle">
              Join thousands of satisfied customers who have transformed their experience with us
            </p>
          </div>

          <div className="ft-testimonials-grid">
            {feedbacks.map((feedback, index) => {
              const color = avatarColors[index % avatarColors.length];
              const isHighlighted = index % 4 === 1; // Highlight every 4th card
              
              return (
                <div 
                  key={index} 
                  className={`ft-testimonial-card ${isHighlighted ? 'ft-highlighted' : ''}`}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="ft-card-header">
                    <div className="ft-quote-mark">"</div>
                    <div className="ft-rating-container">
                      <div className="ft-rating-stars">
                        {renderStars(feedback.rating)}
                      </div>
                      <span className="ft-rating-text">
                        {feedback.rating || 5}/5
                      </span>
                    </div>
                  </div>
                  
                  <div className="ft-card-content">
                    <p className="ft-testimonial-text">
                      {feedback.message}
                    </p>
                  </div>
                  
                  <div className="ft-card-footer">
                    <div className="ft-user-avatar" style={{ backgroundColor: color }}>
                      <span className="ft-avatar-text">
                        {getInitials(feedback.username)}
                      </span>
                      <div className="ft-avatar-ring"></div>
                    </div>
                    <div className="ft-user-details">
                      <h4 className="ft-user-name">{feedback.username}</h4>
                      <p className="ft-user-title">Verified Customer</p>
                    </div>
                    <div className="ft-verified-badge">
                      <svg className="ft-check-icon" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Call to Action */}
          <div className="ft-cta-section">
            <div className="ft-cta-content">
              <h3 className="ft-cta-title">Ready to Join Our Happy Customers?</h3>
              <p className="ft-cta-subtitle">
                Start your journey today and see why thousands trust us with their needs
              </p>
              <button className="ft-cta-button">
                <span>Get Started Now</span>
                <svg className="ft-arrow-icon" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default FedbackUser;

