import React, { useState, useEffect } from 'react';
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
} from '@mui/material';
import Autocomplete from '@mui/material/Autocomplete';
import { styled, keyframes, alpha } from '@mui/system'; // Added alpha for transparency
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import RemoveCircleIcon from '@mui/icons-material/RemoveCircle';

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
  shouldForwardProp: (prop) => prop !== 'type',
})(({ theme, type }) => ({
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
  '&:hover': {
    transform: 'scale(1.08)',
    boxShadow: `0 12px 32px ${alpha(originalThemeColors.primaryAccent, 0.25)}`,
    borderColor: originalThemeColors.primaryAccent,
  },
  [theme.breakpoints.down('sm')]: {
    width: '150px',
    height: '150px',
    padding: theme.spacing(2.5),
  },
  // Adjust card width slightly if needed to fit 5 in a row more comfortably on medium screens
  [theme.breakpoints.between('md', 'lg')]: {
    width: '170px', // Example: slightly smaller for 5 cards on medium screens
    height: '170px',
  },
}));

const DashboardUser = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false); // Dialog for adding budget item
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [value, setValue] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [visibleItems, setVisibleItems] = useState({});
  const [errorMessage, setErrorMessage] = useState(''); // Error for budget item dialog
  const [scale, setScale] = useState(1); // Title scale effect
  const [searchQuery, setSearchQuery] = useState('');
  const [addedItems, setAddedItems] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false); // Submitting budget item
  const [filterType, setFilterType] = useState('all');

  // --- State for Add User Card Dialog (Renamed from New Category) ---
  const [userCardDialogOpen, setUserCardDialogOpen] = useState(false);
  const [userCardName, setUserCardName] = useState('');
  const [userCardType, setUserCardType] = useState('');
  const [userCardImageFile, setUserCardImageFile] = useState(null); // Store the file object
  const [userCardImagePreview, setUserCardImagePreview] = useState(null); // Store the preview URL
  const [userCardErrorMessage, setUserCardErrorMessage] = useState('');
  const [isUserCardSubmitting, setIsUserCardSubmitting] = useState(false);
  // --- End State for Add User Card Dialog ---

  const isSmallDevice = useMediaQuery('(max-width:600px)'); // Adjusted breakpoint for small device grid
  const isMediumDevice = useMediaQuery('(max-width:900px)'); // Breakpoint for potentially 3-4 cards

  // --- Fetch Admin Categories (Remains the same) ---
  useEffect(() => {
    const fetchAdminCategories = async () => {
      setLoading(true);
      try {
        // Assuming this endpoint fetches categories added by admin
        const response = await axios.get('https://fin-tracker-ncbx.onrender.com/api/getcategories');
        // TODO: Consider fetching user-specific cards here as well via /api/getCardUser
        // and merging/displaying them appropriately.
        // For now, just displaying admin categories.
        setCategories(response.data.data || []); // Ensure it's an array
        const initialVisibleItems = (response.data.data || []).reduce((acc, category) => {
          if (!acc[category.categoryType]) {
            acc[category.categoryType] = 12; // Or 10 if we want to show 2 full rows of 5
          }
          return acc;
        }, {});
        setVisibleItems(initialVisibleItems);
      } catch (error) {
        console.error('Error fetching admin categories:', error);
        setCategories([]); // Set to empty array on error
      } finally {
        setLoading(false);
      }
    };

    fetchAdminCategories();
  }, []);
  // --- End Fetch Admin Categories ---

  // --- Handlers for Budget Item Dialog (Remain the same) ---
  const handleClickOpen = (category) => {
    if (addedItems.includes(category._id)) return;
    setSelectedCategory(category);
    setOpen(true);
    setErrorMessage('');
    setSelectedDate('');
    setValue(''); // Reset value on open
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
    handleClose(); // Close dialog immediately

    setIsSubmitting(true);
    const token = sessionStorage.getItem('jwt');

    try {
      const response = await axios.post(
        'https://fin-tracker-ncbx.onrender.com/api/addBudget',
        {
          CategoriesId: currentCategory._id,
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

      console.log('Budget Item Response:', response.data);
      setAddedItems((prev) => [...prev, currentCategory._id]); // Mark as added
      // Optionally show a success message
    } catch (error) {
      // Handle specific error for already added item
      if (error.response && error.response.status === 400 && error.response.data?.error?.includes('already added')) {
         console.error(error.response.data.error || 'You have already added this item on this date.');
         setAddedItems((prev) => [...prev, currentCategory._id]); // Still mark as added if server says so
         // Optionally show a specific message to the user
      } else {
        console.error('Error submitting budget item:', error);
        // Optionally show a generic error message to the user
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  // --- End Handlers for Budget Item Dialog ---

  // --- Handlers for Add User Card Dialog (Modified/New) ---
  const handleUserCardDialogOpen = () => {
    setUserCardDialogOpen(true);
    setUserCardErrorMessage(''); // Clear previous errors
  };

  const handleUserCardDialogClose = () => {
    setUserCardDialogOpen(false);
    setUserCardName('');
    setUserCardType('');
    setUserCardImageFile(null);
    setUserCardImagePreview(null);
    setUserCardErrorMessage('');
  };

  const handleUserCardImageChange = (event) => {
    const file = event.target.files && event.target.files[0];
    if (file) {
      setUserCardImageFile(file);
      // Create a preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setUserCardImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Helper function to convert file to Base64
  const toBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });

  const handleUserCardSubmit = async () => {
    // Validation
    if (!userCardName || !userCardType || !userCardImageFile) {
      setUserCardErrorMessage('Please fill in name, type, and select an image.');
      return;
    }

    setIsUserCardSubmitting(true);
    setUserCardErrorMessage(''); // Clear previous errors
    const token = sessionStorage.getItem('jwt');

    try {
      // Convert image to Base64
      const imageBase64 = await toBase64(userCardImageFile);

      // Prepare JSON payload
      const payload = {
        categoryName: userCardName,
        categoryType: userCardType,
        categoryImage: imageBase64, // Send Base64 string
      };

      // Make API call to the correct endpoint for adding user cards
      const response = await axios.post(
        'https://fin-tracker-ncbx.onrender.com/api/addCardUser', // Use the user card endpoint
        payload,
        {
          headers: {
            Auth: `Bearer ${token}`,
            'Content-Type': 'application/json', // Send as JSON
          },
        }
      );

      console.log('Add User Card Response:', response.data);
      // TODO: Decide how to update the UI. Options:
      // 1. Re-fetch all categories/cards.
      // 2. Add the response.data.addedCard to the local state (if structure matches).
      // 3. Simply close the dialog (current implementation).
      handleUserCardDialogClose();
      // Optionally show a success message

    } catch (error) {
      console.error('Error adding user card:', error);
      // Handle specific error for duplicate category name for this user
      if (error.response && error.response.status === 400 && error.response.data?.error?.includes('موجودة بالفعل')) {
          setUserCardErrorMessage('هذه الفئة موجودة بالفعل لهذا المستخدم.');
      } else if (error.response && error.response.data?.error) {
          setUserCardErrorMessage(`Error: ${error.response.data.error}`);
      } else {
          setUserCardErrorMessage('An error occurred while adding the card. Please try again.');
      }
    } finally {
      setIsUserCardSubmitting(false);
    }
  };
  // --- End Handlers for Add User Card Dialog ---


  const handleLoadMore = (type) => {
    setVisibleItems((prev) => ({
      ...prev,
      [type]: (prev[type] || 0) + 10, // Load 10 more (2 rows of 5)
    }));
  };

  // Assuming categoryOptions are only for admin categories for now
  const categoryOptions = categories.map((cat) => cat.categoryName);

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

  // Filtering logic remains the same (operates on fetched 'categories' state)
  let filteredCategories = categories.filter((category) =>
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

  const groupedCategories = filteredCategories.reduce((acc, category) => {
    const typeKey = category.categoryType || 'Uncategorized'; // Handle potential missing type
    if (!acc[typeKey]) {
      acc[typeKey] = [];
    }
    acc[typeKey].push(category);
    return acc;
  }, {});

  const getCategoryIcon = (type) =>
    type && type.toLowerCase().startsWith('expens') ? '💸' : '💰';

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
      {/* Header and Search (Remain the same) */}
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

      <Autocomplete
        freeSolo
        options={categoryOptions} // Still using admin categories for search suggestions
        onInputChange={(event, newInputValue) => setSearchQuery(newInputValue)}
        renderInput={(params) => (
          <TextField
            {...params}
            placeholder="Search for a category..."
            variant="outlined"
            sx={{
              mb: { xs: 3, sm: 5 },
              backgroundColor: originalThemeColors.inputBackground,
              borderRadius: '30px',
              boxShadow: `0 4px 15px ${alpha(originalThemeColors.primaryAccent, 0.1)}`,
              '& .MuiOutlinedInput-root': {
                borderRadius: '30px',
                color: originalThemeColors.textPrimary,
                '& fieldset': {
                  borderColor: alpha(originalThemeColors.primaryAccent, 0.5),
                  borderWidth: '1px',
                },
                '&:hover fieldset': {
                  borderColor: originalThemeColors.primaryAccent,
                },
                '&.Mui-focused fieldset': {
                  borderColor: originalThemeColors.primaryAccent,
                  boxShadow: `0 0 0 3px ${alpha(originalThemeColors.primaryAccent, 0.3)}`,
                },
              },
              '& .MuiInputBase-input': {
                color: originalThemeColors.textPrimary,
                '&::placeholder': {
                  color: originalThemeColors.textSecondary,
                  opacity: 1,
                },
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

      {/* Filter Buttons (Remain the same) */}
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: { xs: 4, sm: 6 } }}>
        <ButtonGroup variant="outlined" size="large" sx={{ borderRadius: '20px', overflow: 'hidden', boxShadow: `0 2px 8px ${alpha(originalThemeColors.primaryAccent, 0.15)}` }}>
          {[
            { label: 'All', value: 'all', icon: <AccountBalanceWalletIcon /> },
            { label: 'Revenues', value: 'income', icon: <AddCircleIcon /> },
            { label: 'Expenses', value: 'expenses', icon: <RemoveCircleIcon /> },
          ].map((typeOption, index) => (
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
                px: { xs: 2, sm: 3 },
                py: 1.5,
                fontSize: { xs: '0.85rem', sm: '1rem' }, // Adjusted font size slightly
                // Ensure consistent button height
                borderTopWidth: 1,
                borderBottomWidth: 1,
                borderLeftWidth: index === 0 ? 1 : 0, // Only first button has left border
                borderRightWidth: 1,
              }}
            >
              {typeOption.label}
            </Button>
          ))}
        </ButtonGroup>
      </Box>

      {/* Display Categories (Logic remains the same, displays 'categories' state) */}
      {Object.keys(groupedCategories).length === 0 && !loading ? (
        <Typography variant="h6" align="center" sx={{ color: originalThemeColors.textSecondary, mt: 4, fontStyle: 'italic' }}>
          No items found matching your criteria.
        </Typography>
      ) : (
        Object.keys(groupedCategories).map((type) => (
          <Box key={type} sx={{ mb: { xs: 5, sm: 8 } }}>
            <Typography
              variant="h4"
              sx={{
                backgroundColor: originalThemeColors.primaryAccent,
                color: originalThemeColors.buttonTextLight,
                p: { xs: 1.5, sm: 2 },
                borderRadius: '8px',
                boxShadow: `0 4px 12px ${alpha(originalThemeColors.primaryAccent, 0.2)}`,
                mb: { xs: 3, sm: 4 },
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                fontWeight: 'bold',
              }}
            >
              {getCategoryIcon(type)} {type.charAt(0).toUpperCase() + type.slice(1)}
            </Typography>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: {
                  xs: 'repeat(auto-fit, minmax(150px, 1fr))',
                  sm: 'repeat(auto-fit, minmax(170px, 1fr))',
                  md: 'repeat(5, 1fr)',
                },
                gap: { xs: 2, sm: 2.5, md: 3 },
                justifyContent: 'center',
              }}
            >
              {groupedCategories[type]
                .slice(0, visibleItems[type] || 12) // Use default if not set
                .map((category) => {
                  const isAdded = addedItems.includes(category._id);
                  return (
                    <Tooltip key={category._id} title={isAdded ? 'Budget Added' : `Add Budget for ${category.categoryName}`}>
                      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                        <CategoryCard
                          type={category.categoryType}
                          component="div"
                          role="button"
                          tabIndex={isAdded ? -1 : 0}
                          onClick={isAdded ? undefined : () => handleClickOpen(category)}
                          onKeyPress={
                            isAdded
                              ? undefined
                              : (e) => {
                                  if (e.key === 'Enter' || e.key === ' ') {
                                    handleClickOpen(category);
                                  }
                                }
                          }
                          sx={{
                            opacity: isAdded ? 0.6 : 1,
                            filter: isAdded ? 'grayscale(50%)' : 'none',
                            pointerEvents: isAdded ? 'none' : 'auto',
                            minWidth: 0,
                          }}
                          aria-disabled={isAdded}
                        >
                          {category.image && (
                            <Box
                              component="img"
                              // Handle both Base64 and relative URLs from backend
                              src={
                                category.image.startsWith('data:') || category.image.startsWith('http')
                                  ? category.image
                                  : `https://fin-tracker-ncbx.onrender.com/${category.image}` // Assuming relative paths need prefix
                              }
                              alt={category.categoryName}
                              sx={{
                                width: { xs: 60, sm: 70, md: 80 },
                                height: { xs: 60, sm: 70, md: 80 },
                                borderRadius: '50%',
                                mb: 1.5,
                                objectFit: 'cover',
                                border: `2px solid ${alpha(originalThemeColors.primaryAccent, 0.3)}`,
                              }}
                            />
                          )}
                          <Typography variant="h6" sx={{ color: originalThemeColors.primaryAccent, fontWeight: 600, fontSize: {xs: '0.9rem', sm: '1rem', md: '1.1rem'} }}>
                            {category.categoryName}
                          </Typography>
                          {isAdded && (
                            <Typography variant="caption" sx={{ color: originalThemeColors.expense, fontWeight: 'bold', mt: 1, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                              Added
                            </Typography>
                          )}
                        </CategoryCard>
                      </Box>
                    </Tooltip>
                  );
                })}
            </Box>
            {groupedCategories[type].length > (visibleItems[type] || 12) && (
              <Box sx={{ textAlign: 'center', mt: { xs: 3, sm: 4 } }}>
                <Button
                  onClick={() => handleLoadMore(type)}
                  variant="contained"
                  sx={{
                    backgroundColor: originalThemeColors.primaryAccent,
                    color: originalThemeColors.buttonTextLight,
                    px: 4,
                    py: 1.5,
                    borderRadius: '8px',
                    fontSize: { xs: '0.9rem', sm: '1rem' },
                    fontWeight: 600,
                    transition: 'background-color 0.3s ease, transform 0.2s ease',
                    '&:hover': {
                      backgroundColor: alpha(originalThemeColors.primaryAccent, 0.85),
                      transform: 'scale(1.03)',
                    },
                  }}
                >
                  Load More
                </Button>
              </Box>
            )}
          </Box>
        ))
      )}

      {/* Dialog for Adding Budget Item (Remains the same) */}
      <Dialog
        open={open}
        onClose={handleClose}
        fullWidth
        maxWidth="xs"
        PaperProps={{
          sx: {
            borderRadius: '16px',
            boxShadow: `0 10px 30px ${alpha(originalThemeColors.primaryAccent, 0.2)}`,
            background: originalThemeColors.surface,
            color: originalThemeColors.textPrimary,
          },
        }}
      >
        <DialogTitle
          sx={{
            background: `linear-gradient(135deg, ${originalThemeColors.primaryAccent}, ${alpha(originalThemeColors.primaryAccent, 0.8)})`,
            color: originalThemeColors.buttonTextLight,
            p: { xs: 2, sm: 2.5 },
            textAlign: 'center',
            fontSize: { xs: '1.5rem', sm: '1.75rem' },
            fontWeight: 'bold',
            borderTopLeftRadius: '16px',
            borderTopRightRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            {selectedCategory && getCategoryIcon(selectedCategory.categoryType)} {selectedCategory?.categoryName}
          </Box>
          <IconButton onClick={handleClose} sx={{ color: originalThemeColors.buttonTextLight, '&:hover': { background: alpha(originalThemeColors.white, 0.15)} }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: { xs: 2.5, sm: 3 }, backgroundColor: originalThemeColors.dialogSurface }}>
          {selectedCategory?.image && (
            <Box sx={{ textAlign: 'center', mb: 2 }}>
            <Box
              component="img"
              src={
                selectedCategory.image.startsWith('data:') || selectedCategory.image.startsWith('http')
                  ? selectedCategory.image
                  : `https://fin-tracker-ncbx.onrender.com/${selectedCategory.image}`
              }
              alt={selectedCategory.categoryName}
              sx={{
                width: 100,
                height: 100,
                borderRadius: '50%',
                mb: 2,
                objectFit: 'cover',
                border: `3px solid ${alpha(originalThemeColors.primaryAccent, 0.5)}`,
                boxShadow: `0 0 10px ${alpha(originalThemeColors.primaryAccent, 0.3)}`,
              }}
            />
            </Box>
          )}
          <Typography variant="subtitle1" sx={{ fontSize: {xs: '1rem', sm: '1.1rem'}, color: originalThemeColors.primaryAccent, mb: 2, fontWeight: 500, textAlign: 'center' }}>
            Type: {selectedCategory?.categoryType}
          </Typography>
          <TextField
            autoFocus
            margin="dense"
            label="Value"
            type="number"
            inputProps={{ step: '0.01', min: '0' }}
            fullWidth
            variant="outlined"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            sx={{
              mb: 2.5,
              '& .MuiOutlinedInput-root': {
                backgroundColor: originalThemeColors.inputBackground,
                borderRadius: '8px',
                color: originalThemeColors.textPrimary,
                '& fieldset': { borderColor: originalThemeColors.borderColor },
                '&:hover fieldset': { borderColor: originalThemeColors.primaryAccent },
                '&.Mui-focused fieldset': { borderColor: originalThemeColors.primaryAccent, boxShadow: `0 0 0 2px ${alpha(originalThemeColors.primaryAccent, 0.2)}` },
              },
              '& .MuiInputLabel-root': { color: originalThemeColors.textSecondary },
              '& .MuiInputLabel-root.Mui-focused': { color: originalThemeColors.primaryAccent },
            }}
          />
          <TextField
            margin="dense"
            label="Date"
            type="date"
            fullWidth
            variant="outlined"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{
              mb: 2.5,
              '& .MuiOutlinedInput-root': {
                backgroundColor: originalThemeColors.inputBackground,
                borderRadius: '8px',
                color: originalThemeColors.textPrimary,
                '& fieldset': { borderColor: originalThemeColors.borderColor },
                '&:hover fieldset': { borderColor: originalThemeColors.primaryAccent },
                '&.Mui-focused fieldset': { borderColor: originalThemeColors.primaryAccent, boxShadow: `0 0 0 2px ${alpha(originalThemeColors.primaryAccent, 0.2)}` },
                '& input[type="date"]::-webkit-calendar-picker-indicator': {
                    filter: 'invert(0.3) sepia(1) saturate(5) hue-rotate(190deg)',
                }
              },
              '& .MuiInputLabel-root': { color: originalThemeColors.textSecondary },
              '& .MuiInputLabel-root.Mui-focused': { color: originalThemeColors.primaryAccent },
            }}
          />
          {errorMessage && (
            <Typography variant="body2" sx={{ color: originalThemeColors.expense, textAlign: 'center', mb: 2, fontWeight: 500 }}>
              {errorMessage}
            </Typography>
          )}
        </DialogContent>
        <DialogActions
          sx={{
            p: { xs: 2, sm: 2.5 },
            justifyContent: 'center',
            gap: 2,
            backgroundColor: originalThemeColors.dialogSurface,
            borderBottomLeftRadius: '16px',
            borderBottomRightRadius: '16px',
          }}
        >
          <Button
            onClick={handleClose}
            variant="outlined"
            sx={{
              borderColor: originalThemeColors.primaryAccent,
              color: originalThemeColors.primaryAccent,
              px: { xs: 3, sm: 4 },
              py: 1.2,
              borderRadius: '8px',
              fontSize: { xs: '0.9rem', sm: '1rem' },
              fontWeight: 500,
              '&:hover': {
                borderColor: originalThemeColors.primaryAccent,
                background: alpha(originalThemeColors.primaryAccent, 0.08),
              }
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={isSubmitting}
            sx={{
              backgroundColor: originalThemeColors.primaryAccent,
              color: originalThemeColors.buttonTextLight,
              px: { xs: 3, sm: 4 },
              py: 1.2,
              borderRadius: '8px',
              fontSize: { xs: '0.9rem', sm: '1rem' },
              fontWeight: 600,
              transition: 'background-color 0.3s ease, transform 0.2s ease',
              '&:hover': {
                backgroundColor: alpha(originalThemeColors.primaryAccent, 0.85),
                transform: 'scale(1.02)',
              },
              '&.Mui-disabled': {
                background: alpha(originalThemeColors.textSecondary, 0.5),
                color: alpha(originalThemeColors.white, 0.7)
              }
            }}
          >
            {isSubmitting ? <CircularProgress size={24} sx={{ color: originalThemeColors.buttonTextLight }} /> : 'Submit Budget'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* --- Dialog for Adding User Card (Modified from New Category) --- */}
      <Dialog
        open={userCardDialogOpen} // Use renamed state
        onClose={handleUserCardDialogClose} // Use renamed handler
        fullWidth
        maxWidth="xs"
        PaperProps={{
          sx: {
            borderRadius: '20px',
            boxShadow: `0 12px 40px ${alpha(originalThemeColors.primaryAccent, 0.2)}`,
            background: originalThemeColors.surface,
            color: originalThemeColors.textPrimary,
          },
        }}
      >
        <DialogTitle
          sx={{
            background: `linear-gradient(135deg, ${originalThemeColors.primaryAccent}, ${alpha(originalThemeColors.primaryAccent, 0.8)})`,
            color: originalThemeColors.buttonTextLight,
            p: { xs: 2, sm: 3 },
            textAlign: 'center',
            fontSize: { xs: '1.5rem', sm: '1.75rem' },
            fontWeight: 'bold',
            borderTopLeftRadius: '20px',
            borderTopRightRadius: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          Add Your Custom Card
          <IconButton onClick={handleUserCardDialogClose} sx={{ color: originalThemeColors.buttonTextLight, '&:hover': { background: alpha(originalThemeColors.white, 0.15)} }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: { xs: 2.5, sm: 3 }, backgroundColor: originalThemeColors.dialogSurface }}>
          {userCardImagePreview && ( // Use preview state
            <Box sx={{ textAlign: 'center', mb: 2 }}>
              <img
                src={userCardImagePreview} // Show preview
                alt="Preview"
                style={{ width: 100, height: 100, borderRadius: '50%', objectFit: 'cover', border: `3px solid ${alpha(originalThemeColors.primaryAccent, 0.5)}` }}
              />
            </Box>
          )}
          <TextField
            autoFocus
            margin="dense"
            label="Card Name"
            fullWidth
            variant="outlined"
            value={userCardName} // Use renamed state
            onChange={(e) => setUserCardName(e.target.value)} // Use renamed handler
            sx={{
              mb: 2.5,
              '& .MuiOutlinedInput-root': {
                backgroundColor: originalThemeColors.inputBackground,
                borderRadius: '8px',
                color: originalThemeColors.textPrimary,
                '& fieldset': { borderColor: originalThemeColors.borderColor },
                '&:hover fieldset': { borderColor: originalThemeColors.primaryAccent },
                '&.Mui-focused fieldset': { borderColor: originalThemeColors.primaryAccent, boxShadow: `0 0 0 2px ${alpha(originalThemeColors.primaryAccent, 0.2)}` },
              },
              '& .MuiInputLabel-root': { color: originalThemeColors.textSecondary },
              '& .MuiInputLabel-root.Mui-focused': { color: originalThemeColors.primaryAccent },
            }}
          />
          {/* Replace TextField with Select for Card Type */}
          <FormControl fullWidth variant="outlined" sx={{ mb: 2.5 }}>
            <InputLabel id="user-card-type-label" sx={{ color: originalThemeColors.textSecondary, '&.Mui-focused': { color: originalThemeColors.primaryAccent } }}>Card Type</InputLabel>
            <Select
              labelId="user-card-type-label"
              value={userCardType} // Use renamed state
              onChange={(e) => setUserCardType(e.target.value)} // Use renamed handler
              label="Card Type"
              sx={{
                backgroundColor: originalThemeColors.inputBackground,
                borderRadius: '8px',
                color: originalThemeColors.textPrimary,
                '& .MuiOutlinedInput-notchedOutline': { borderColor: originalThemeColors.borderColor },
                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: originalThemeColors.primaryAccent },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: originalThemeColors.primaryAccent, boxShadow: `0 0 0 2px ${alpha(originalThemeColors.primaryAccent, 0.2)}` },
                '& .MuiSelect-icon': { color: originalThemeColors.textSecondary },
              }}
            >
              {/* Provide relevant type options - adjust as needed */}
              <MenuItem value="Income">Income</MenuItem>
              <MenuItem value="Expense">Expense</MenuItem>
              {/* Add other types if necessary */}
            </Select>
          </FormControl>

          <Button
            variant="outlined"
            component="label"
            fullWidth
            sx={{
              mb: 2.5,
              borderColor: originalThemeColors.primaryAccent,
              color: originalThemeColors.primaryAccent,
              py: 1.2,
              borderRadius: '8px',
              '&:hover': {
                borderColor: originalThemeColors.primaryAccent,
                background: alpha(originalThemeColors.primaryAccent, 0.08),
              }
            }}
          >
            {userCardImageFile ? 'Change Image' : 'Upload Image'}
            <input
              type="file"
              hidden
              accept="image/*" // Accept only image files
              onChange={handleUserCardImageChange} // Use renamed handler
            />
          </Button>

          {userCardErrorMessage && (
            <Typography variant="body2" sx={{ color: originalThemeColors.expense, textAlign: 'center', mb: 2, fontWeight: 500 }}>
              {userCardErrorMessage} // Use renamed state
            </Typography>
          )}
        </DialogContent>
        <DialogActions
          sx={{
            p: { xs: 2, sm: 2.5 },
            justifyContent: 'center',
            gap: 2,
            backgroundColor: originalThemeColors.dialogSurface,
            borderBottomLeftRadius: '20px',
            borderBottomRightRadius: '20px',
          }}
        >
          <Button
            onClick={handleUserCardDialogClose} // Use renamed handler
            variant="outlined"
            sx={{
              borderColor: originalThemeColors.primaryAccent,
              color: originalThemeColors.primaryAccent,
              px: { xs: 3, sm: 4 },
              py: 1.2,
              borderRadius: '8px',
              fontSize: { xs: '0.9rem', sm: '1rem' },
              fontWeight: 500,
              '&:hover': {
                borderColor: originalThemeColors.primaryAccent,
                background: alpha(originalThemeColors.primaryAccent, 0.08),
              }
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleUserCardSubmit} // Use renamed handler
            variant="contained"
            disabled={isUserCardSubmitting} // Use renamed state
            sx={{
              backgroundColor: originalThemeColors.primaryAccent,
              color: originalThemeColors.buttonTextLight,
              px: { xs: 3, sm: 4 },
              py: 1.2,
              borderRadius: '8px',
              fontSize: { xs: '0.9rem', sm: '1rem' },
              fontWeight: 600,
              transition: 'background-color 0.3s ease, transform 0.2s ease',
              '&:hover': {
                backgroundColor: alpha(originalThemeColors.primaryAccent, 0.85),
                transform: 'scale(1.02)',
              },
              '&.Mui-disabled': {
                background: alpha(originalThemeColors.textSecondary, 0.5),
                color: alpha(originalThemeColors.white, 0.7)
              }
            }}
          >
            {isUserCardSubmitting ? <CircularProgress size={24} sx={{ color: originalThemeColors.buttonTextLight }} /> : 'Add Card'} // Use renamed state
          </Button>
        </DialogActions>
      </Dialog>
      {/* --- End Dialog for Adding User Card --- */}

      {/* Floating Action Button to open the Add User Card dialog */}
      <Fab
        color="primary"
        aria-label="add user card"
        onClick={handleUserCardDialogOpen} // Use renamed handler
        sx={{
          position: 'fixed',
          bottom: { xs: 16, sm: 32 },
          right: { xs: 16, sm: 32 },
          backgroundColor: originalThemeColors.primaryAccent,
          color: originalThemeColors.buttonTextLight,
          boxShadow: `0 6px 20px ${alpha(originalThemeColors.primaryAccent, 0.4)}`,
          '&:hover': {
            backgroundColor: alpha(originalThemeColors.primaryAccent, 0.9),
            transform: 'scale(1.05)',
          },
          transition: 'transform 0.2s ease-in-out, background-color 0.3s ease',
        }}
      >
        <AddIcon />
      </Fab>

    </Container>
  );
};

export default DashboardUser;

