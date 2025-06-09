import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../cssStyle/signup.css';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

const Signup = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!username || !email || !password) {
      Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text: 'Please fill out all fields.'
      });
      return;
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      Swal.fire({
        icon: 'error',
        title: 'Invalid Email',
        text: 'Please enter a valid email address.'
      });
      return;
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      Swal.fire({
        icon: 'error',
        title: 'Weak Password',
        text: 'Password must be at least 8 characters long, contain at least one uppercase letter, one lowercase letter, one number, and one special character.'
      });
      return;
    }

    try {
      const res = await axios.post('https://fin-tracker-ncbx.onrender.com/api/users', {
        username,
        email,
        password,
      });

      if (res.status === 200) {
        Swal.fire({
          icon: 'success',
          title: 'Success!',
          text: 'User added successfully!'
        }).then(() => {
          navigate('/');
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to add user.'
        });
      }
    } catch (error) {
      console.error('Error adding user:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'An error occurred while adding the user.'
      });
    }
  };

  useEffect(() => {
    // تغيير خلفية الصفحة بتأثير متدرج احترافي
    document.body.style.background = `#4299e1`;
    document.body.style.backgroundSize = '400% 400%';
    document.body.style.animation = 'bgAnimation 15s ease infinite';

    if (!document.getElementById('bgAnimationStyle')) {
      const style = document.createElement('style');
      style.id = 'bgAnimationStyle';
      style.textContent = `
        @keyframes bgAnimation {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `;
      document.head.appendChild(style);
    }

    return () => {
      document.body.style.background = '';
      document.body.style.animation = '';
    };
  }, []);

  return (
    <div className="signup-wrapper">
      <div className="signup-card">
        <div className="header">
          <img 
            src="https://cdn-icons-png.flaticon.com/512/3135/3135679.png" 
            alt="Logo" 
            className="logo"
          />
          <h1>Fin Tracker</h1>
        </div>
        <h2>Create Account</h2>
        <form onSubmit={handleSubmit}>
          <div className="input-container">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              required
            />
          </div>
          <div className="input-container">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
            />
          </div>
          <div className="input-container">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>
          <button type="submit" className="btn-signup">Sign Up</button>
        </form>
        <div className="footer-text">
          <p>
            Already have an account?{' '}
            <span onClick={() => navigate('/')}>Login</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
