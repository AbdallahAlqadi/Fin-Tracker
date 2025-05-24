import React, { useState, useEffect, useCallback } from 'react'; // Added useCallback
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
  Snackbar, // Added Snackbar for feedback
  Alert,    // Added Alert for Snackbar content
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
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'; // Icon for added items
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline'; // Icon to add items
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline'; // Icon to remove items

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
  shouldForwardProp: (prop) => prop !== 'type' && prop !== 'isInUserCard', // Prevent custom props from reaching DOM
})(({ theme, type, isInUserCard }) => ({
  border: `2px solid ${isInUserCard ? originalThemeColors.primaryAccent : (type && type.toLowerCase().startsWith('expens') ? originalThemeColors.expense : originalThemeColors.income)}`,
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
  position: 'relative', // Needed for positioning the add/remove icons
  '&:hover': {
    transform: 'scale(1.08)',
    boxShadow: `0 12px 32px ${alpha(originalThemeColors.primaryAccent, 0.25)}`,
    // Keep border color consistent on hover, or change based on isInUserCard
    borderColor: originalThemeColors.primaryAccent, // Always highlight with primary on hover
  },
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

// Style for the Add/Remove icon button
const AddRemoveButton = styled(IconButton)(({ theme }) => ({
  position: 'absolute',
  top: theme.spacing(1.5),
  right: theme.spacing(1.5),
  backgroundColor: alpha(originalThemeColors.surface, 0.8),
  color: originalThemeColors.primaryAccent,
  '&:hover': {
    backgroundColor: alpha(originalThemeColors.primaryAccent, 0.1),
    color: originalThemeColors.primaryAccent,
  },
  // Make it slightly smaller on smaller cards
  [theme.breakpoints.down('sm')]: {
    top: theme.spacing(1),
    right: theme.spacing(1),
    padding: theme.spacing(0.5),
  },
}));

const DashboardUser = () => {
  const [categories, setCategories] = useState([]);
  const [userCardCategoryIds, setUserCardCategoryIds] = useState(new Set()); // State for user's card category IDs
  const [loading, setLoading] = useState(true);
  const [loadingUserCard, setLoadingUserCard] = useState(true); // Separate loading state for user card
  const [open, setOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [value, setValue] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [visibleItems, setVisibleItems] = useState({});
  const [errorMessage, setErrorMessage] = useState('');
  const [scale, setScale] = useState(1); // Title scale effect
  const [searchQuery, setSearchQuery] = useState('');
  const [addedBudgetItems, setAddedBudgetItems] = useState(new Set()); // Track budget items added in this session
  const [isSubmittingBudget, setIsSubmittingBudget] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [newDialogOpen, setNewDialogOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryType, setNewCategoryType] = useState('');
  const [newCategoryImage, setNewCategoryImage] = useState(null);
  const [newErrorMessage, setNewErrorMessage] = useState('');
  const [isNewSubmitting, setIsNewSubmitting] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false); // Snackbar state
  const [snackbarMessage, setSnackbarMessage] = useState(''); // Snackbar message
  const [snackbarSeverity, setSnackbarSeverity] = useState('success'); // Snackbar severity ('success', 'error', 'info', 'warning')

  const isSmallDevice = useMediaQuery('(max-width:600px)');
  const isMediumDevice = useMediaQuery('(max-width:900px)');

  const getToken = useCallback(() => sessionStorage.getItem('jwt'), []);

  // Fetch General Categories
  useEffect(() => {
    const fetchCategories = async () => {
      setLoading(true);
      try {
        // Use Render backend URL or replace with your actual API endpoint
        const response = await axios.get('https://fin-tracker-ncbx.onrender.com/api/getcategories');
        setCategories(response.data.data || []); // Ensure it's an array
        const initialVisibleItems = (response.data.data || []).reduce((acc, category) => {
          if (!acc[category.categoryType]) {
            acc[category.categoryType] = 12;
          }
          return acc;
        }, {});
        setVisibleItems(initialVisibleItems);
      } catch (error) {
        console.error('Error fetching categories:', error);
        showSnackbar('Failed to load categories.', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []); // Removed dependency on getToken as it's stable

  // Fetch User's Card Categories
  useEffect(() => {
    const fetchUserCard = async () => {
      const token = getToken();
      if (!token) {
        setLoadingUserCard(false);
        // Optionally redirect to login or show message
        console.log('No token found for fetching user card.');
        return;
      }
      setLoadingUserCard(true);
      try {
        // Use Render backend URL or replace with your actual API endpoint
        const response = await axios.get('https://fin-tracker-ncbx.onrender.com/api/getUserCard', {
          headers: { Auth: `Bearer ${token}` },
        });
        if (response.data && response.data.carduser) {
          const ids = new Set(response.data.carduser.map(item => item.categoryId));
          setUserCardCategoryIds(ids);
        }
      } catch (error) {
        console.error('Error fetching user card:', error);
        // Don't show snackbar here, might be expected if user has no card yet
      } finally {
        setLoadingUserCard(false);
      }
    };
    fetchUserCard();
  }, [getToken]); // Depend on getToken

  const showSnackbar = (message, severity = 'success') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const handleSnackbarClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbarOpen(false);
  };

  // Handler to Add Category to User's Card
  const handleAddToCard = async (categoryId, categoryName) => {
    const token = getToken();
    if (!token) {
      showSnackbar('Please log in to add categories.', 'error');
      return;
    }
    try {
      // Use Render backend URL or replace with your actual API endpoint
      await axios.post('https://fin-tracker-ncbx.onrender.com/api/addToCard',
        { CategoriesId: categoryId },
        { headers: { Auth: `Bearer ${token}` } }
      );
      setUserCardCategoryIds(prev => new Set(prev).add(categoryId));
      showSnackbar(`'${categoryName}' added to your list.`, 'success');
    } catch (error) {
      console.error('Error adding to card:', error);
      const errorMsg = error.response?.data?.error || 'Failed to add category.';
      showSnackbar(errorMsg, 'error');
    }
  };

  // Handler to Remove Category from User's Card
  const handleRemoveFromCard = async (categoryId, categoryName) => {
    const token = getToken();
    if (!token) {
      showSnackbar('Please log in to remove categories.', 'error');
      return;
    }
    try {
      // Use Render backend URL or replace with your actual API endpoint
      await axios.delete('https://fin-tracker-ncbx.onrender.com/api/deleteFromCard', {
        headers: { Auth: `Bearer ${token}` },
        data: { categoryId: categoryId } // Send categoryId in data for DELETE
      });
      setUserCardCategoryIds(prev => {
        const next = new Set(prev);
        next.delete(categoryId);
        return next;
      });
      showSnackbar(`'${categoryName}' removed from your list.`, 'success');
    } catch (error) {
      console.error('Error removing from card:', error);
      const errorMsg = error.response?.data?.error || 'Failed to remove category.';
      showSnackbar(errorMsg, 'error');
    }
  };

  // Opens the dialog to add a budget item (expense/income)
  const handleClickOpenBudgetDialog = (category) => {
    // Reset potential previous state from budget item adding
    setAddedBudgetItems(prev => {
        const next = new Set(prev);
        // Maybe clear based on date or keep it simple for now
        // next.delete(category._id + selectedDate); // Example if tracking by date
        return next;
    });

    // Check if this specific category was already added *as a budget item* on the selected date
    // This logic seems to be handled by the `addedItems` state in the original code, let's rename it
    // if (addedBudgetItems.has(category._id)) return; // This check might be redundant if backend handles it

    setSelectedCategory(category);
    setOpen(true);
    setErrorMessage('');
    setValue(''); // Clear previous value
    setSelectedDate(''); // Clear previous date
  };

  const handleCloseBudgetDialog = () => {
    setOpen(false);
    setSelectedCategory(null);
    setValue('');
    setSelectedDate('');
    setErrorMessage('');
  };

  // Submits the budget item (expense/income)
  const handleSubmitBudgetItem = async () => {
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
    const submissionData = {
        CategoriesId: currentCategory._id,
        valueitem: parsedValue,
        date: selectedDate,
    };

    setIsSubmittingBudget(true);
    const token = getToken();

    try {
      // Use Render backend URL or replace with your actual API endpoint
      const response = await axios.post(
        'https://fin-tracker-ncbx.onrender.com/api/addBudget',
        submissionData,
        {
          headers: {
            Auth: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      console.log('Budget Response:', response.data);
      // Mark this category+date combination as added for UI feedback (optional)
      // setAddedBudgetItems((prev) => new Set(prev).add(currentCategory._id + selectedDate));
      showSnackbar(`Budget item for '${currentCategory.categoryName}' added successfully!`, 'success');
      handleCloseBudgetDialog(); // Close dialog on success

    } catch (error) {
      console.error('Error submitting budget value:', error);
      const errorMsg = error.response?.data?.error || 'Failed to submit budget item.';
      if (error.response && error.response.status === 400) {
        // Handle specific backend error for duplicate entry on the same date
        setErrorMessage(errorMsg); // Show error in the dialog
        // Optionally mark as added anyway for UI consistency if backend prevents duplicates
        // setAddedBudgetItems((prev) => new Set(prev).add(currentCategory._id + selectedDate));
      } else {
        setErrorMessage(errorMsg); // Show general error in the dialog
      }
    } finally {
      setIsSubmittingBudget(false);
    }
  };

  const handleLoadMore = (type) => {
    setVisibleItems((prev) => ({
      ...prev,
      [type]: (prev[type] || 0) + 10, // Load 10 more
    }));
  };

  // --- Add New Category Dialog Logic (Mostly unchanged) ---
  const handleNewDialogOpen = () => {
    setNewDialogOpen(true);
    setNewErrorMessage('');
  };
  const handleNewDialogClose = () => {
    setNewDialogOpen(false);
    setNewCategoryName('');
    setNewCategoryType('');
    setNewCategoryImage(null);
    setNewErrorMessage('');
  };
  const handleImageChange = (event) => {
    if (event.target.files && event.target.files[0]) {
      setNewCategoryImage(event.target.files[0]);
    }
  };
  const handleNewCategorySubmit = async () => {
    if (!newCategoryName || !newCategoryType) {
      setNewErrorMessage('Please fill in all required fields.');
      return;
    }
    setIsNewSubmitting(true);
    const token = getToken();
    const formData = new FormData();
    formData.append('categoryName', newCategoryName);
    formData.append('categoryType', newCategoryType);
    if (newCategoryImage) {
      formData.append('image', newCategoryImage);
    }
    try {
      // Use Render backend URL or replace with your actual API endpoint
      const response = await axios.post(
        'https://fin-tracker-ncbx.onrender.com/api/addCategory',
        formData,
        {
          headers: {
            Auth: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      console.log('New Category Response:', response.data);
      // Add the new category to the main list and potentially the user's card if desired
      const newCat = response.data.data;
      setCategories((prev) => [...prev, newCat]);
      // Decide if a newly created category should automatically be added to the user's card
      // handleAddToCard(newCat._id, newCat.categoryName); // Optional: Add to user's list automatically
      showSnackbar(`Category '${newCat.categoryName}' created successfully.`, 'success');
      handleNewDialogClose();
    } catch (error) {
      console.error('Error adding new category:', error);
      setNewErrorMessage(error.response?.data?.error || 'An error occurred while adding the category.');
    } finally {
      setIsNewSubmitting(false);
    }
  };
  // --- End Add New Category Dialog Logic ---

  const categoryOptions = categories.map((cat) => cat.categoryName);

  // Combined loading state
  if (loading || loadingUserCard) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: `linear-gradient(135deg, ${originalThemeColors.backgroundGradientStart} 0%, ${originalThemeColors.backgroundGradientEnd} 100%)` }}>
        <CircularProgress sx={{ color: originalThemeColors.primaryAccent }} size={60} />
        <Typography variant="h6" sx={{ color: originalThemeColors.textPrimary, ml: 2 }}>
          Loading Dashboard...
        </Typography>
      </Box>
    );
  }

  // Filtering logic remains largely the same
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
      {/* Snackbar for feedback */}
      <Snackbar open={snackbarOpen} autoHideDuration={4000} onClose={handleSnackbarClose} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>

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

      {/* Search Bar */}
      <Autocomplete
        freeSolo
        options={categoryOptions}
        inputValue={searchQuery} // Control the input value
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

      {/* Filter Buttons */}
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: { xs: 4, sm: 6 } }}>
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
                px: { xs: 2, sm: 3 },
                py: 1.5,
                fontSize: { xs: '0.85rem', sm: '1rem' }, // Slightly adjusted font size
                borderRight: '1px solid ' + alpha(originalThemeColors.primaryAccent, 0.3), // Add subtle separator
                '&:last-child': {
                  borderRight: 'none',
                },
              }}
            >
              {typeOption.label}
            </Button>
          ))}
        </ButtonGroup>
      </Box>

      {/* Category Grid */}
      {Object.keys(groupedCategories).length === 0 ? (
        <Typography variant="h6" align="center" sx={{ color: originalThemeColors.textSecondary, mt: 4, fontStyle: 'italic' }}>
          No categories found matching your criteria.
        </Typography>
      ) : (
        Object.keys(groupedCategories).map((type) => (
          <Box key={type} sx={{ mb: { xs: 5, sm: 8 } }}>
            {/* Type Header */}
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

            {/* Grid of Cards */}
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
                .slice(0, visibleItems[type] || 12) // Use default if visibleItems[type] is undefined
                .map((category) => {
                  const isInUserCard = userCardCategoryIds.has(category._id);
                  // const isBudgetItemAdded = addedBudgetItems.has(category._id + selectedDate); // Check if budget item was added

                  return (
                    <Tooltip key={category._id} title={`Click to add budget item for ${category.categoryName}`}>
                      <Box sx={{ display: 'flex', justifyContent: 'center', position: 'relative' }}>
                        <CategoryCard
                          type={category.categoryType}
                          isInUserCard={isInUserCard} // Pass prop for styling
                          component="div"
                          role="button"
                          tabIndex={0} // Always focusable
                          onClick={() => handleClickOpenBudgetDialog(category)} // Always open budget dialog on main click
                          onKeyPress={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                handleClickOpenBudgetDialog(category);
                              }
                            }}
                          sx={{
                            // Adjust opacity/filter based on whether it's added to user card or budget item added?
                            // opacity: isBudgetItemAdded ? 0.6 : 1,
                            // filter: isBudgetItemAdded ? 'grayscale(50%)' : 'none',
                            // pointerEvents: isBudgetItemAdded ? 'none' : 'auto', // Prevent adding budget item again?
                            minWidth: 0,
                          }}
                          // aria-disabled={isBudgetItemAdded}
                        >
                          {/* Add/Remove Button */}
                          <Tooltip title={isInUserCard ? `Remove '${category.categoryName}' from My List` : `Add '${category.categoryName}' to My List`}>
                            <AddRemoveButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation(); // Prevent card click
                                if (isInUserCard) {
                                  handleRemoveFromCard(category._id, category.categoryName);
                                } else {
                                  handleAddToCard(category._id, category.categoryName);
                                }
                              }}
                              aria-label={isInUserCard ? 'Remove from my list' : 'Add to my list'}
                            >
                              {isInUserCard ? <RemoveCircleOutlineIcon fontSize="inherit" sx={{ color: originalThemeColors.expense }} /> : <AddCircleOutlineIcon fontSize="inherit" sx={{ color: originalThemeColors.income }} />}
                            </AddRemoveButton>
                          </Tooltip>

                          {/* Category Image */}
                          {category.image && (
                            <Box
                              component="img"
                              src={
                                category.image.startsWith('data:') || category.image.startsWith('http') // Handle base64 or external URLs
                                  ? category.image
                                  : `https://fin-tracker-ncbx.onrender.com/${category.image}` // Assume relative path needs prefix
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
                              // Handle image loading errors gracefully
                              onError={(e) => { e.target.style.display = 'none'; /* Hide broken image */ }}
                            />
                          )}
                          {/* Category Name */}
                          <Typography variant="h6" sx={{ color: originalThemeColors.primaryAccent, fontWeight: 600, fontSize: {xs: '0.9rem', sm: '1rem', md: '1.1rem'} }}>
                            {category.categoryName}
                          </Typography>

                          {/* Optional: Indicator if added to user's list */} 
                          {/* {isInUserCard && (
                            <CheckCircleOutlineIcon sx={{ color: originalThemeColors.income, position: 'absolute', bottom: 8, right: 8, fontSize: '1.2rem' }} />
                          )} */} 

                          {/* Removed 'Added' text related to budget items, handled by dialog/snackbar now */}
                        </CategoryCard>
                      </Box>
                    </Tooltip>
                  );
                })}
            </Box>

            {/* Load More Button */}
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

      {/* Dialog for Adding Budget Item */}
      <Dialog
        open={open}
        onClose={handleCloseBudgetDialog}
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
            {selectedCategory && getCategoryIcon(selectedCategory.categoryType)} Add Budget for {selectedCategory?.categoryName}
          </Box>
          <IconButton onClick={handleCloseBudgetDialog} sx={{ color: originalThemeColors.buttonTextLight, '&:hover': { background: alpha(originalThemeColors.white, 0.15)} }}>
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
              onError={(e) => { e.target.style.display = 'none'; }}
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
            error={!!errorMessage} // Highlight field if error exists
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
            error={!!errorMessage} // Highlight field if error exists
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
                    cursor: 'pointer',
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
            onClick={handleCloseBudgetDialog}
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
            onClick={handleSubmitBudgetItem}
            variant="contained"
            disabled={isSubmittingBudget}
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
            {isSubmittingBudget ? <CircularProgress size={24} sx={{ color: originalThemeColors.buttonTextLight }} /> : 'Submit Budget Item'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog for Adding New Category (Unchanged Structure) */}
      <Dialog
        open={newDialogOpen}
        onClose={handleNewDialogClose}
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
          Add New General Category
          <IconButton onClick={handleNewDialogClose} sx={{ color: originalThemeColors.buttonTextLight, '&:hover': { background: alpha(originalThemeColors.white, 0.15)} }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: { xs: 2.5, sm: 3 }, backgroundColor: originalThemeColors.dialogSurface }}>
          {newCategoryImage && (
            <Box sx={{ textAlign: 'center', mb: 2 }}>
              <img
                src={URL.createObjectURL(newCategoryImage)}
                alt="Preview"
                style={{ width: 100, height: 100, borderRadius: '50%', objectFit: 'cover', border: `3px solid ${alpha(originalThemeColors.primaryAccent, 0.5)}` }}
              />
            </Box>
          )}
          <TextField
            autoFocus
            margin="dense"
            label="Category Name"
            fullWidth
            variant="outlined"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            error={!!newErrorMessage}
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
          <FormControl fullWidth variant="outlined" sx={{ mb: 2.5 }} error={!!newErrorMessage}>
            <InputLabel id="category-type-label">Category Type</InputLabel>
            <Select
              labelId="category-type-label"
              value={newCategoryType}
              onChange={(e) => setNewCategoryType(e.target.value)}
              label="Category Type"
              sx={{
                backgroundColor: originalThemeColors.inputBackground,
                borderRadius: '8px',
                color: originalThemeColors.textPrimary,
                '& .MuiOutlinedInput-notchedOutline': { borderColor: originalThemeColors.borderColor },
                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: originalThemeColors.primaryAccent },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: originalThemeColors.primaryAccent, boxShadow: `0 0 0 2px ${alpha(originalThemeColors.primaryAccent, 0.2)}` },
              }}
            >
              <MenuItem value="income">Income</MenuItem>
              <MenuItem value="expenses">Expenses</MenuItem>
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
              '&:hover': {
                background: alpha(originalThemeColors.primaryAccent, 0.08),
              }
            }}
          >
            Upload Image
            <input type="file" hidden accept="image/*" onChange={handleImageChange} />
          </Button>
          {newErrorMessage && (
            <Typography variant="body2" sx={{ color: originalThemeColors.expense, textAlign: 'center', mb: 2, fontWeight: 500 }}>
              {newErrorMessage}
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
          <Button onClick={handleNewDialogClose} variant="outlined" sx={{ borderColor: originalThemeColors.primaryAccent, color: originalThemeColors.primaryAccent, px: 3, py: 1.2, borderRadius: '8px', '&:hover': { background: alpha(originalThemeColors.primaryAccent, 0.08) } }}>
            Cancel
          </Button>
          <Button onClick={handleNewCategorySubmit} variant="contained" disabled={isNewSubmitting} sx={{ backgroundColor: originalThemeColors.primaryAccent, color: originalThemeColors.buttonTextLight, px: 3, py: 1.2, borderRadius: '8px', '&:hover': { backgroundColor: alpha(originalThemeColors.primaryAccent, 0.85) }, '&.Mui-disabled': { background: alpha(originalThemeColors.textSecondary, 0.5), color: alpha(originalThemeColors.white, 0.7) } }}>
            {isNewSubmitting ? <CircularProgress size={24} sx={{ color: originalThemeColors.buttonTextLight }} /> : 'Add Category'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Floating Action Button to Add New General Category */}
      <Fab
        color="primary"
        aria-label="add new category"
        onClick={handleNewDialogOpen}
        sx={{
          position: 'fixed',
          bottom: { xs: 16, sm: 32 },
          right: { xs: 16, sm: 32 },
          backgroundColor: originalThemeColors.primaryAccent,
          '&:hover': {
            backgroundColor: alpha(originalThemeColors.primaryAccent, 0.85),
          }
        }}
      >
        <AddIcon />
      </Fab>

    </Container>
  );
};

export default DashboardUser;

