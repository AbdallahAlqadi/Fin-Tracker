import PropTypes from 'prop-types';
import axios from 'axios';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { createTheme } from '@mui/material/styles';
import DashboardIcon from '@mui/icons-material/Dashboard';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
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
            <Typography>{pathname}</Typography>

    </Box>
  );
}

DemoPageContent.propTypes = {
  pathname: PropTypes.string.isRequired,
};

function DashboardLayoutBasic(props) {
  const { window } = props;
  const [user, setUser] = useState({});
  const navigate = useNavigate();
  const location = useLocation();

  //Component webSite
  const allPages = [
    { path: '/dashboard', component: <CategoryForm /> },
    { path: '/dashboarduser', component: <DashboardUser /> },
    { path: '/showdatauser', component: <BudgetItems /> },
    { path: '/graphdatauser', component: <Graph /> },
    { path: '/comparison', component: <Comparison /> },
    { path: '/fedback', component: <FeedbackForm /> },



 
  ];

  const [currentComponent, setCurrentComponent] = useState(<CategoryForm />);
  const [dashNavigate, setDashNavigate] = useState([
    //كبسات يلي بتوديني على الصفحات
    
    {
      segment: 'dashboarduser',  //هون بحط path
      title: 'DashbordUser',
      icon: <DashboardCustomizeIcon />,
    },
    {
      segment: 'showdatauser',  //هون بحط path
      title: 'ShowDataUser',
      icon: <AddToDriveIcon />,
    },
    {
      segment: 'graphdatauser',  //هون بحط path
      title: 'Graph',
      icon: <DataSaverOffIcon />,
    },
    {
      segment: 'comparison',
      title: 'Comparison',
      icon: <SignalCellularAltIcon />,
    },
    {
      segment: 'fedback',  //هون بحط path
      title: 'Fedback',
      icon: <ShoppingCartIcon />,
    },
    {
      segment: 'LogOut',
      title: '',
      icon: (
        <Box
          onClick={() => {
            sessionStorage.removeItem('jwt');
            navigate('/login');
          }}
          sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
        >
          <ExitToAppIcon />
          <Typography sx={{ ml: 1 }}>LogOut</Typography>
        </Box>
      ),
    },
    
  ]);

  //default page
  const router = useDemoRouter('/dashboard');

  useEffect(() => {
    const token = sessionStorage.getItem('jwt');

    const invaliedToken = async () => {
      try {
        const res = await axios.get('http://127.0.0.1:5004/api/home', {
          headers: {
            Auth: 'Bearer ' + token,
          },
        });

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
              segment: 'dashboarduser',  //هون بحط path
              title: 'DashbordUser',
              icon: <DashboardCustomizeIcon />,
            },
            {
              segment: 'showdatauser',  //هون بحط path
              title: 'ShowDataUser',
              icon: <AddToDriveIcon />,
            },
            {
              segment: 'graphdatauser',  //هون بحط path
              title: 'Graph',
              icon: <DataSaverOffIcon />,
            },
           
            {
              segment: 'comparison',
              title: 'Comparison',
              icon: <SignalCellularAltIcon />,
            },
            
            {
              segment: 'LogOut',
              title: '',
              icon: (
                <Box
                  onClick={() => {
                    sessionStorage.removeItem('jwt');
                    navigate('/login');
                  }}
                  sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
                >
                  <ExitToAppIcon />
                  <Typography sx={{ ml: 1 }}>LogOut</Typography>
                </Box>
              ),
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
    </AppProvider>
  );
}

export default DashboardLayoutBasic;
