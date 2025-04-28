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
import FeedbackForm from '../Component/FeedbackForm';
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
import FaceIcon from '@mui/icons-material/Face';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import Fab from '@mui/material/Fab';
import Badge from '@mui/material/Badge';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import Popover from '@mui/material/Popover';

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

function NotificationFab() {
  const [anchorEl, setAnchorEl] = useState(null);
  const notValue = localStorage.getItem('not');
  const hasNotification = notValue === '0';

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);

  return (
    <>
      <Fab
        color="primary"
        aria-label="notifications"
        onClick={handleClick}
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.1)',
          '&:hover': {
            transform: 'scale(1.1)',
            transition: 'transform 0.2s',
          },
        }}
      >
        <Badge badgeContent={hasNotification ? 1 : 0} color="error">
          <LightbulbIcon />
        </Badge>
      </Fab>
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
      >
        <Box p={2}>
          {hasNotification ? (
            <Typography>انت ما دخلت لا مصروفاتك ولا إيراداتك لليوم!</Typography>
          ) : (
            <Typography>لا توجد إشعارات</Typography>
          )}
        </Box>
      </Popover>
    </>
  );
}

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
    { path: '/fedback', component: <FeedbackForm /> },
    { path: '/fedbackuser', component: <FedbackUser /> },
    { path: '/homepage', component: <HomePage /> },
    { path: '/alluser', component: <AcountUser /> },
    { path: '/poot', component: <Poot /> },
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
      segment: 'fedback',
      title: 'Fedback',
      icon: <ChatIcon />,
    },
    {
      segment: 'poot',
      title: 'Poot',
      icon: <FaceIcon />,
    },
    {
      segment: 'logout',
      title: 'logout',
      icon: <ExitToAppIcon />,
    },
  ]);

  const router = useDemoRouter('/homepage');
  const [openNotification, setOpenNotification] = useState(false);

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
              segment: 'fedback',
              title: 'Fedback',
              icon: <ChatIcon />,
            },
            {
              segment: 'poot',
              title: 'Poot',
              icon: <FaceIcon />,
            },
            {
              segment: 'logout',
              title: 'logout',
              icon: <ExitToAppIcon />,
            },
          ]);
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

    const notValue = localStorage.getItem('not');
    if (notValue === '0') {
      setOpenNotification(true);
    } else {
      setOpenNotification(false);
    }

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

  const handleCloseNotification = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setOpenNotification(false);
  };

  return (
    <AppProvider navigation={dashNavigate} router={router} theme={demoTheme} window={demoWindow}>
      <DashboardLayout>
        <Typography>{user.roul}</Typography>
        <PageContainer>
          <DemoPageContent pathname={currentComponent} />
        </PageContainer>
        <NotificationFab />
        <Snackbar
          open={openNotification}
          autoHideDuration={6000}
          onClose={handleCloseNotification}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert onClose={handleCloseNotification} severity="warning" sx={{ width: '100%' }}>
            انت ما دخلت لا مصروفاتك ولا إيراداتك لليوم!
          </Alert>
        </Snackbar>
      </DashboardLayout>
    </AppProvider>
  );
}

export default DashboardLayoutBasic;