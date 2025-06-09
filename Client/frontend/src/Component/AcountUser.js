import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Typography,
  Box,
  Chip,
  TextField,
  InputAdornment,
  Button,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Snackbar,
  Alert,
  Card,
  CardContent,
  Grid,
  Avatar,
  Tooltip,
  Fade,
  Slide,
  useMediaQuery,
  Container,
  AppBar,
  Toolbar,
  Badge
} from '@mui/material';
import {
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  AdminPanelSettings as AdminIcon,
  Visibility as ViewIcon,
  Close as CloseIcon,
  Save as SaveIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import { styled, useTheme, alpha } from '@mui/material/styles';

// Enhanced styled components with modern design
const StyledTableRow = styled(TableRow)(({ theme }) => ({
  '&:nth-of-type(odd)': {
    backgroundColor: alpha(theme.palette.primary.main, 0.02),
  },
  '&:hover': {
    backgroundColor: alpha(theme.palette.primary.main, 0.08),
    transform: 'translateY(-1px)',
    boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
  },
  transition: 'all 0.2s ease-in-out',
  '&:last-child td, &:last-child th': {
    border: 0,
  },
}));

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  fontWeight: 600,
  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
  color: theme.palette.common.white,
  fontSize: '0.95rem',
  padding: '16px',
  textAlign: 'center',
  position: 'sticky',
  top: 0,
  zIndex: 10,
  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
}));

const StyledCard = styled(Card)(({ theme }) => ({
  background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.9)} 0%, ${alpha(theme.palette.background.default, 0.9)} 100%)`,
  backdropFilter: 'blur(10px)',
  borderRadius: '16px',
  boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  overflow: 'hidden',
}));

const ActionButton = styled(IconButton)(({ theme, variant }) => ({
  borderRadius: '12px',
  padding: '8px',
  margin: '0 4px',
  transition: 'all 0.2s ease-in-out',
  ...(variant === 'edit' && {
    backgroundColor: alpha(theme.palette.info.main, 0.1),
    color: theme.palette.info.main,
    '&:hover': {
      backgroundColor: alpha(theme.palette.info.main, 0.2),
      transform: 'scale(1.1)',
    },
  }),
  ...(variant === 'delete' && {
    backgroundColor: alpha(theme.palette.error.main, 0.1),
    color: theme.palette.error.main,
    '&:hover': {
      backgroundColor: alpha(theme.palette.error.main, 0.2),
      transform: 'scale(1.1)',
    },
  }),
}));

const SearchField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: '25px',
    backgroundColor: alpha(theme.palette.background.paper, 0.8),
    backdropFilter: 'blur(10px)',
    transition: 'all 0.3s ease-in-out',
    '&:hover': {
      backgroundColor: alpha(theme.palette.background.paper, 0.9),
      boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
    },
    '&.Mui-focused': {
      backgroundColor: theme.palette.background.paper,
      boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
    },
  },
}));

const UsersTable = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  
  // Edit dialog states
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({ username: '', email: '', password: '' });
  
  // Delete dialog states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingUser, setDeletingUser] = useState(null);
  
  // Snackbar states
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  
  const token = sessionStorage.getItem('jwt');
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.down('lg'));

  // Function to escape special characters
  const escapeRegExp = (string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  };

  // Function to highlight search text
  const highlightText = (text, query) => {
    if (!query) return text;
    const regex = new RegExp(`(${escapeRegExp(query)})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, index) =>
      regex.test(part) ? (
        <span key={index} style={{ 
          backgroundColor: theme.palette.warning.light,
          color: theme.palette.warning.contrastText,
          padding: '2px 4px',
          borderRadius: '4px',
          fontWeight: 'bold'
        }}>
          {part}
        </span>
      ) : (
        part
      )
    );
  };

  // Check if current user is admin
  const checkAdminStatus = async () => {
    try {
      const { data } = await axios.get('https://fin-tracker-ncbx.onrender.com/api/home', {
        headers: { Auth: `Bearer ${token}` },
      });
      setCurrentUser(data);
      setIsAdmin(data.roul === 'admin');
    } catch (err) {
      console.error('Error checking admin status:', err);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data } = await axios.get('https://fin-tracker-ncbx.onrender.com/api/alluser', {
        headers: { Auth: `Bearer ${token}` },
      });
      setUsers(data.users);
    } catch (err) {
      setError(err);
      setSnackbar({
        open: true,
        message: 'Error fetching users data',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAdminStatus();
    fetchUsers();
  }, [token]);

  // Handle edit user
  const handleEditClick = (user) => {
    setEditingUser(user);
    setEditForm({
      username: user.username,
      email: user.email,
      password: ''
    });
    setEditDialogOpen(true);
  };

  const handleEditSubmit = async () => {
    try {
      const updateData = {
        username: editForm.username,
        email: editForm.email
      };
      
      if (editForm.password.trim()) {
        updateData.password = editForm.password;
      }

      await axios.put(
        `https://fin-tracker-ncbx.onrender.com/api/admin/users/${editingUser._id}`,
        updateData,
        {
          headers: { Auth: `Bearer ${token}` },
        }
      );

      setSnackbar({
        open: true,
        message: 'User updated successfully',
        severity: 'success'
      });

      setEditDialogOpen(false);
      fetchUsers();
    } catch (err) {
      setSnackbar({
        open: true,
        message: err.response?.data?.message || 'Error updating user',
        severity: 'error'
      });
    }
  };

  // Handle delete user
  const handleDeleteClick = (user) => {
    setDeletingUser(user);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await axios.delete(
        `https://fin-tracker-ncbx.onrender.com/api/admin/users/${deletingUser._id}`,
        {
          headers: { Auth: `Bearer ${token}` },
        }
      );

      setSnackbar({
        open: true,
        message: 'User deleted successfully',
        severity: 'success'
      });

      setDeleteDialogOpen(false);
      fetchUsers();
    } catch (err) {
      setSnackbar({
        open: true,
        message: err.response?.data?.message || 'Error deleting user',
        severity: 'error'
      });
    }
  };

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column',
          justifyContent: 'center', 
          alignItems: 'center',
          minHeight: '60vh',
          gap: 2
        }}>
          <CircularProgress size={60} thickness={4} />
          <Typography variant="h6" color="text.secondary">
            Loading users data...
          </Typography>
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ borderRadius: 2 }}>
          <Typography variant="h6">
            Error loading data!
          </Typography>
          <Typography variant="body2">
            Please check your connection and try again.
          </Typography>
        </Alert>
      </Container>
    );
  }

  const filteredUsers = users.filter((user) =>
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Mobile Card View Component
  const MobileUserCard = ({ user, index }) => (
    <Fade in timeout={300 + index * 100}>
      <Card sx={{ 
        mb: 2, 
        borderRadius: 3,
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
        }
      }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Avatar sx={{ 
              bgcolor: user.roul === 'admin' ? 'error.main' : 'primary.main',
              mr: 2,
              width: 48,
              height: 48
            }}>
              {user.roul === 'admin' ? <AdminIcon /> : <PersonIcon />}
            </Avatar>
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {highlightText(user.username, searchQuery)}
              </Typography>
              <Chip 
                label={user.roul} 
                size="small" 
                color={user.roul === 'admin' ? 'error' : 'primary'}
                sx={{ textTransform: 'capitalize' }}
              />
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
              #{index + 1}
            </Typography>
          </Box>
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {highlightText(user.email, searchQuery)}
          </Typography>
          
          {isAdmin && (
            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
              <ActionButton
                variant="edit"
                size="small"
                onClick={() => handleEditClick(user)}
              >
                <EditIcon fontSize="small" />
              </ActionButton>
              <ActionButton
                variant="delete"
                size="small"
                onClick={() => handleDeleteClick(user)}
                disabled={currentUser && currentUser.user === user.username}
              >
                <DeleteIcon fontSize="small" />
              </ActionButton>
            </Box>
          )}
        </CardContent>
      </Card>
    </Fade>
  );

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header Section */}
      <StyledCard sx={{ mb: 4 }}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'column', md: 'row' },
            justifyContent: 'space-between',
            alignItems: { xs: 'flex-start', md: 'center' },
            gap: 3
          }}>
            <Box>
              <Typography variant="h4" sx={{ 
                fontWeight: 700,
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 1
              }}>
                User Management System
              </Typography>
              {isAdmin && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AdminIcon color="error" />
                  <Typography variant="subtitle1" color="error.main" sx={{ fontWeight: 600 }}>
                    Administrator Panel
                  </Typography>
                </Box>
              )}
            </Box>
            
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <Badge badgeContent={filteredUsers.length} color="primary" max={999}>
                <Chip
                  icon={<PersonIcon />}
                  label="Total Users"
                  variant="outlined"
                  size="large"
                  sx={{ 
                    fontSize: '1rem',
                    fontWeight: 600,
                    px: 2,
                    py: 1
                  }}
                />
              </Badge>
            </Box>
          </Box>
        </CardContent>
      </StyledCard>

      {/* Search Section */}
      <Box sx={{ mb: 4 }}>
        <SearchField
          placeholder="Search by username or email..."
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
          sx={{ maxWidth: { xs: '100%', md: '600px' }, mx: 'auto', display: 'block' }}
        />
      </Box>

      {/* Content Section */}
      {isMobile ? (
        // Mobile View - Cards
        <Box>
          {filteredUsers.length > 0 ? (
            filteredUsers.map((user, index) => (
              <MobileUserCard key={user._id} user={user} index={index} />
            ))
          ) : (
            <Card sx={{ textAlign: 'center', py: 6 }}>
              <CardContent>
                <PersonIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary">
                  No users found
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Try adjusting your search criteria
                </Typography>
              </CardContent>
            </Card>
          )}
        </Box>
      ) : (
        // Desktop/Tablet View - Table
        <StyledCard>
          <TableContainer sx={{ 
            maxHeight: '70vh',
            '&::-webkit-scrollbar': {
              width: '8px',
              height: '8px',
            },
            '&::-webkit-scrollbar-track': {
              background: alpha(theme.palette.grey[300], 0.3),
              borderRadius: '4px',
            },
            '&::-webkit-scrollbar-thumb': {
              background: alpha(theme.palette.primary.main, 0.5),
              borderRadius: '4px',
              '&:hover': {
                background: alpha(theme.palette.primary.main, 0.7),
              },
            },
          }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <StyledTableCell sx={{ minWidth: 80 }}>#</StyledTableCell>
                  <StyledTableCell sx={{ minWidth: 100 }}>Role</StyledTableCell>
                  <StyledTableCell sx={{ minWidth: 150 }}>Username</StyledTableCell>
                  <StyledTableCell sx={{ minWidth: 200 }}>Email</StyledTableCell>
                  {isAdmin && (
                    <StyledTableCell sx={{ minWidth: 120 }}>Actions</StyledTableCell>
                  )}
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user, index) => (
                    <StyledTableRow key={user._id}>
                      <TableCell sx={{ textAlign: 'center', fontWeight: 600 }}>
                        {index + 1}
                      </TableCell>
                      <TableCell sx={{ textAlign: 'center' }}>
                        <Chip
                          icon={user.roul === 'admin' ? <AdminIcon /> : <PersonIcon />}
                          label={user.roul}
                          size="small"
                          color={user.roul === 'admin' ? 'error' : 'primary'}
                          sx={{ textTransform: 'capitalize', fontWeight: 600 }}
                        />
                      </TableCell>
                      <TableCell sx={{ textAlign: 'center', fontWeight: 500 }}>
                        {highlightText(user.username, searchQuery)}
                      </TableCell>
                      <TableCell sx={{ textAlign: 'center' }}>
                        {highlightText(user.email, searchQuery)}
                      </TableCell>
                      {isAdmin && (
                        <TableCell sx={{ textAlign: 'center' }}>
                          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                            <Tooltip title="Edit User" arrow>
                              <ActionButton
                                variant="edit"
                                size="small"
                                onClick={() => handleEditClick(user)}
                              >
                                <EditIcon fontSize="small" />
                              </ActionButton>
                            </Tooltip>
                            <Tooltip title="Delete User" arrow>
                              <ActionButton
                                variant="delete"
                                size="small"
                                onClick={() => handleDeleteClick(user)}
                                disabled={currentUser && currentUser.user === user.username}
                              >
                                <DeleteIcon fontSize="small" />
                              </ActionButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      )}
                    </StyledTableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell 
                      colSpan={isAdmin ? 5 : 4} 
                      sx={{ 
                        textAlign: 'center', 
                        py: 6,
                        color: 'text.secondary'
                      }}
                    >
                      <PersonIcon sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
                      <Typography variant="h6">
                        No users found
                      </Typography>
                      <Typography variant="body2">
                        Try adjusting your search criteria
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </StyledCard>
      )}

      {/* Edit User Dialog */}
      <Dialog 
        open={editDialogOpen} 
        onClose={() => setEditDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        TransitionComponent={Slide}
        TransitionProps={{ direction: "up" }}
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: '0 24px 48px rgba(0,0,0,0.2)',
          }
        }}
      >
        <DialogTitle sx={{ 
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          gap: 2
        }}>
          <EditIcon />
          Edit User: {editingUser?.username}
          <IconButton
            onClick={() => setEditDialogOpen(false)}
            sx={{ ml: 'auto', color: 'white' }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 3, pb: 2 }}>
          <TextField
            autoFocus
            margin="dense"
            label="Username"
            fullWidth
            variant="outlined"
            value={editForm.username}
            onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
            sx={{ mb: 3 }}
          />
          <TextField
            margin="dense"
            label="Email"
            type="email"
            fullWidth
            variant="outlined"
            value={editForm.email}
            onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
            sx={{ mb: 3 }}
          />
          <TextField
            margin="dense"
            label="New Password (optional)"
            type="password"
            fullWidth
            variant="outlined"
            value={editForm.password}
            onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
            helperText="Leave empty to keep current password"
          />
        </DialogContent>
        <DialogActions sx={{ p: 3, gap: 1 }}>
          <Button 
            onClick={() => setEditDialogOpen(false)} 
            startIcon={<CancelIcon />}
            variant="outlined"
            color="inherit"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleEditSubmit} 
            variant="contained" 
            startIcon={<SaveIcon />}
            disabled={!editForm.username || !editForm.email}
            sx={{ minWidth: 120 }}
          >
            Update User
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: '0 24px 48px rgba(0,0,0,0.2)',
          }
        }}
      >
        <DialogTitle sx={{ 
          color: theme.palette.error.main,
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}>
          <DeleteIcon />
          Confirm Delete
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ fontSize: '1rem' }}>
            Are you sure you want to delete user <strong>"{deletingUser?.username}"</strong>? 
            <br />
            This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 3, gap: 1 }}>
          <Button 
            onClick={() => setDeleteDialogOpen(false)} 
            variant="outlined"
            color="inherit"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleDeleteConfirm} 
            color="error" 
            variant="contained"
            startIcon={<DeleteIcon />}
          >
            Delete User
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          variant="filled"
          sx={{ 
            width: '100%',
            borderRadius: 2,
            fontWeight: 600
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default UsersTable;

