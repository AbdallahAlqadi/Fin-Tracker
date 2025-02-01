import React, { useState } from 'react';
import '../cssStyle/login.css';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState('');

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // إرسال بيانات تسجيل الدخول إلى الخادم
      const res = await axios.post('http://127.0.0.1:5004/api/users/login', { email, password });
      setToken(res.data.token);
      alert('Login Successful');




      // إنشاء كائن يحتوي على بيانات المستخدم لإرساله
      const sendData = {
        email: email,
        password: password,
      };

      // التنقل إلى الصفحة الرئيسية وإرسال البيانات
      navigate('/tolpad');
      sessionStorage.setItem('jwt',res.data.token)
    } catch (error) {
      console.error(error.response.data);
      alert('Invalid username or password');
    }  };

  if (window.location.pathname === '/' || window.location.pathname === '/login') {
    document.body.style.background = `
    linear-gradient(
        135deg, 
        rgba(173, 216, 230, 0.8), 
        rgba(135, 206, 235, 0.9), 
        rgba(70, 130, 180, 0.8), 
        rgba(25, 25, 112, 0.85)
    )`;
    document.body.style.backgroundSize = '200% 200%';
    document.body.style.animation = 'gradientShift 8s ease infinite';

    const style = document.createElement('style');
    style.textContent = `
        @keyframes gradientShift {
            0% {
                background-position: 0% 50%;
            }
            50% {
                background-position: 100% 50%;
            }
            100% {
                background-position: 0% 50%;
            }
        }
    `;
    document.head.appendChild(style);
  }

  return (
    <div>
      <div className="title-container">
        <h1 className="title">Fin Tracker</h1>
      </div>
      <div className="login-container">
        <div className="login-box">
          <img
            src="https://cdn-icons-png.flaticon.com/512/3135/3135679.png"
            alt="Budget Logo"
            className="logo"
          />
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
          <div className="footer">
            <p>
              Don't have an account?{' '}
              <a
                style={{ cursor: 'pointer' }}
                onClick={() => {
                  navigate('/signup');
                }}
              >
                Sign up
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
