import React, { useState } from 'react';
import axios from 'axios'; // إضافة مكتبة axios
import '../cssStyle/signup.css'; // أو استخدم نفس ملف login.css إذا كنت تريد استخدام نفس الأنماط
import { useNavigate } from 'react-router-dom';

const Signup = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  
  const handleSubmit = async (e) => {
    e.preventDefault();
  
    // تحقق من إدخال الحقول
    if (!username || !email || !password) {
      alert('Please fill out all fields.');
      return;
    }
  
    // تحقق من قوة كلمة المرور
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      alert('Password must be at least 8 characters long, contain at least one uppercase letter, one lowercase letter, one number, and one special character.');
      return;
    }
  
    try {
      const res = await axios.post('http://127.0.0.1:5003/api/users', {
        username,
        email,
        password,
      });
  
      if (res.status === 200) {
        alert('User added successfully!');
        navigate('/'); // إعادة التوجيه إلى صفحة تسجيل الدخول
      } else {
        alert('Failed to add user.');
      }
    } catch (error) {
      console.error('Error adding user:', error);
      alert('An error occurred while adding the user.');
    }
  };


  // تغيير خلفية الصفحة عند فتح صفحة التسجيل
  React.useEffect(() => {
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
