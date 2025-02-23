import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import SearchIcon from '@mui/icons-material/Search';
import { styled, useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';

// Styled table row with alternate row colors and a hover effect
const StyledTableRow = styled(TableRow)(({ theme }) => ({
  '&:nth-of-type(odd)': {
    backgroundColor: theme.palette.action.hover,
  },
  '&:hover': {
    backgroundColor: theme.palette.action.selected,
  },
  // إزالة الحدود للسطر الأخير
  '&:last-child td, &:last-child th': {
    border: 0,
  },
}));

// Styled table cell for header cells
const StyledTableCell = styled(TableCell)(({ theme }) => ({
  fontWeight: 'bold',
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.common.white,
  fontSize: '1rem',
  padding: '12px',
  border: '1px solid #ccc',
}));

const UsersTable = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const token = sessionStorage.getItem('jwt');
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // دالة لإزالة الحروف الخاصة من النص قبل إنشاء التعبير النظامي
  const escapeRegExp = (string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  };

  // دالة لتقسيم النص وتغليظ الجزء المطابق
  const highlightText = (text, query) => {
    if (!query) return text;
    const regex = new RegExp(`(${escapeRegExp(query)})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, index) =>
      regex.test(part) ? (
        <span key={index} style={{ backgroundColor: 'yellow' }}>
          {part}
        </span>
      ) : (
        part
      )
    );
  };

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const { data } = await axios.get('https://fin-tracker-ncbx.onrender.com/api/alluser', {
          headers: { Auth: `Bearer ${token}` },
        });
        setUsers(data.users);
        console.log(data.users);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [token]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Typography variant="h6" color="error" align="center" sx={{ mt: 4 }}>
        حدث خطأ أثناء جلب البيانات!
      </Typography>
    );
  }

  // تصفية المستخدمين بناءً على قيمة البحث (البريد الإلكتروني أو اسم المستخدم)
  const filteredUsers = users.filter((user) =>
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Box
      sx={{
        width: '100%',
        p: 2,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      {/* رأس الصفحة مع العنوان وعدد المستخدمين الإجمالي */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 2,
          gap: 2,
          width: '100%',
        }}
      >
        <Typography variant="h5" gutterBottom>
          Users Table
        </Typography>
        <Chip
          label={`Total Users: ${filteredUsers.length}`}
          color="primary"
          sx={{ fontSize: '1rem', padding: '8px' }}
        />
      </Box>
      {/* حقل البحث مع تحسين الشكل */}
      <Box sx={{ mb: 2, width: '100%', maxWidth: { xs: '100%', sm: '600px' } }}>
        <TextField
          label="Search by Email or Username"
          variant="outlined"
          fullWidth
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: '8px',
              boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
            },
          }}
        />
      </Box>
      {/* TableContainer بعرض أكبر */}
      <TableContainer
        component={Paper}
        sx={{
          maxHeight: { xs: '300px', sm: '400px' },
          width: { xs: '100%', sm: '800px', md: '1000px' }, // عرض متجاوب
          overflowX: 'auto', // Scroll أفقي عند الحاجة
          margin: '0 auto', // توسيط العنصر داخل الحاوية
          // تخصيص شكل شريط التمرير
          '&::-webkit-scrollbar': {
            width: '0.6em',
            height: '0.6em', // ارتفاع شريط التمرير الأفقي
          },
          '&::-webkit-scrollbar-track': {
            background: '#f1f1f1',
            borderRadius: '4px',
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: 'rgba(0,0,0,0.3)',
            borderRadius: '4px',
          },
          '&::-webkit-scrollbar-thumb:hover': {
            backgroundColor: 'rgba(0,0,0,0.5)',
          },
        }}
      >
        <Table sx={{ minWidth: isMobile ? 300 : 650 }} aria-label="users table">
          <caption style={{ captionSide: 'bottom', padding: '8px', fontSize: '1rem' }}>
            Displaying user information
          </caption>
          <TableHead
            sx={{
              position: 'sticky',
              top: 0,
              zIndex: 1,
            }}
          >
            <TableRow>
              <StyledTableCell>No.</StyledTableCell>
              <StyledTableCell align={isMobile ? 'center' : 'right'}>Role</StyledTableCell>
              <StyledTableCell align={isMobile ? 'center' : 'right'}>Username</StyledTableCell>
              <StyledTableCell align={isMobile ? 'center' : 'right'}>Email</StyledTableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user, index) => (
                <StyledTableRow key={user._id}>
                  <TableCell component="th" scope="row">
                    {index + 1}
                  </TableCell>
                  <TableCell align={isMobile ? 'center' : 'right'}>
                    {highlightText(user.roul, searchQuery)}
                  </TableCell>
                  <TableCell align={isMobile ? 'center' : 'right'}>
                    {highlightText(user.username, searchQuery)}
                  </TableCell>
                  <TableCell align={isMobile ? 'center' : 'right'}>
                    {highlightText(user.email, searchQuery)}
                  </TableCell>
                </StyledTableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  No matching users found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default UsersTable;