import PropTypes from 'prop-types';
import axios from 'axios';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { createTheme } from '@mui/material/styles';
import DashboardIcon from '@mui/icons-material/Dashboard';
import { AppProvider } from '@toolpad/core/AppProvider';
import { DashboardLayout } from '@toolpad/core/DashboardLayout';
import { useNavigate, useLocation } from 'react-router-dom';
import React, { useEffect, useState } from 'react';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import { PageContainer } from '@toolpad/core/PageContainer';
import CategoryForm from '../Component/dashbordAdmin';
import DashboardUser from '../Component/dashbordUser';
import BudgetItems from '../Component/datauser';
import Graph from '../Component/graphdatauser';
import Comparison from '../Component/comparison';
import DashboardCustomizeIcon from '@mui/icons-material/DashboardCustomize';
import AddToDriveIcon from '@mui/icons-material/AddToDrive';
import SignalCellularAltIcon from '@mui/icons-material/SignalCellularAlt';
import DataSaverOffIcon from '@mui/icons-material/DataSaverOff';
import FedbackUser from '../Component/fedbackuser';
import ChatIcon from '@mui/icons-material/Chat';
import ChatBubbleIcon from '@mui/icons-material/ChatBubble';
import HomePage from '../Component/Homepage';
import AcountUser from '../Component/AcountUser';
import LogOut from '../Component/LogOut';
import Poot from '../Component/Poot';
import Settings from '../Component/Settings';
import FaceIcon from '@mui/icons-material/Face';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import SettingsIcon from '@mui/icons-material/Settings';
// Remove Swal import - we'll use custom modal instead
// import Swal from 'sweetalert2';

// Professional Welcome Modal Component
const ProfessionalWelcomeModal = ({ isOpen, onClose, userName }) => {
  if (!isOpen) return null;

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(8px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        animation: 'fadeIn 0.3s ease-out'
      }}
      onClick={onClose}
    >
      <div 
        style={{
          backgroundColor: 'white',
          borderRadius: '20px',
          boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25)',
          maxWidth: '450px',
          width: '100%',
          padding: '40px 30px',
          textAlign: 'center',
          position: 'relative',
          animation: 'slideIn 0.3s ease-out',
          transform: 'scale(1)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '15px',
            right: '15px',
            background: 'none',
            border: 'none',
            fontSize: '24px',
            color: '#666',
            cursor: 'pointer',
            padding: '5px',
            borderRadius: '50%',
            transition: 'all 0.2s ease'
          }}
          onMouseOver={(e) => e.target.style.backgroundColor = '#f0f0f0'}
          onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
        >
          ×
        </button>

        {/* Welcome Icon */}
        <div style={{ marginBottom: '25px' }}>
          <div style={{
            width: '80px',
            height: '80px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
            animation: 'pulse 2s infinite',
            position: 'relative'
          }}>
            <span style={{ fontSize: '36px', color: 'white' }}>✨</span>
            <div style={{
              position: 'absolute',
              top: '-5px',
              right: '-5px',
              width: '25px',
              height: '25px',
              backgroundColor: '#10B981',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <span style={{ fontSize: '14px', color: 'white' }}>✓</span>
            </div>
          </div>
        </div>

        {/* Welcome Message */}
        <h2 style={{
          fontSize: '28px',
          fontWeight: 'bold',
          color: '#1f2937',
          marginBottom: '15px',
          lineHeight: '1.3'
        }}>
          Welcome Back, {userName}! 👋
        </h2>

        <p style={{
          fontSize: '16px',
          color: '#6b7280',
          marginBottom: '30px',
          lineHeight: '1.5'
        }}>
          We're delighted to have you here. Ready to explore amazing features and achieve great things together?
        </p>

        {/* Action Button */}
        <button
          onClick={onClose}
          style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            border: 'none',
            padding: '12px 30px',
            borderRadius: '25px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px'
          }}
          onMouseOver={(e) => {
            e.target.style.transform = 'translateY(-2px)';
            e.target.style.boxShadow = '0 10px 25px rgba(102, 126, 234, 0.4)';
          }}
          onMouseOut={(e) => {
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = 'none';
          }}
        >
          Get Started <span>→</span>
        </button>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideIn {
          from { 
            opacity: 0;
            transform: scale(0.9) translateY(-20px);
          }
          to { 
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
      `}</style>
    </div>
  );
};

// Professional Welcome Toast Component
const ProfessionalWelcomeToast = ({ isVisible, onClose, userName }) => {
  if (!isVisible) return null;

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      zIndex: 9998,
      animation: 'slideInRight 0.3s ease-out'
    }}>
      <div style={{
        backgroundColor: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: '12px',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
        padding: '16px',
        maxWidth: '320px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          background: 'linear-gradient(135deg, #10B981 0%, #3B82F6 100%)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <span style={{ fontSize: '20px', color: 'white' }}>😊</span>
        </div>
        
        <div style={{ flex: 1 }}>
          <p style={{
            fontWeight: '600',
            color: '#1f2937',
            fontSize: '14px',
            margin: '0 0 4px 0'
          }}>
            Welcome, {userName}!
          </p>
          <p style={{
            color: '#6b7280',
            fontSize: '12px',
            margin: 0
          }}>
            Ready to get started?
          </p>
        </div>
        
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: '#9ca3af',
            cursor: 'pointer',
            padding: '4px',
            borderRadius: '4px',
            fontSize: '16px'
          }}
          onMouseOver={(e) => e.target.style.color = '#6b7280'}
          onMouseOut={(e) => e.target.style.color = '#9ca3af'}
        >
          ×
        </button>
      </div>

      <style jsx>{`
        @keyframes slideInRight {
          from { 
            opacity: 0;
            transform: translateX(100%);
          }
          to { 
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  );
};

const demoTheme = createTheme({
  palette: {
    mode: 'light',
    background: {
      default: '#ffffff',
    },
  },
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 600,
      lg: 1200,
      xl: 1536,
    },
  },
});

function useDemoRouter(initialPath) {
  const [pathname, setPathname] = React.useState(initialPath);

  const router = React.useMemo(() => {
    return {
      pathname,
      searchParams: new URLSearchParams(),
      navigate: (path) => setPathname(String(path)),
    };
  }, [pathname]);

  return router;
}

function DemoPageContent({ pathname }) {
  return (
    <Box
      sx={{
        py: 4,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
      }}
    >
      <Typography component="div">{pathname}</Typography>
    </Box>
  );
}

DemoPageContent.propTypes = {
  pathname: PropTypes.oneOfType([PropTypes.string, PropTypes.node]).isRequired,
};

function DashboardLayoutBasic(props) {
  const { window } = props;
  const [user, setUser] = useState({});
  const navigate = useNavigate();
  const location = useLocation();

  // Welcome message states
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [showWelcomeToast, setShowWelcomeToast] = useState(false);

  const allPages = [
    { path: '/dashboard', component: <CategoryForm /> },
    { path: '/dashboarduser', component: <DashboardUser /> },
    { path: '/showdatauser', component: <BudgetItems /> },
    { path: '/graphdatauser', component: <Graph /> },
    { path: '/comparison', component: <Comparison /> },
    { path: '/fedbackuser', component: <FedbackUser /> },
    { path: '/homepage', component: <HomePage /> },
    { path: '/alluser', component: <AcountUser /> },
    { path: '/poot', component: <Poot /> },
    { path: '/setting', component: <Settings /> },
    { path: '/logout', component: <LogOut /> },
  ];

  const [currentComponent, setCurrentComponent] = useState(<CategoryForm />);
  const [dashNavigate, setDashNavigate] = useState([
    {
      segment: 'dashboarduser',
      title: 'DashbordUser',
      icon: <DashboardCustomizeIcon />,
    },
    {
      segment: 'showdatauser',
      title: 'ShowDataUser',
      icon: <AddToDriveIcon />,
    },
    {
      segment: 'graphdatauser',
      title: 'Graph',
      icon: <DataSaverOffIcon />,
    },
    {
      segment: 'comparison',
      title: 'Comparison',
      icon: <SignalCellularAltIcon />,
    },
    {
      segment: 'poot',
      title: 'Report',
      icon: <FaceIcon />,
    },
    {
      segment: 'setting',
      title: 'setting',
      icon: <SettingsIcon />,
    },
    {
      segment: 'logout',
      title: 'logout',
      icon: <ExitToAppIcon />
    },
  ]);

  const router = useDemoRouter('/homepage');

  useEffect(() => {
    const token = sessionStorage.getItem('jwt');

    const invaliedToken = async () => {
      try {
        const res = await axios.get('https://fin-tracker-ncbx.onrender.com/api/home', {
          headers: {
            Auth: 'Bearer ' + token,
          },
        });

        sessionStorage.setItem('username', res.data.user);
        setUser(res.data.user);

        if (res.data.roul === 'admin') {
          console.log('User is admin');
          setDashNavigate([
            {
              segment: 'dashboard',
              title: 'Dashboard',
              icon: <DashboardIcon />,
            },
            {
              segment: 'dashboarduser',
              title: 'DashbordUser',
              icon: <DashboardCustomizeIcon />,
            },
            {
              segment: 'showdatauser',
              title: 'ShowDataUser',
              icon: <AddToDriveIcon />,
            },
            {
              segment: 'graphdatauser',
              title: 'Graph',
              icon: <DataSaverOffIcon />,
            },
            {
              segment: 'comparison',
              title: 'Comparison',
              icon: <SignalCellularAltIcon />,
            },
            {
              segment: 'alluser',
              title: 'AllUserAcount',
              icon: <AccountCircleIcon />,
            },
            {
              segment: 'fedbackuser',
              title: 'FedbakUser',
              icon: <ChatBubbleIcon />,
            },
            {
              segment: 'poot',
              title: 'Report',
              icon: <FaceIcon />,
            },
            {
              segment: 'setting',
              title: 'setting',
              icon: <SettingsIcon />,
            },
            {
              segment: 'logout',
              title: 'logout',
              icon: <ExitToAppIcon />
            },
          ]);
        }

        // PROFESSIONAL WELCOME MESSAGE - REPLACES SWEETALERT2
        if (sessionStorage.getItem('showWelcome') === 'true') {
          // Show professional modal welcome
          setShowWelcomeModal(true);
          
          // Also show toast notification
          setShowWelcomeToast(true);
          
          // Auto-hide toast after 5 seconds
          setTimeout(() => {
            setShowWelcomeToast(false);
          }, 5000);
          
          sessionStorage.removeItem('showWelcome');
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        if (err.response && err.response.status === 401) {
          navigate('/');
        } else {
          console.error('Unexpected error:', err.message);
        }
      }
    };
    invaliedToken();
    setCurrentComponent(allPages.find((page) => page.path === router.pathname)?.component);
  }, [router]);

  useEffect(() => {
    if (location.pathname === '/tolpad') {
      document.body.style.background = 'rgba(245, 245, 245, 0.8)';
    } else {
      document.body.style.background = '';
    }
  }, [location.pathname]);

  const demoWindow = window !== undefined ? window() : undefined;

  return (
    <AppProvider navigation={dashNavigate} router={router} theme={demoTheme} window={demoWindow}>
      <DashboardLayout>
        <Typography>{user.roul}</Typography>
        <PageContainer>
          <DemoPageContent pathname={currentComponent} />
        </PageContainer>
      </DashboardLayout>

      {/* Professional Welcome Modal */}
      <ProfessionalWelcomeModal 
        isOpen={showWelcomeModal} 
        onClose={() => setShowWelcomeModal(false)} 
        userName={user}
      />

      {/* Professional Welcome Toast */}
      <ProfessionalWelcomeToast 
        isVisible={showWelcomeToast}
        onClose={() => setShowWelcomeToast(false)}
        userName={user}
      />
    </AppProvider>
  );
}

export default DashboardLayoutBasic;

