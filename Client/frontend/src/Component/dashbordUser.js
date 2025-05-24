import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  ButtonGroup,
  TextField,
  Box,
  Typography,
  Tooltip,
  CircularProgress,
  InputAdornment,
  IconButton,
  useMediaQuery,
  Container,
  Fab,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid, // Import Grid for layout
  Alert, // Import Alert for error messages
} from '@mui/material';
import Autocomplete from '@mui/material/Autocomplete';
import { styled, keyframes, alpha } from '@mui/system';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import RemoveCircleIcon from '@mui/icons-material/RemoveCircle';
import CloudUploadIcon from '@mui/icons-material/CloudUpload'; // Icon for upload button

// --- ORIGINAL THEME COLORS (Reverted) ---
const originalThemeColors = {
  backgroundGradientStart: '#F0F8FF',
  backgroundGradientEnd: '#E6F2FF',
  primaryAccent: '#4A90E2', // Original Blue
  textPrimary: '#333333', // Darker text for light background
  textSecondary: '#666666', // Original secondary text
  expense: '#FF5252', // Original Red for expenses
  income: '#4CAF50', // Original Green for income
  surface: '#FFFFFF', // White for cards, dialogs
  dialogSurface: '#FAFAFA', // Light gray for dialog content areas
  inputBackground: '#FFFFFF',
  borderColor: '#DDDDDD', // Lighter border for light theme
  white: '#FFFFFF',
  buttonTextLight: '#FFFFFF', // For contained buttons
  buttonTextDark: '#4A90E2', // For outlined buttons
};

// Smooth animation for cards (remains the same)
const floatAnimation = keyframes`
  0% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
  100% { transform: translateY(0); }
`;

// Fade-in animation for cards (remains the same)
const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

// Modern design for category card with dynamic border color based on type
const CategoryCard = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'type' && prop !== 'isUserCard', // Add isUserCard
})(({ theme, type, isUserCard }) => ({
  border: `2px solid ${type && type.toLowerCase().startsWith('expens') ? originalThemeColors.expense : originalThemeColors.income}`,
  backgroundColor: originalThemeColors.surface,
  borderRadius: '20px',
  padding: theme.spacing(3),
  width: '190px', // Card width remains 190px, ensure 5 fit with gaps
  height: '190px',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  textAlign: 'center',
  boxShadow: `0 8px 24px ${alpha(originalThemeColors.primaryAccent, 0.15)}`,
  cursor: 'pointer',
  transition: 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.4s ease, border-color 0.3s ease',
  animation: `${fadeIn} 0.6s ease-out forwards`,
  position: 'relative', // Needed for potential user card indicator
  '&:hover': {
    transform: 'scale(1.08)',
    boxShadow: `0 12px 32px ${alpha(originalThemeColors.primaryAccent, 0.25)}`,
    borderColor: originalThemeColors.primaryAccent,
  },
  // Optional: Add a small indicator for user-added cards
  ...(isUserCard && {
    '&::after': {
      content: '"👤"', // User icon or similar indicator
      position: 'absolute',
      top: '10px',
      right: '10px',
      fontSize: '1.2rem',
      background: alpha(originalThemeColors.primaryAccent, 0.7),
      color: 'white',
      borderRadius: '50%',
      padding: '2px 5px',
      lineHeight: 1,
    },
  }),
  [theme.breakpoints.down('sm')]: {
    width: '150px',
    height: '150px',
    padding: theme.spacing(2.5),
  },
  [theme.breakpoints.between('md', 'lg')]: {
    width: '170px',
    height: '170px',
  },
}));

// Styled Input for file upload
const VisuallyHiddenInput = styled('input')({
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: 1,
  overflow: 'hidden',
  position: 'absolute',
  bottom: 0,
  left: 0,
  whiteSpace: 'nowrap',
  width: 1,
});

const DashboardUser = () => {
  const [adminCategories, setAdminCategories] = useState([]);
  const [userCategories, setUserCategories] = useState([]); // State for user-specific cards
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false); // Dialog for adding budget item
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [value, setValue] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [visibleItems, setVisibleItems] = useState({});
  const [errorMessage, setErrorMessage] = useState(''); // Error for budget dialog
  const [scale, setScale] = useState(1); // Title scale effect
  const [searchQuery, setSearchQuery] = useState('');
  const [addedItems, setAddedItems] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false); // Submitting budget item
  const [filterType, setFilterType] = useState('all');

  // State for the NEW user card dialog
  const [newUserCardDialogOpen, setNewUserCardDialogOpen] = useState(false);
  const [newUserCardName, setNewUserCardName] = useState('');
  const [newUserCardType, setNewUserCardType] = useState(''); // 'income' or 'expense'
  const [newUserCardImage, setNewUserCardImage] = useState(null); // Will store Base64 string
  const [newUserCardImageFile, setNewUserCardImageFile] = useState(null); // Stores the File object
  const [newUserCardErrorMessage, setNewUserCardErrorMessage] = useState('');
  const [isNewUserCardSubmitting, setIsNewUserCardSubmitting] = useState(false);

  const isSmallDevice = useMediaQuery('(max-width:600px)');
  const isMediumDevice = useMediaQuery('(max-width:900px)');

  const getToken = useCallback(() => sessionStorage.getItem('jwt'), []);

  // Fetch Admin Categories
  const fetchAdminCategories = useCallback(async () => {
    try {
      const response = await axios.get('https://fin-tracker-ncbx.onrender.com/api/getcategories');
      setAdminCategories(response.data.data || []);
      // Initialize visible items based on admin categories initially
      const initialVisibleItems = (response.data.data || []).reduce((acc, category) => {
        if (!acc[category.categoryType]) {
          acc[category.categoryType] = 12;
        }
        return acc;
      }, {});
      setVisibleItems(initialVisibleItems);
    } catch (error) {
      console.error('Error fetching admin categories:', error);
      setAdminCategories([]); // Ensure it's an array on error
    }
  }, []);

  // Fetch User Categories
  const fetchUserCategories = useCallback(async () => {
    const token = getToken();
    if (!token) return; // No token, can't fetch user cards
    try {
      const response = await axios.get('https://fin-tracker-ncbx.onrender.com/api/getCardUser', {
        headers: { Auth: `Bearer ${token}` },
      });
      // The user cards are nested within the 'carduser' array in the response
      setUserCategories(response.data?.carduser || []);
    } catch (error) {
      console.error('Error fetching user categories:', error);
      setUserCategories([]); // Ensure it's an array on error
    }
  }, [getToken]);

  // Fetch all data on mount
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchAdminCategories(), fetchUserCategories()]);
      setLoading(false);
    };
    loadData();
  }, [fetchAdminCategories, fetchUserCategories]);

  // --- Budget Item Dialog Logic (Mostly unchanged) ---
  const handleClickOpen = (category) => {
    // Prevent opening if already added (assuming _id is unique across admin/user)
    if (addedItems.includes(category._id || category.categoryName)) return; // Use name as fallback ID for user cards if needed
    setSelectedCategory(category);
    setOpen(true);
    setErrorMessage('');
    setSelectedDate('');
    setValue('');
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedCategory(null);
    setValue('');
    setSelectedDate('');
    setErrorMessage('');
  };

  const handleSubmit = async () => {
    if (!selectedCategory || !value || !selectedDate) {
      setErrorMessage('Please enter a valid value and select a date.');
      return;
    }
    const parsedValue = parseFloat(value);
    if (isNaN(parsedValue) || parsedValue < 0) {
      setErrorMessage('Please enter a non-negative decimal number.');
      return;
    }

    const currentCategory = selectedCategory;
    handleClose();
    setIsSubmitting(true);
    const token = getToken();

    try {
      // Use admin category _id if available, otherwise maybe handle user cards differently if needed
      const categoryId = currentCategory._id; // Assuming admin cards have _id
      if (!categoryId) {
          console.warn("Cannot add budget for user-defined card without a unique ID yet.");
          // Potentially show an error message to the user
          setIsSubmitting(false);
          return; // Or adapt backend to handle adding budget by name/type for user cards
      }

      const response = await axios.post(
        'https://fin-tracker-ncbx.onrender.com/api/addBudget',
        {
          CategoriesId: categoryId,
          valueitem: parsedValue,
          date: selectedDate,
        },
        {
          headers: {
            Auth: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      console.log('Budget Response:', response.data);
      setAddedItems((prev) => [...prev, categoryId]);
    } catch (error) {
      if (error.response && error.response.status === 400) {
        console.error(error.response.data.error || 'You have already added this item on this date.');
        // Still mark as added even if backend fails with 400 (already added)
        if (currentCategory._id) setAddedItems((prev) => [...prev, currentCategory._id]);
      } else {
        console.error('Error submitting value:', error);
        // Maybe show a generic error message to the user
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- New User Card Dialog Logic ---
  const handleNewUserCardDialogOpen = () => {
    setNewUserCardDialogOpen(true);
    setNewUserCardErrorMessage('');
    setNewUserCardName('');
    setNewUserCardType('');
    setNewUserCardImage(null);
    setNewUserCardImageFile(null);
  };

  const handleNewUserCardDialogClose = () => {
    setNewUserCardDialogOpen(false);
  };

  // Convert image file to Base64
  const handleUserImageChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setNewUserCardImageFile(file); // Keep file object for preview or name display
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewUserCardImage(reader.result); // Store Base64 string
      };
      reader.onerror = (error) => {
        console.error('Error reading file:', error);
        setNewUserCardErrorMessage('Failed to read image file.');
        setNewUserCardImage(null);
        setNewUserCardImageFile(null);
      };
      reader.readAsDataURL(file);
    }
  };

  // Submit the new user card
  const handleNewUserCardSubmit = async () => {
    if (!newUserCardName || !newUserCardType || !newUserCardImage) {
      setNewUserCardErrorMessage('Please fill in name, type, and upload an image.');
      return;
    }

    setIsNewUserCardSubmitting(true);
    setNewUserCardErrorMessage('');
    const token = getToken();

    try {
      const response = await axios.post(
        'https://fin-tracker-ncbx.onrender.com/api/addCardUser', // Use the correct endpoint
        {
          categoryName: newUserCardName,
          categoryType: newUserCardType,
          categoryImage: newUserCardImage, // Send Base64 string
        },
        {
          headers: {
            Auth: `Bearer ${token}`,
            'Content-Type': 'application/json', // Important: Changed from multipart/form-data
          },
        }
      );
      console.log('New User Card Response:', response.data);
      // Add the new card to the userCategories state immediately
      // Assuming the backend returns the updated list or the new card object
      // For simplicity, refetching user cards after successful add
      await fetchUserCategories();
      handleNewUserCardDialogClose();
    } catch (error) {
      console.error('Error adding new user category:', error);
      setNewUserCardErrorMessage(error.response?.data?.error || 'An error occurred while adding the category.');
    } finally {
      setIsNewUserCardSubmitting(false);
    }
  };

  // --- Rendering Logic ---

  // Combine admin and user categories
  const allCategories = [
      ...adminCategories.map(cat => ({ ...cat, isUserCard: false })), // Mark admin cards
      ...userCategories.map(cat => ({ ...cat, isUserCard: true })) // Mark user cards
  ];

  // Filter combined categories
  let filteredCategories = allCategories.filter((category) =>
    category.categoryName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (filterType === 'income') {
    filteredCategories = filteredCategories.filter(
      (category) => !category.categoryType.toLowerCase().startsWith('expens')
    );
  } else if (filterType === 'expenses') {
    filteredCategories = filteredCategories.filter((category) =>
      category.categoryType.toLowerCase().startsWith('expens')
    );
  }

  // Group combined categories
  const groupedCategories = filteredCategories.reduce((acc, category) => {
    const typeKey = category.categoryType; // Use the exact type for grouping
    if (!acc[typeKey]) {
      acc[typeKey] = [];
    }
    acc[typeKey].push(category);
    return acc;
  }, {});

  // Load more logic (might need adjustment if grouping changes significantly)
  const handleLoadMore = (type) => {
    setVisibleItems((prev) => ({
      ...prev,
      [type]: (prev[type] || 0) + 10,
    }));
  };

  // Autocomplete options based on combined list
  const categoryOptions = allCategories.map((cat) => cat.categoryName);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: `linear-gradient(135deg, ${originalThemeColors.backgroundGradientStart} 0%, ${originalThemeColors.backgroundGradientEnd} 100%)` }}>
        <CircularProgress sx={{ color: originalThemeColors.primaryAccent }} size={60} />
        <Typography variant="h6" sx={{ color: originalThemeColors.textPrimary, ml: 2 }}>
          Loading Dashboard...
        </Typography>
      </Box>
    );
  }

  return (
    <Container
      maxWidth="lg"
      sx={{
        py: { xs: 3, sm: 5 },
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${originalThemeColors.backgroundGradientStart} 0%, ${originalThemeColors.backgroundGradientEnd} 100%)`,
        fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"',
        position: 'relative',
        color: originalThemeColors.textPrimary,
      }}
    >
      {/* Header */}  
      <Box sx={{ textAlign: 'center', mb: { xs: 4, sm: 6 } }}>
        <Typography
          variant="h2"
          sx={{
            fontWeight: 'bold',
            textTransform: 'uppercase',
            color: originalThemeColors.primaryAccent,
            textShadow: `2px 2px 4px ${alpha(originalThemeColors.primaryAccent, 0.2)}`,
            letterSpacing: '0.07em',
            transition: 'transform 0.4s ease-in-out, text-shadow 0.4s ease',
            transform: `scale(${scale})`,
            cursor: 'pointer',
            fontSize: { xs: '2.2rem', sm: '3rem', md: '3.5rem' },
            mb: 1,
          }}
          onMouseEnter={() => setScale(1.05)}
          onMouseLeave={() => setScale(1)}
        >
          Finance Tracker
        </Typography>
        <Typography variant="h6" sx={{ color: originalThemeColors.textSecondary, fontWeight: 300, letterSpacing: '0.05em' }}>
          Manage your finances with ease
        </Typography>
      </Box>

      {/* Search and Filter Controls */}
      <Grid container spacing={2} sx={{ mb: { xs: 3, sm: 5 } }} alignItems="center">
        <Grid item xs={12} md={8}>
          <Autocomplete
            freeSolo
            options={categoryOptions}
            onInputChange={(event, newInputValue) => setSearchQuery(newInputValue)}
            inputValue={searchQuery} // Control the input value
            renderInput={(params) => (
              <TextField
                {...params}
                placeholder="Search categories..."
                variant="outlined"
                fullWidth
                sx={{
                  backgroundColor: originalThemeColors.inputBackground,
                  borderRadius: '30px',
                  boxShadow: `0 4px 15px ${alpha(originalThemeColors.primaryAccent, 0.1)}`,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '30px',
                    color: originalThemeColors.textPrimary,
                    '& fieldset': { borderColor: alpha(originalThemeColors.primaryAccent, 0.5), borderWidth: '1px' },
                    '&:hover fieldset': { borderColor: originalThemeColors.primaryAccent },
                    '&.Mui-focused fieldset': { borderColor: originalThemeColors.primaryAccent, boxShadow: `0 0 0 3px ${alpha(originalThemeColors.primaryAccent, 0.3)}` },
                  },
                  '& .MuiInputBase-input': {
                    color: originalThemeColors.textPrimary,
                    '&::placeholder': { color: originalThemeColors.textSecondary, opacity: 1 },
                  },
                }}
                InputProps={{
                  ...params.InputProps,
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: originalThemeColors.textSecondary }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <>
                      {params.InputProps.endAdornment}
                      {searchQuery && (
                        <InputAdornment position="end">
                          <IconButton onClick={() => setSearchQuery('')} edge="end" sx={{ color: originalThemeColors.textSecondary, '&:hover': { color: originalThemeColors.primaryAccent } }}>
                            <ClearIcon />
                          </IconButton>
                        </InputAdornment>
                      )}
                    </>
                  ),
                }}
              />
            )}
          />
        </Grid>
        <Grid item xs={12} md={4} sx={{ display: 'flex', justifyContent: { xs: 'center', md: 'flex-end' } }}>
          <ButtonGroup variant="outlined" size="large" sx={{ borderRadius: '20px', overflow: 'hidden', boxShadow: `0 2px 8px ${alpha(originalThemeColors.primaryAccent, 0.15)}` }}>
            {[
              { label: 'All', value: 'all', icon: <AccountBalanceWalletIcon /> },
              { label: 'Revenues', value: 'income', icon: <AddCircleIcon /> },
              { label: 'Expenses', value: 'expenses', icon: <RemoveCircleIcon /> },
            ].map((typeOption) => (
              <Button
                key={typeOption.value}
                onClick={() => setFilterType(typeOption.value)}
                variant={filterType === typeOption.value ? 'contained' : 'outlined'}
                startIcon={typeOption.icon}
                sx={{
                  textTransform: 'none',
                  fontWeight: filterType === typeOption.value ? 'bold' : 'normal',
                  borderColor: originalThemeColors.primaryAccent,
                  color: filterType === typeOption.value ? originalThemeColors.buttonTextLight : originalThemeColors.buttonTextDark,
                  backgroundColor: filterType === typeOption.value ? originalThemeColors.primaryAccent : 'transparent',
                  '&:hover': {
                    backgroundColor: filterType === typeOption.value ? alpha(originalThemeColors.primaryAccent, 0.85) : alpha(originalThemeColors.primaryAccent, 0.08),
                    borderColor: originalThemeColors.primaryAccent,
                  },
                  px: { xs: 1.5, sm: 2 }, // Adjusted padding
                  py: 1.2, // Adjusted padding
                  fontSize: { xs: '0.8rem', sm: '0.9rem' }, // Adjusted font size
                }}
              >
                {typeOption.label}
              </Button>
            ))}
          </ButtonGroup>
        </Grid>
      </Grid>

      {/* Category Sections */}  
      {Object.keys(groupedCategories).length > 0 ? (
        Object.entries(groupedCategories).map(([type, items]) => (
          <Box key={type} sx={{ mb: 5 }}>
            <Typography variant="h4" sx={{ fontWeight: '600', color: originalThemeColors.primaryAccent, mb: 3, borderBottom: `2px solid ${alpha(originalThemeColors.primaryAccent, 0.3)}`, pb: 1 }}>
              {type.charAt(0).toUpperCase() + type.slice(1)} {/* Capitalize type */}  
            </Typography>
            <Grid container spacing={3}>
              {items.slice(0, visibleItems[type] || 12).map((category, index) => (
                <Grid item key={category._id || `user-${category.categoryName}-${index}`} xs={6} sm={4} md={3} lg={2.4}> {/* Adjust grid size for 5 cards per row on large screens */}  
                  <Tooltip title={addedItems.includes(category._id || category.categoryName) ? 'Budget item added for today' : `Add budget for ${category.categoryName}`}>
                    {/* Wrap Card in Box to prevent Tooltip interfering with Card's hover */}  
                    <Box>
                      <CategoryCard
                        type={category.categoryType}
                        isUserCard={category.isUserCard} // Pass user card flag
                        onClick={() => handleClickOpen(category)}
                        sx={{ opacity: addedItems.includes(category._id || category.categoryName) ? 0.6 : 1 }} // Dim added items
                      >
                        <Box
                          component="img"
                          src={category.categoryImage} // Directly use Base64 string or URL
                          alt={category.categoryName}
                          sx={{
                            width: '60px',
                            height: '60px',
                            mb: 1.5,
                            objectFit: 'contain', // Use contain to prevent distortion
                            borderRadius: '12px', // Slightly rounded corners for image
                          }}
                        />
                        <Typography variant="subtitle1" sx={{ fontWeight: 'medium', color: originalThemeColors.textPrimary }}>
                          {category.categoryName}
                        </Typography>
                      </CategoryCard>
                    </Box>
                  </Tooltip>
                </Grid>
              ))}
            </Grid>
            {items.length > (visibleItems[type] || 12) && (
              <Box sx={{ textAlign: 'center', mt: 4 }}>
                <Button variant="outlined" onClick={() => handleLoadMore(type)} sx={{ color: originalThemeColors.primaryAccent, borderColor: originalThemeColors.primaryAccent }}>
                  Load More {type}
                </Button>
              </Box>
            )}
          </Box>
        ))
      ) : (
        <Typography sx={{ textAlign: 'center', color: originalThemeColors.textSecondary, mt: 5 }}>
          No categories found matching your criteria.
        </Typography>
      )}

      {/* Floating Action Button to Add User Card */}  
      <Fab
        color="primary"
        aria-label="add user category"
        onClick={handleNewUserCardDialogOpen}
        sx={{
          position: 'fixed',
          bottom: { xs: 20, sm: 40 },
          right: { xs: 20, sm: 40 },
          backgroundColor: originalThemeColors.primaryAccent,
          '&:hover': {
            backgroundColor: alpha(originalThemeColors.primaryAccent, 0.85),
          },
        }}
      >
        <AddIcon />
      </Fab>

      {/* Dialog for Adding Budget Item (Existing) */}  
      <Dialog open={open} onClose={handleClose} PaperProps={{ sx: { borderRadius: '15px', bgcolor: originalThemeColors.dialogSurface } }}>
        <DialogTitle sx={{ bgcolor: originalThemeColors.primaryAccent, color: originalThemeColors.white, borderTopLeftRadius: '15px', borderTopRightRadius: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Add Budget for {selectedCategory?.categoryName}
          <IconButton onClick={handleClose} sx={{ color: originalThemeColors.white }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 3, pb: 2, bgcolor: originalThemeColors.dialogSurface }}>
          {errorMessage && <Alert severity="error" sx={{ mb: 2 }}>{errorMessage}</Alert>}
          <TextField
            autoFocus
            margin="dense"
            id="value"
            label="Value"
            type="number"
            fullWidth
            variant="outlined"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            InputProps={{
              startAdornment: <InputAdornment position="start">$</InputAdornment>,
            }}
            sx={{ mb: 2, backgroundColor: originalThemeColors.inputBackground }}
          />
          <TextField
            margin="dense"
            id="date"
            label="Date"
            type="date"
            fullWidth
            variant="outlined"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            InputLabelProps={{
              shrink: true,
            }}
            sx={{ backgroundColor: originalThemeColors.inputBackground }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2, bgcolor: originalThemeColors.dialogSurface, borderBottomLeftRadius: '15px', borderBottomRightRadius: '15px' }}>
          <Button onClick={handleClose} sx={{ color: originalThemeColors.textSecondary }}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={isSubmitting}
            sx={{ backgroundColor: originalThemeColors.primaryAccent, '&:hover': { backgroundColor: alpha(originalThemeColors.primaryAccent, 0.85) } }}
          >
            {isSubmitting ? <CircularProgress size={24} sx={{ color: 'white' }} /> : 'Submit'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog for Adding New User Card */}  
      <Dialog open={newUserCardDialogOpen} onClose={handleNewUserCardDialogClose} PaperProps={{ sx: { borderRadius: '15px', bgcolor: originalThemeColors.dialogSurface } }}>
        <DialogTitle sx={{ bgcolor: originalThemeColors.primaryAccent, color: originalThemeColors.white, borderTopLeftRadius: '15px', borderTopRightRadius: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Add Your Own Category
          <IconButton onClick={handleNewUserCardDialogClose} sx={{ color: originalThemeColors.white }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 3, pb: 2, bgcolor: originalThemeColors.dialogSurface }}>
          {newUserCardErrorMessage && <Alert severity="error" sx={{ mb: 2 }}>{newUserCardErrorMessage}</Alert>}
          <TextField
            autoFocus
            margin="dense"
            id="newCategoryName"
            label="Category Name"
            type="text"
            fullWidth
            variant="outlined"
            value={newUserCardName}
            onChange={(e) => setNewUserCardName(e.target.value)}
            sx={{ mb: 2, backgroundColor: originalThemeColors.inputBackground }}
          />
          <FormControl fullWidth margin="dense" variant="outlined" sx={{ mb: 2, backgroundColor: originalThemeColors.inputBackground }}>
            <InputLabel id="newCategoryType-label">Category Type</InputLabel>
            <Select
              labelId="newCategoryType-label"
              id="newCategoryType"
              value={newUserCardType}
              onChange={(e) => setNewUserCardType(e.target.value)}
              label="Category Type"
            >
              <MenuItem value=""><em>Select Type</em></MenuItem>
              <MenuItem value="income">Income</MenuItem>
              <MenuItem value="expenses">Expenses</MenuItem>
              {/* Add other types if necessary */}  
            </Select>
          </FormControl>
          <Button
            component="label"
            role={undefined}
            variant="contained"
            tabIndex={-1}
            startIcon={<CloudUploadIcon />}
            fullWidth
            sx={{ mb: 1, backgroundColor: alpha(originalThemeColors.primaryAccent, 0.8), '&:hover': { backgroundColor: originalThemeColors.primaryAccent } }}
          >
            Upload Image
            <VisuallyHiddenInput type="file" accept="image/*" onChange={handleUserImageChange} />
          </Button>
          {newUserCardImageFile && (
            <Typography variant="body2" sx={{ color: originalThemeColors.textSecondary, mb: 2, textAlign: 'center' }}>
              Selected: {newUserCardImageFile.name}
            </Typography>
          )}
          {newUserCardImage && (
             <Box sx={{ textAlign: 'center', mb: 2 }}>
               <img src={newUserCardImage} alt="Preview" style={{ maxHeight: '100px', maxWidth: '100%', borderRadius: '8px' }} />
             </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, bgcolor: originalThemeColors.dialogSurface, borderBottomLeftRadius: '15px', borderBottomRightRadius: '15px' }}>
          <Button onClick={handleNewUserCardDialogClose} sx={{ color: originalThemeColors.textSecondary }}>Cancel</Button>
          <Button
            onClick={handleNewUserCardSubmit}
            variant="contained"
            disabled={isNewUserCardSubmitting}
            sx={{ backgroundColor: originalThemeColors.primaryAccent, '&:hover': { backgroundColor: alpha(originalThemeColors.primaryAccent, 0.85) } }}
          >
            {isNewUserCardSubmitting ? <CircularProgress size={24} sx={{ color: 'white' }} /> : 'Add Category'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default DashboardUser;

