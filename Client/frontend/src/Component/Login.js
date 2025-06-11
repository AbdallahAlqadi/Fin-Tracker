import React, { useState, useEffect } from 'react';
import '../cssStyle/login.css';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // Animated background with a modern look
    document.body.style.background = `
      #4299e1`;
    document.body.style.backgroundSize = '200% 200%';
    document.body.style.animation = 'gradientShift 8s ease infinite';

    // Add background animation if not already present
    if (!document.getElementById('gradientShiftStyle')) {
      const style = document.createElement('style');
      style.id = 'gradientShiftStyle';
      style.textContent = `
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('https://fin-tracker-ncbx.onrender.com/api/users/login', { email, password });
      sessionStorage.setItem('jwt', res.data.token);
      navigate('/tolpad');
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Invalid login credentials',
      });
    }
  };

  return (
    <div className="login-page">
      <div className="login-box">
        <div className="logo-container">
          <img
            src="https://cdn-icons-png.flaticon.com/512/3135/3135679.png"
            alt="Logo"
            className="logo"
          />
          <h1>Fin Tracker</h1>
        </div>
        <h2>Login</h2>
        <form onSubmit={handleSubmit}>
          <div className="input-group">
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
          <div className="input-group">
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
          <button type="submit" className="login-button">Login</button>
        </form>
        <div className="signup-link">
          <p>
            Don't have an account?{' '}
            <span onClick={() => navigate('/signup')}>
              Sign up now
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
