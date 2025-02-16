import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function LogOut() {
  const navigate = useNavigate();

  useEffect(() => {
    // إزالة التوكن ثم الانتقال لصفحة تسجيل الدخول
    sessionStorage.removeItem('jwt');
    navigate('/login');
  }, [navigate]);

  return null;
}

export default LogOut;
