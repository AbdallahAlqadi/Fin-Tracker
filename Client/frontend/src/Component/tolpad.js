// DashboardLayoutBasic.js - الكود المُصحح
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const DashboardLayoutBasic = ({ children }) => {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    // استخراج اسم المستخدم من sessionStorage
    const storedUsername = sessionStorage.getItem('username');
    console.log('Username from sessionStorage:', storedUsername);
    
    if (storedUsername && storedUsername !== 'undefined') {
      setUsername(storedUsername);
      setLoading(false);
    } else {
      // إذا لم يكن موجود، محاولة جلب بيانات المستخدم من الخادم
      fetchUserProfile();
    }
  }, []);

  const fetchUserProfile = async () => {
    try {
      const token = sessionStorage.getItem('token');
      if (!token) {
        // إعادة توجيه لصفحة تسجيل الدخول إذا لم يكن هناك توكن
        window.location.href = '/login';
        return;
      }

      const response = await axios.get('/api/user/profile', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      console.log('User profile response:', response.data);

      // استخراج اسم المستخدم بشكل آمن من الاستجابة
      let extractedUsername = '';
      
      if (response.data.username) {
        extractedUsername = response.data.username;
      } else if (response.data.user) {
        if (typeof response.data.user === 'string') {
          extractedUsername = response.data.user;
        } else if (typeof response.data.user === 'object') {
          extractedUsername = response.data.user.username || 
                             response.data.user.name || 
                             response.data.user.email?.split('@')[0] || '';
        }
      } else if (response.data.name) {
        extractedUsername = response.data.name;
      }

      if (extractedUsername) {
        // حفظ اسم المستخدم في sessionStorage فقط إذا لم يكن موجود
        const currentStoredUsername = sessionStorage.getItem('username');
        if (!currentStoredUsername || currentStoredUsername === 'undefined') {
          sessionStorage.setItem('username', extractedUsername);
          console.log('Username saved to sessionStorage from profile:', extractedUsername);
        }
        
        setUsername(extractedUsername);
        setUserProfile(response.data);
      } else {
        console.error('Could not extract username from profile response');
        // يمكن استخدام البريد الإلكتروني كبديل
        if (response.data.email) {
          const emailUsername = response.data.email.split('@')[0];
          setUsername(emailUsername);
          sessionStorage.setItem('username', emailUsername);
        }
      }
      
    } catch (error) {
      console.error('Error fetching user profile:', error);
      if (error.response?.status === 401) {
        // إعادة توجيه لصفحة تسجيل الدخول إذا انتهت صلاحية التوكن
        sessionStorage.clear();
        window.location.href = '/login';
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    // مسح جميع البيانات المحفوظة
    sessionStorage.clear();
    localStorage.clear();
    
    // إعادة توجيه لصفحة تسجيل الدخول
    window.location.href = '/login';
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">جاري التحميل...</div>
      </div>
    );
  }

  return (
    <div className="dashboard-layout">
      {/* شريط التنقل العلوي */}
      <header className="dashboard-header">
        <div className="header-content">
          <div className="logo">
            <h1>لوحة التحكم</h1>
          </div>
          
          <div className="user-section">
            <span className="welcome-message">
              مرحباً، {username || 'مستخدم'}
            </span>
            <button 
              onClick={handleLogout}
              className="logout-button"
            >
              تسجيل الخروج
            </button>
          </div>
        </div>
      </header>

      {/* الشريط الجانبي */}
      <aside className="dashboard-sidebar">
        <nav className="sidebar-nav">
          <ul>
            <li><a href="/dashboard">الرئيسية</a></li>
            <li><a href="/dashboard/profile">الملف الشخصي</a></li>
            <li><a href="/dashboard/settings">الإعدادات</a></li>
          </ul>
        </nav>
      </aside>

      {/* المحتوى الرئيسي */}
      <main className="dashboard-main">
        <div className="main-content">
          {children}
        </div>
      </main>

      {/* تصحيح الأخطاء - يمكن إزالته في الإنتاج */}
      {process.env.NODE_ENV === 'development' && (
        <div className="debug-info" style={{
          position: 'fixed',
          bottom: '10px',
          right: '10px',
          background: '#f0f0f0',
          padding: '10px',
          fontSize: '12px',
          border: '1px solid #ccc'
        }}>
          <strong>معلومات التصحيح:</strong><br />
          اسم المستخدم: {username || 'غير محدد'}<br />
          sessionStorage username: {sessionStorage.getItem('username') || 'غير موجود'}
        </div>
      )}
    </div>
  );
};

export default DashboardLayoutBasic;

