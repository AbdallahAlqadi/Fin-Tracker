// Login.js - الكود المُصحح
import React, { useState } from 'react';
import axios from 'axios';

const Login = () => {
  const [credentials, setCredentials] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post('/api/login', credentials);
      
      // طباعة للتأكد من البيانات المُستلمة
      console.log('Login response:', response.data);
      
      // استخراج اسم المستخدم بشكل آمن
      let username = '';
      
      if (response.data.username) {
        // إذا كان اسم المستخدم موجود مباشرة
        username = response.data.username;
      } else if (response.data.user) {
        // إذا كان موجود تحت حقل user
        if (typeof response.data.user === 'string') {
          // إذا كان user عبارة عن نص
          username = response.data.user;
        } else if (typeof response.data.user === 'object' && response.data.user.username) {
          // إذا كان user كائن يحتوي على username
          username = response.data.user.username;
        } else if (typeof response.data.user === 'object' && response.data.user.name) {
          // إذا كان user كائن يحتوي على name
          username = response.data.user.name;
        }
      }
      
      // التأكد من وجود اسم المستخدم قبل الحفظ
      if (username) {
        // حفظ اسم المستخدم في sessionStorage
        sessionStorage.setItem('username', username);
        console.log('Username saved to sessionStorage:', username);
        
        // حفظ التوكن إذا كان موجود
        if (response.data.token) {
          sessionStorage.setItem('token', response.data.token);
        }
        
        // إعادة توجيه للوحة التحكم
        window.location.href = '/dashboard';
      } else {
        setError('لم يتم العثور على اسم المستخدم في الاستجابة');
        console.error('Username not found in response:', response.data);
      }
      
    } catch (err) {
      console.error('Login error:', err);
      setError(err.response?.data?.message || 'حدث خطأ أثناء تسجيل الدخول');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <form onSubmit={handleSubmit} className="login-form">
        <h2>تسجيل الدخول</h2>
        
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}
        
        <div className="form-group">
          <label htmlFor="email">البريد الإلكتروني:</label>
          <input
            type="email"
            id="email"
            value={credentials.email}
            onChange={(e) => setCredentials({
              ...credentials,
              email: e.target.value
            })}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="password">كلمة المرور:</label>
          <input
            type="password"
            id="password"
            value={credentials.password}
            onChange={(e) => setCredentials({
              ...credentials,
              password: e.target.value
            })}
            required
          />
        </div>
        
        <button type="submit" disabled={loading}>
          {loading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
        </button>
      </form>
    </div>
  );
};

export default Login;

