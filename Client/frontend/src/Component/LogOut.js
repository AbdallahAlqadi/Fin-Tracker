import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function LogOut() {
  const navigate = useNavigate();

  useEffect(() => {
    sessionStorage.removeItem('jwt');
    navigate('/login');
  }, [navigate]);

  return null;
}

export default LogOut;
