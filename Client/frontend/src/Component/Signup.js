import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../cssStyle/signup.css';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2'; // استيراد SweetAlert2

const Signup = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    // التحقق من إدخال جميع الحقول
    if (!username || !email || !password) {
      Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text: 'Please fill out all fields.'
      });
      return;
    }

    // قيود على البريد الإلكتروني باستخدام تعبير منتظم
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      Swal.fire({
        icon: 'error',
        title: 'Invalid Email',
        text: 'Please enter a valid email address.'
      });
      return;
    }

    // التحقق من قوة كلمة المرور باستخدام تعبير منتظم:
    // - على الأقل 8 أحرف
    // - حرف كبير واحد على الأقل
    // - حرف صغير واحد على الأقل
    // - رقم واحد على الأقل
    // - حرف خاص واحد على الأقل (من @$!%*?&)
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
      const res = await axios.post('http://127.0.0.1:5002/api/users', {
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
          navigate('/'); // إعادة التوجيه إلى صفحة تسجيل الدخول بعد الضغط على الزر
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

  // تغيير خلفية الصفحة عند فتح صفحة التسجيل
  useEffect(() => {
    if (window.location.pathname === '/signup') {
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

      return () => {
        // إزالة التأثير عند مغادرة الصفحة
        document.body.style.background = '';
        document.body.style.animation = '';
      };
    }
  }, []);

  return (
    <div>
      <div className="title-container">
        <h1 className="title">Fin Tracker</h1>
      </div>
      <div className="signup-container">
        <div className="signup-box">
          <img
            src="https://cdn-icons-png.flaticon.com/512/3135/3135679.png"
            alt="Budget Logo"
            className="logo"
          />
          <h2>Sign Up</h2>
          <form onSubmit={handleSubmit}>
            <div className="input-group">
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
            <button type="submit" className="signup-button">Sign Up</button>
          </form>
          <div className="footer">
            <p>
              Already have an account?{' '}
              <a style={{ cursor: 'pointer' }} onClick={() => navigate('/')}>
                Login
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
