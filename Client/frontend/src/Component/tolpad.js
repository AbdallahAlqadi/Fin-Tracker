// src/layouts/DashboardLayoutBasic.jsx

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
import FedbackUser from '../Component/fedbackuser';
import HomePage from '../Component/Homepage';
import AcountUser from '../Component/AcountUser';
import LogOut from '../Component/LogOut';
import Poot from '../Component/Poot';
import Settings from '../Component/Settings';
import FaceIcon from '@mui/icons-material/Face';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import SettingsIcon from '@mui/icons-material/Settings';
import Swal from 'sweetalert2';

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
  return React.useMemo(
    () => ({
      pathname,
      searchParams: new URLSearchParams(),
      navigate: (path) => setPathname(String(path)),
    }),
    [pathname]
  );
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
      icon: <DashboardIcon />,
    },
    // ... other default nav items
    { segment: 'logout', title: 'logout', icon: <ExitToAppIcon /> },
  ]);

  // default to homepage (or tolopad) after login
  const router = useDemoRouter('/homepage');

  useEffect(() => {
    const token = sessionStorage.getItem('jwt');

    const invaliedToken = async () => {
      try {
        const res = await axios.get(
          'https://fin-tracker-ncbx.onrender.com/api/home',
          {
            headers: { Auth: 'Bearer ' + token },
          }
        );

        if (res.data.user && res.data.user.username) {
          sessionStorage.setItem('username', res.data.user.username);
        }
        setUser(res.data.user);

        // Show welcome once if flagged
        if (sessionStorage.getItem('showWelcomeMessage') === 'true') {
          const storedUsername = sessionStorage.getItem('username');
          Swal.fire({
            icon: 'success',
            title: `مرحباً بك يا ${storedUsername}!`,
            showConfirmButton: false,
            timer: 2000,
          });
          sessionStorage.removeItem('showWelcomeMessage');
        }

        // adjust nav for admin
        if (res.data.roul === 'admin') {
          setDashNavigate([
            { segment: 'dashboard', title: 'Dashboard', icon: <DashboardIcon /> },
            // ... other admin nav items
            { segment: 'logout', title: 'logout', icon: <ExitToAppIcon /> },
          ]);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        if (err.response?.status === 401) {
          navigate('/');
        }
      }
    };

    invaliedToken();
    setCurrentComponent(
      allPages.find((page) => page.path === router.pathname)?.component
    );
  }, [router, navigate]);

  useEffect(() => {
    if (location.pathname === '/tolpad') {
      document.body.style.background = 'rgba(245, 245, 245, 0.8)';
    } else {
      document.body.style.background = '';
    }
  }, [location.pathname]);

  const demoWindow = window ? window() : undefined;

  return (
    <AppProvider navigation={dashNavigate} router={router} theme={demoTheme} window={demoWindow}>
      <DashboardLayout>
        <Typography>{user.roul}</Typography>
        <PageContainer>
          <DemoPageContent pathname={currentComponent} />
        </PageContainer>
      </DashboardLayout>
    </AppProvider>
  );
}

export default DashboardLayoutBasic;
