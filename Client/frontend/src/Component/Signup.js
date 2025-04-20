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

    // تحقق من الحقول
    if (!username || !email || !password) {
      Swal.fire({ icon: 'error', title: 'Oops...', text: 'Please fill out all fields.' });
      return;
    }

    // تحقق من صحة الإيميل
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      Swal.fire({ icon: 'error', title: 'Invalid Email', text: 'Please enter a valid email address.' });
      return;
    }

    // تحقق من قوة الباسوورد
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      Swal.fire({
        icon: 'error',
        title: 'Weak Password',
        text: 'Password must be at least 8 characters long and include uppercase, lowercase, number, and special character.'
      });
      return;
    }

    try {
      // الخطوة 1: إرسال كود التحقق إلى الإيميل
      const sendCodeRes = await axios.post('https://your-api.com/api/users/send-verification-code', {
        email,
      });

      if (sendCodeRes.status === 200) {
        // الخطوة 2: طلب الكود من المستخدم
        const { value: verificationCode } = await Swal.fire({
          title: 'Enter Verification Code',
          input: 'text',
          inputLabel: 'Check your email and enter the code below',
          inputPlaceholder: 'Enter verification code',
          showCancelButton: true
        });

        if (!verificationCode) return;

        // الخطوة 3: التحقق من الكود وإنشاء المستخدم
        const res = await axios.post('https://your-api.com/api/users/verify-and-register', {
          username,
          email,
          password,
          code: verificationCode
        });

        if (res.status === 200) {
          Swal.fire({
            icon: 'success',
            title: 'Success!',
            text: 'Account created successfully!'
          }).then(() => {
            navigate('/');
          });
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Verification Failed',
            text: 'The code you entered is invalid or expired.'
          });
        }
      }
    } catch (error) {
      console.error('Error:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Something went wrong. Please try again.'
      });
    }
  };

  useEffect(() => {
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
            <input type="text" id="username" value={username} onChange={(e) => setUsername(e.target.value)} />
          </div>
          <div className="input-container">
            <label htmlFor="email">Email</label>
            <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="input-container">
            <label htmlFor="password">Password</label>
            <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <button type="submit" className="btn-signup">Sign Up</button>
        </form>
        <div className="footer-text">
          <p>Already have an account? <span onClick={() => navigate('/')}>Login</span></p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
