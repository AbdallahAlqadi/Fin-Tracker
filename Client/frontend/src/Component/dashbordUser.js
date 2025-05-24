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
  Fab, // Restored FAB
  Select, // Restored Select
  MenuItem, // Restored MenuItem
  FormControl, // Restored FormControl
  InputLabel, // Restored InputLabel
  Snackbar,
  Alert,
} from '@mui/material';
import Autocomplete from '@mui/material/Autocomplete';
import { styled, keyframes, alpha } from '@mui/system';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add'; // Restored AddIcon
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import RemoveCircleIcon from '@mui/icons-material/RemoveCircle';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';

// --- THEME COLORS ---
const originalThemeColors = {
  backgroundGradientStart: '#F0F8FF',
  backgroundGradientEnd: '#E6F2FF',
  primaryAccent: '#4A90E2',
  textPrimary: '#333333',
  textSecondary: '#666666',
  expense: '#FF5252',
  income: '#4CAF50', // Still used for styling based on type
  surface: '#FFFFFF',
  dialogSurface: '#FAFAFA',
  inputBackground: '#FFFFFF',
  borderColor: '#DDDDDD',
  white: '#FFFFFF',
  buttonTextLight: '#FFFFFF',
  buttonTextDark: '#4A90E2',
};

// Animations
const floatAnimation = keyframes`
  0% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
  100% { transform: translateY(0); }
`;
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

// Category card design
const CategoryCard = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'type' && prop !== 'isInUserCard' && prop !== 'isUserSpecific',
})(({ theme, type, isInUserCard, isUserSpecific }) => ({
  border: `2px solid ${isUserSpecific ? '#9C27B0' : (isInUserCard ? originalThemeColors.primaryAccent : (type && type.toLowerCase().startsWith('expens') ? originalThemeColors.expense : originalThemeColors.income))}`,
  backgroundColor: originalThemeColors.surface,
  borderRadius: '20px',
  padding: theme.spacing(3),
  width: '190px',
  height: '190px',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  textAlign: 'center',
  boxShadow: `0 8px 24px ${alpha(isUserSpecific ? '#9C27B0' : originalThemeColors.primaryAccent, 0.15)}`,
  cursor: 'pointer',
  transition: 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.4s ease, border-color 0.3s ease',
  animation: `${fadeIn} 0.6s ease-out forwards`,
  position: 'relative',
  '&:hover': {
    transform: 'scale(1.08)',
    boxShadow: `0 12px 32px ${alpha(isUserSpecific ? '#9C27B0' : originalThemeColors.primaryAccent, 0.25)}`,
    borderColor: isUserSpecific ? '#9C27B0' : originalThemeColors.primaryAccent,
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

// Add/Remove icon button style (Only for Global Categories)
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
  [theme.breakpoints.down('sm')]: {
    top: theme.spacing(1),
    right: theme.spacing(1),
    padding: theme.spacing(0.5),
  },
}));

const DashboardUser = () => {
  const [globalCategories, setGlobalCategories] = useState([]); // Admin categories
  const [userCategories, setUserCategories] = useState([]); // User-added categories
  const [userCardCategoryIds, setUserCardCategoryIds] = useState(new Set()); // IDs of *global* categories added to user's list
  const [loadingGlobal, setLoadingGlobal] = useState(true);
  const [loadingUserSpecific, setLoadingUserSpecific] = useState(true);
  const [loadingUserCard, setLoadingUserCard] = useState(true);
  const [openBudgetDialog, setOpenBudgetDialog] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [value, setValue] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [visibleGlobalItems, setVisibleGlobalItems] = useState({});
  const [visibleUserItems, setVisibleUserItems] = useState({});
  const [budgetErrorMessage, setBudgetErrorMessage] = useState('');
  const [scale, setScale] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmittingBudget, setIsSubmittingBudget] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');

  // State for the 'Add New User Category' dialog
  const [newUserCategoryDialogOpen, setNewUserCategoryDialogOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryType, setNewCategoryType] = useState(''); // 'revenues' or 'expenses'
  const [newCategoryImageBase64, setNewCategoryImageBase64] = useState(null); // Store Base64 string
  const [newUserCategoryErrorMessage, setNewUserCategoryErrorMessage] = useState('');
  const [isSubmittingNewUserCategory, setIsSubmittingNewUserCategory] = useState(false);

  const isSmallDevice = useMediaQuery('(max-width:600px)');
  const isMediumDevice = useMediaQuery('(max-width:900px)');

  const getToken = useCallback(() => sessionStorage.getItem('jwt'), []);

  // Fetch General (Global/Admin) Categories
  useEffect(() => {
    const fetchGlobalCategories = async () => {
      setLoadingGlobal(true);
      try {
        const response = await axios.get('https://fin-tracker-ncbx.onrender.com/api/getcategories');
        const fetchedCategories = response.data.data || [];
        setGlobalCategories(fetchedCategories);
        const initialVisibleItems = fetchedCategories.reduce((acc, category) => {
          const typeKey = category.categoryType || 'Uncategorized';
          if (!acc[typeKey]) {
            acc[typeKey] = 12;
          }
          return acc;
        }, {});
        setVisibleGlobalItems(initialVisibleItems);
      } catch (error) {
        console.error('Error fetching global categories:', error);
        showSnackbar('Failed to load global categories.', 'error');
      } finally {
        setLoadingGlobal(false);
      }
    };
    fetchGlobalCategories();
  }, []);

  // Fetch User-Specific Categories
  useEffect(() => {
    const fetchUserCategories = async () => {
      const token = getToken();
      if (!token) {
        setLoadingUserSpecific(false);
        return;
      }
      setLoadingUserSpecific(true);
      try {
        const response = await axios.get('https://fin-tracker-ncbx.onrender.com/api/getUserCategories', {
          headers: { Auth: `Bearer ${token}` },
        });
        const fetchedUserCategories = response.data.data || [];
        setUserCategories(fetchedUserCategories);
         const initialVisibleItems = fetchedUserCategories.reduce((acc, category) => {
          const typeKey = category.type || 'Uncategorized'; // Use 'type' field from UserCategory schema
          if (!acc[typeKey]) {
            acc[typeKey] = 12;
          }
          return acc;
        }, {});
        setVisibleUserItems(initialVisibleItems);
      } catch (error) {
        console.error('Error fetching user-specific categories:', error);
        showSnackbar('Failed to load your personal categories.', 'error');
      } finally {
        setLoadingUserSpecific(false);
      }
    };
    fetchUserCategories();
  }, [getToken]);

  // Fetch User's Card (List of selected GLOBAL categories)
  useEffect(() => {
    const fetchUserCard = async () => {
      const token = getToken();
      if (!token) {
        setLoadingUserCard(false);
        return;
      }
      setLoadingUserCard(true);
      try {
        const response = await axios.get('https://fin-tracker-ncbx.onrender.com/api/getUserCard', {
          headers: { Auth: `Bearer ${token}` },
        });
        if (response.data && response.data.carduser) {
          const ids = new Set(response.data.carduser.map(item => item.categoryId));
          setUserCardCategoryIds(ids);
        }
      } catch (error) {
        console.error('Error fetching user card:', error);
      } finally {
        setLoadingUserCard(false);
      }
    };
    fetchUserCard();
  }, [getToken]);

  const showSnackbar = (message, severity = 'success') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const handleSnackbarClose = (event, reason) => {
    if (reason === 'clickaway') return;
    setSnackbarOpen(false);
  };

  // Add GLOBAL Category to User's Card
  const handleAddToCard = async (categoryId, categoryName) => {
    const token = getToken();
    if (!token) {
      showSnackbar('Please log in to add categories.', 'error');
      return;
    }
    try {
      await axios.post('https://fin-tracker-ncbx.onrender.com/api/addToCard',
        { CategoriesId: categoryId },
        { headers: { Auth: `Bearer ${token}` } }
      );
      setUserCardCategoryIds(prev => new Set(prev).add(categoryId));
      showSnackbar(`Global category '${categoryName}' added to your list.`, 'success');
    } catch (error) {
      console.error('Error adding to card:', error);
      const errorMsg = error.response?.data?.error || 'Failed to add category.';
      showSnackbar(errorMsg, 'error');
    }
  };

  // Remove GLOBAL Category from User's Card
  const handleRemoveFromCard = async (categoryId, categoryName) => {
    const token = getToken();
    if (!token) {
      showSnackbar('Please log in to remove categories.', 'error');
      return;
    }
    try {
      await axios.delete('https://fin-tracker-ncbx.onrender.com/api/deleteFromCard', {
        headers: { Auth: `Bearer ${token}` },
        data: { categoryId: categoryId }
      });
      setUserCardCategoryIds(prev => {
        const next = new Set(prev);
        next.delete(categoryId);
        return next;
      });
      showSnackbar(`Global category '${categoryName}' removed from your list.`, 'success');
    } catch (error) {
      console.error('Error removing from card:', error);
      const errorMsg = error.response?.data?.error || 'Failed to remove category.';
      showSnackbar(errorMsg, 'error');
    }
  };

  // Open Budget Item Dialog (Works for both global and user-specific)
  const handleClickOpenBudgetDialog = (category) => {
    setSelectedCategory(category);
    setOpenBudgetDialog(true);
    setBudgetErrorMessage('');
    setValue('');
    setSelectedDate('');
  };

  const handleCloseBudgetDialog = () => {
    setOpenBudgetDialog(false);
    setSelectedCategory(null);
    setValue('');
    setSelectedDate('');
    setBudgetErrorMessage('');
  };

  // Submit Budget Item (Works for both global and user-specific)
  const handleSubmitBudgetItem = async () => {
    if (!selectedCategory || !value || !selectedDate) {
      setBudgetErrorMessage('Please enter a valid value and select a date.');
      return;
    }
    const parsedValue = parseFloat(value);
    if (isNaN(parsedValue) || parsedValue < 0) {
      setBudgetErrorMessage('Please enter a non-negative decimal number.');
      return;
    }

    const currentCategory = selectedCategory;
    // Backend handles checking if the ID is global or user-specific
    const submissionData = {
        CategoriesId: currentCategory._id, // Send the _id of the selected category
        valueitem: parsedValue,
        date: selectedDate,
    };

    setIsSubmittingBudget(true);
    const token = getToken();

    try {
      const response = await axios.post(
        'https://fin-tracker-ncbx.onrender.com/api/addBudget',
        submissionData,
        { headers: { Auth: `Bearer ${token}`, 'Content-Type': 'application/json' } }
      );
      console.log('Budget Response:', response.data);
      showSnackbar(`Budget item for '${currentCategory.name || currentCategory.categoryName}' added successfully!`, 'success'); // Use 'name' for user cats, 'categoryName' for global
      handleCloseBudgetDialog();
    } catch (error) {
      console.error('Error submitting budget value:', error);
      const errorMsg = error.response?.data?.error || 'Failed to submit budget item.';
      setBudgetErrorMessage(errorMsg);
    } finally {
      setIsSubmittingBudget(false);
    }
  };

  // Load More Global Categories
  const handleLoadMoreGlobal = (type) => {
    setVisibleGlobalItems((prev) => ({
      ...prev,
      [type]: (prev[type] || 0) + 10,
    }));
  };
  // Load More User Categories
  const handleLoadMoreUser = (type) => {
    setVisibleUserItems((prev) => ({
      ...prev,
      [type]: (prev[type] || 0) + 10,
    }));
  };

  // --- Add New USER Category Dialog Logic (Modified for Base64) ---
  const handleNewUserCategoryDialogOpen = () => {
    setNewUserCategoryDialogOpen(true);
    setNewUserCategoryErrorMessage('');
    setNewCategoryName('');
    setNewCategoryType('');
    setNewCategoryImageBase64(null); // Reset Base64 state
    // Reset file input visually if needed
    const fileInput = document.getElementById('new-category-image-input');
    if (fileInput) fileInput.value = '';
  };

  const handleNewUserCategoryDialogClose = () => {
    setNewUserCategoryDialogOpen(false);
    // Clear state on close
    setNewCategoryName('');
    setNewCategoryType('');
    setNewCategoryImageBase64(null);
    setNewUserCategoryErrorMessage('');
  };

  // Modified to convert image to Base64
  const handleImageChange = (event) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewCategoryImageBase64(reader.result); // Store the Base64 string
      };
      reader.onerror = (error) => {
        console.error('Error reading file:', error);
        setNewUserCategoryErrorMessage('Failed to read image file.');
        setNewCategoryImageBase64(null);
      };
      reader.readAsDataURL(file);
    } else {
      setNewCategoryImageBase64(null);
    }
  };

  // Modified to send JSON with Base64 image
  const handleNewUserCategorySubmit = async () => {
    if (!newCategoryName || !newCategoryType) {
      setNewUserCategoryErrorMessage('Please fill in category name and type.');
      return;
    }
    setIsSubmittingNewUserCategory(true);
    setNewUserCategoryErrorMessage(''); // Clear previous errors
    const token = getToken();

    // Prepare JSON payload
    const payload = {
      categoryName: newCategoryName,
      categoryType: newCategoryType, // 'revenues' or 'expenses'
      image: newCategoryImageBase64, // Send Base64 string or null
    };

    try {
      // Call the backend endpoint for adding user-specific categories with JSON
      const response = await axios.post(
        'https://fin-tracker-ncbx.onrender.com/api/addUserCategory',
        payload, // Send JSON data
        {
          headers: {
            Auth: `Bearer ${token}`,
            'Content-Type': 'application/json', // Set content type to JSON
          },
        }
      );
      console.log('New User Category Response:', response.data);
      const newCat = response.data.data;
      // Add the new category to the userCategories state
      // Ensure the new category object includes the 'image' field (which should be the base64 string if provided)
      setUserCategories((prev) => [...prev, newCat]);
      showSnackbar(`Your category '${newCat.name}' created successfully.`, 'success');
      handleNewUserCategoryDialogClose();
    } catch (error) {
      console.error('Error adding user category:', error);
      const errorMsg = error.response?.data?.error || 'Failed to create your category.';
      setNewUserCategoryErrorMessage(errorMsg); // Show error in the dialog
    } finally {
      setIsSubmittingNewUserCategory(false);
    }
  };

  // --- End Add New USER Category Dialog Logic ---

  const globalCategoryOptions = globalCategories.map((cat) => cat.categoryName);
  const userCategoryOptions = userCategories.map((cat) => cat.name);
  const allCategoryNames = [...new Set([...globalCategoryOptions, ...userCategoryOptions])]; // Unique names for search

  // Combined loading state
  const isLoading = loadingGlobal || loadingUserSpecific || loadingUserCard;
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: `linear-gradient(135deg, ${originalThemeColors.backgroundGradientStart} 0%, ${originalThemeColors.backgroundGradientEnd} 100%)` }}>
        <CircularProgress sx={{ color: originalThemeColors.primaryAccent }} size={60} />
        <Typography variant="h6" sx={{ color: originalThemeColors.textPrimary, ml: 2 }}>
          Loading Dashboard...
        </Typography>
      </Box>
    );
  }

  // Filtering logic - Applied to both global and user categories separately
  const filterCategories = (categoriesList, query, typeFilter) => {
      let filtered = categoriesList.filter((category) =>
        (category.name || category.categoryName).toLowerCase().includes(query.toLowerCase())
      );

      const backendTypeFilter = typeFilter === 'revenues' ? 'revenues' : (typeFilter === 'expenses' ? 'expenses' : 'all');

      if (backendTypeFilter === 'revenues') {
          filtered = filtered.filter(
            (category) => (category.type || category.categoryType)?.toLowerCase() === 'revenues'
          );
      } else if (backendTypeFilter === 'expenses') {
          filtered = filtered.filter((category) =>
            (category.type || category.categoryType)?.toLowerCase() === 'expenses'
          );
      }
      return filtered;
  };

  const filteredGlobalCategories = filterCategories(globalCategories, searchQuery, filterType);
  const filteredUserCategories = filterCategories(userCategories, searchQuery, filterType);

  const groupCategories = (categoriesList) => {
      return categoriesList.reduce((acc, category) => {
        const typeKey = (category.type || category.categoryType) || 'Uncategorized'; // Use 'type' for user, 'categoryType' for global
        if (!acc[typeKey]) {
          acc[typeKey] = [];
        }
        acc[typeKey].push(category);
        return acc;
      }, {});
  };

  const groupedGlobalCategories = groupCategories(filteredGlobalCategories);
  const groupedUserCategories = groupCategories(filteredUserCategories);

  // Helper to display category type consistently as Revenues/Expenses
  const getDisplayCategoryType = (type) => {
      if (!type) return 'Uncategorized';
      // Check if type is 'revenues' or 'expenses' (user) or starts with 'expens' (global)
      const lowerType = type.toLowerCase();
      return lowerType === 'expenses' || lowerType.startsWith('expens') ? 'Expenses' : 'Revenues';
  };

  const getCategoryIcon = (type) => {
      if (!type) return '❓';
      const lowerType = type.toLowerCase();
      return lowerType === 'expenses' || lowerType.startsWith('expens') ? '💸' : '💰';
  };

  // Helper function to render a category section (either global or user-specific)
  const renderCategorySection = (title, categoriesMap, visibleItemsMap, loadMoreHandler, isUserSpecificSection = false) => {
    const hasContent = Object.keys(categoriesMap).length > 0 && Object.values(categoriesMap).some(arr => arr.length > 0);

    if (!hasContent && searchQuery) return null; // Don't show section title if search yields no results for it
    if (!hasContent && !searchQuery && filterType !== 'all') return null; // Don't show section if filter yields no results
    if (!hasContent && !searchQuery && filterType === 'all' && !isUserSpecificSection && globalCategories.length === 0) return null; // Hide global if empty
    if (!hasContent && !searchQuery && filterType === 'all' && isUserSpecificSection && userCategories.length === 0) return null; // Hide user if empty

    return (
      <Box sx={{ mb: 6 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: isUserSpecificSection ? '#9C27B0' : originalThemeColors.primaryAccent, mb: 4, borderBottom: `3px solid ${isUserSpecificSection ? '#9C27B0' : originalThemeColors.primaryAccent}`, pb: 1 }}>
          {title}
        </Typography>
        {Object.keys(categoriesMap).length === 0 ? (
           <Typography variant="h6" align="center" sx={{ color: originalThemeColors.textSecondary, mt: 4, fontStyle: 'italic' }}>
             No {isUserSpecificSection ? 'personal' : 'global'} categories found matching your criteria.
           </Typography>
        ) : (
          Object.keys(categoriesMap).map((type) => (
            categoriesMap[type].length > 0 && (
              <Box key={`${title}-${type}`} sx={{ mb: { xs: 5, sm: 8 } }}>
                <Typography
                  variant="h5" // Slightly smaller than section title
                  sx={{
                    backgroundColor: alpha(isUserSpecificSection ? '#9C27B0' : originalThemeColors.primaryAccent, 0.15),
                    color: isUserSpecificSection ? '#9C27B0' : originalThemeColors.primaryAccent,
                    p: { xs: 1.5, sm: 2 },
                    borderRadius: '8px',
                    mb: { xs: 3, sm: 4 },
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    fontWeight: 'bold',
                  }}
                >
                  {getCategoryIcon(type)} {getDisplayCategoryType(type)}
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
                  {categoriesMap[type]
                    .slice(0, visibleItemsMap[type] || 12)
                    .map((category) => {
                      const categoryId = category._id;
                      const categoryName = category.name || category.categoryName; // Use 'name' for user, 'categoryName' for global
                      const categoryType = category.type || category.categoryType;
                      const categoryImage = category.image; // Both schemas use 'image'
                      const isInUserCard = !isUserSpecificSection && userCardCategoryIds.has(categoryId); // Only applicable to global categories

                      return (
                        <Tooltip key={categoryId} title={`Click to add budget item for ${categoryName}`}>
                          <Box sx={{ display: 'flex', justifyContent: 'center', position: 'relative' }}>
                            <CategoryCard
                              type={categoryType}
                              isInUserCard={isInUserCard} // Used for border if global & selected
                              isUserSpecific={isUserSpecificSection} // Used for border if user-specific
                              component="div"
                              role="button"
                              tabIndex={0}
                              onClick={() => handleClickOpenBudgetDialog(category)} // Pass the whole category object
                              onKeyPress={(e) => {
                                  if (e.key === 'Enter' || e.key === ' ') {
                                    handleClickOpenBudgetDialog(category);
                                  }
                                }}
                              sx={{ minWidth: 0 }}
                            >
                              {/* Add/Remove button only for Global categories */}
                              {!isUserSpecificSection && (
                                <Tooltip title={isInUserCard ? `Remove '${categoryName}' from My List` : `Add '${categoryName}' to My List`}>
                                  <AddRemoveButton
                                    size="small"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (isInUserCard) {
                                        handleRemoveFromCard(categoryId, categoryName);
                                      } else {
                                        handleAddToCard(categoryId, categoryName);
                                      }
                                    }}
                                    aria-label={isInUserCard ? 'Remove from my list' : 'Add to my list'}
                                  >
                                    {isInUserCard ? <RemoveCircleOutlineIcon fontSize="inherit" sx={{ color: originalThemeColors.expense }} /> : <AddCircleOutlineIcon fontSize="inherit" sx={{ color: originalThemeColors.income }} />}
                                  </AddRemoveButton>
                                </Tooltip>
                              )}
                              {/* Optional: Add a delete button for user-specific categories here */}

                              {categoryImage && (
                                <Box
                                  component="img"
                                  src={
                                    // Handle both relative paths (from backend uploads) and potential absolute URLs/base64
                                    categoryImage.startsWith('data:') || categoryImage.startsWith('http')
                                      ? categoryImage
                                      : `https://fin-tracker-ncbx.onrender.com/${categoryImage}` // Assuming backend serves uploads from root
                                  }
                                  alt={categoryName}
                                  sx={{
                                    width: { xs: 60, sm: 70, md: 80 },
                                    height: { xs: 60, sm: 70, md: 80 },
                                    borderRadius: '50%',
                                    mb: 1.5,
                                    objectFit: 'cover',
                                    border: `2px solid ${alpha(isUserSpecificSection ? '#9C27B0' : originalThemeColors.primaryAccent, 0.3)}`,
                                  }}
                                  onError={(e) => { e.target.style.display = 'none'; }}
                                />
                              )}
                              <Typography variant="h6" sx={{ color: isUserSpecificSection ? '#9C27B0' : originalThemeColors.primaryAccent, fontWeight: 600, fontSize: {xs: '0.9rem', sm: '1rem', md: '1.1rem'} }}>
                                {categoryName}
                              </Typography>
                            </CategoryCard>
                          </Box>
                        </Tooltip>
                      );
                    })}
                </Box>

                {categoriesMap[type].length > (visibleItemsMap[type] || 12) && (
                  <Box sx={{ textAlign: 'center', mt: { xs: 3, sm: 4 } }}>
                    <Button
                      onClick={() => loadMoreHandler(type)}
                      variant="contained"
                      sx={{
                        backgroundColor: isUserSpecificSection ? '#9C27B0' : originalThemeColors.primaryAccent,
                        color: originalThemeColors.buttonTextLight,
                        px: 4,
                        py: 1.5,
                        borderRadius: '8px',
                        fontSize: { xs: '0.9rem', sm: '1rem' },
                        fontWeight: 600,
                        transition: 'background-color 0.3s ease, transform 0.2s ease',
                        '&:hover': {
                          backgroundColor: alpha(isUserSpecificSection ? '#9C27B0' : originalThemeColors.primaryAccent, 0.85),
                          transform: 'scale(1.03)',
                        },
                      }}
                    >
                      Load More
                    </Button>
                  </Box>
                )}
              </Box>
            )
          ))
        )}
      </Box>
    );
  };

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
        options={allCategoryNames} // Search across all names
        inputValue={searchQuery}
        onInputChange={(event, newInputValue) => {
          setSearchQuery(newInputValue);
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            label="Search Categories"
            variant="outlined"
            fullWidth
            sx={{
              mb: { xs: 3, sm: 4 },
              '& .MuiOutlinedInput-root': {
                borderRadius: '12px',
                backgroundColor: originalThemeColors.inputBackground,
                '& fieldset': {
                  borderColor: originalThemeColors.borderColor,
                },
                '&:hover fieldset': {
                  borderColor: originalThemeColors.primaryAccent,
                },
                '&.Mui-focused fieldset': {
                  borderColor: originalThemeColors.primaryAccent,
                  borderWidth: '2px',
                },
              },
              '& .MuiInputLabel-root': {
                color: originalThemeColors.textSecondary,
              },
              '& .MuiInputLabel-root.Mui-focused': {
                color: originalThemeColors.primaryAccent,
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
                <InputAdornment position="end">
                  {searchQuery && (
                    <IconButton
                      aria-label="clear search"
                      onClick={() => setSearchQuery('')}
                      edge="end"
                      size="small"
                    >
                      <ClearIcon sx={{ color: originalThemeColors.textSecondary }} />
                    </IconButton>
                  )}
                </InputAdornment>
              ),
            }}
          />
        )}
      />

      {/* Filter Buttons */}
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: { xs: 4, sm: 6 }, flexWrap: 'wrap', gap: 1.5 }}>
        <ButtonGroup variant="outlined" aria-label="filter category type">
          <Button
            onClick={() => setFilterType('all')}
            variant={filterType === 'all' ? 'contained' : 'outlined'}
            sx={{ borderRadius: '8px 0 0 8px', borderColor: originalThemeColors.primaryAccent, ...(filterType === 'all' && { backgroundColor: originalThemeColors.primaryAccent, color: originalThemeColors.white }) }}
          >
            All
          </Button>
          <Button
            onClick={() => setFilterType('revenues')}
            variant={filterType === 'revenues' ? 'contained' : 'outlined'}
            sx={{ borderColor: originalThemeColors.primaryAccent, ...(filterType === 'revenues' && { backgroundColor: originalThemeColors.income, color: originalThemeColors.white }) }}
          >
            Revenues
          </Button>
          <Button
            onClick={() => setFilterType('expenses')}
            variant={filterType === 'expenses' ? 'contained' : 'outlined'}
            sx={{ borderRadius: '0 8px 8px 0', borderColor: originalThemeColors.primaryAccent, ...(filterType === 'expenses' && { backgroundColor: originalThemeColors.expense, color: originalThemeColors.white }) }}
          >
            Expenses
          </Button>
        </ButtonGroup>
      </Box>

      {/* Render User-Specific Categories Section */}
      {renderCategorySection(
        'Your Personal Categories',
        groupedUserCategories,
        visibleUserItems,
        handleLoadMoreUser,
        true // Mark as user-specific section
      )}

      {/* Render Global Categories Section */}
      {renderCategorySection(
        'Global Categories',
        groupedGlobalCategories,
        visibleGlobalItems,
        handleLoadMoreGlobal,
        false // Mark as not user-specific
      )}

      {/* Floating Action Button to Add User Category */}
      <Tooltip title="Add Your Own Category">
        <Fab
          color="secondary" // Use secondary color for FAB
          aria-label="add user category"
          onClick={handleNewUserCategoryDialogOpen}
          sx={{
            position: 'fixed',
            bottom: { xs: 20, sm: 30 },
            right: { xs: 20, sm: 30 },
            backgroundColor: '#9C27B0', // Match user-specific color
            color: originalThemeColors.white,
            animation: `${floatAnimation} 3s ease-in-out infinite`,
            '&:hover': {
              backgroundColor: alpha('#9C27B0', 0.85),
            }
          }}
        >
          <AddIcon />
        </Fab>
      </Tooltip>

      {/* Budget Item Dialog */}
      <Dialog
        open={openBudgetDialog}
        onClose={handleCloseBudgetDialog}
        PaperProps={{
          sx: {
            borderRadius: '16px',
            backgroundColor: originalThemeColors.dialogSurface,
            boxShadow: `0 8px 32px ${alpha(originalThemeColors.primaryAccent, 0.2)}`,
            width: { xs: '90%', sm: '450px' },
            maxWidth: 'none',
          }
        }}
      >
        <DialogTitle sx={{ backgroundColor: originalThemeColors.primaryAccent, color: originalThemeColors.white, borderTopLeftRadius: '16px', borderTopRightRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2 }}>
          <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>
            Add Budget for {selectedCategory?.name || selectedCategory?.categoryName}
          </Typography>
          <IconButton onClick={handleCloseBudgetDialog} size="small" sx={{ color: originalThemeColors.white }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 3, pb: 2, px: { xs: 2, sm: 3 } }}>
          {budgetErrorMessage && (
            <Alert severity="error" sx={{ mb: 2 }}>{budgetErrorMessage}</Alert>
          )}
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
              startAdornment: <InputAdornment position="start"><AccountBalanceWalletIcon /></InputAdornment>,
            }}
            sx={{ mb: 2.5 }}
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
            sx={{ mb: 1 }}
          />
        </DialogContent>
        <DialogActions sx={{ p: { xs: 2, sm: 3 }, borderTop: `1px solid ${originalThemeColors.borderColor}` }}>
          <Button onClick={handleCloseBudgetDialog} sx={{ color: originalThemeColors.textSecondary, borderRadius: '8px' }}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmitBudgetItem}
            variant="contained"
            disabled={isSubmittingBudget}
            startIcon={isSubmittingBudget ? <CircularProgress size={20} color="inherit" /> : <CheckCircleOutlineIcon />}
            sx={{
              backgroundColor: originalThemeColors.primaryAccent,
              color: originalThemeColors.white,
              borderRadius: '8px',
              px: 3,
              '&:hover': {
                backgroundColor: alpha(originalThemeColors.primaryAccent, 0.85),
              }
            }}
          >
            {isSubmittingBudget ? 'Adding...' : 'Add Budget Item'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add New User Category Dialog (Modified) */}
      <Dialog
        open={newUserCategoryDialogOpen}
        onClose={handleNewUserCategoryDialogClose}
        PaperProps={{
          sx: {
            borderRadius: '16px',
            backgroundColor: originalThemeColors.dialogSurface,
            boxShadow: `0 8px 32px ${alpha('#9C27B0', 0.2)}`,
            width: { xs: '90%', sm: '500px' },
            maxWidth: 'none',
          }
        }}
      >
        <DialogTitle sx={{ backgroundColor: '#9C27B0', color: originalThemeColors.white, borderTopLeftRadius: '16px', borderTopRightRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2 }}>
          <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>
            Add Your Personal Category
          </Typography>
          <IconButton onClick={handleNewUserCategoryDialogClose} size="small" sx={{ color: originalThemeColors.white }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 3, pb: 2, px: { xs: 2, sm: 3 } }}>
          {newUserCategoryErrorMessage && (
            <Alert severity="error" sx={{ mb: 2 }}>{newUserCategoryErrorMessage}</Alert>
          )}
          <TextField
            autoFocus
            margin="dense"
            id="new-category-name"
            label="Category Name"
            type="text"
            fullWidth
            variant="outlined"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            sx={{ mb: 2.5 }}
          />
          <FormControl fullWidth variant="outlined" sx={{ mb: 2.5 }}>
            <InputLabel id="new-category-type-label">Category Type</InputLabel>
            <Select
              labelId="new-category-type-label"
              id="new-category-type"
              value={newCategoryType}
              onChange={(e) => setNewCategoryType(e.target.value)}
              label="Category Type"
            >
              <MenuItem value=""><em>Select Type</em></MenuItem>
              <MenuItem value="revenues">Revenues (Income)</MenuItem>
              <MenuItem value="expenses">Expenses</MenuItem>
            </Select>
          </FormControl>
          <Button
            variant="outlined"
            component="label"
            fullWidth
            sx={{ mb: 1, borderColor: originalThemeColors.borderColor, color: originalThemeColors.textSecondary }}
          >
            Upload Image (Optional)
            <input
              id="new-category-image-input"
              type="file"
              hidden
              accept="image/*"
              onChange={handleImageChange} // Uses the modified handler
            />
          </Button>
          {newCategoryImageBase64 && (
            <Box sx={{ mt: 1, textAlign: 'center' }}>
              <Typography variant="caption" sx={{ color: originalThemeColors.textSecondary }}>Image Preview:</Typography>
              <Box
                component="img"
                src={newCategoryImageBase64} // Display the Base64 preview
                alt="Preview"
                sx={{ display: 'block', maxWidth: '100px', maxHeight: '100px', margin: '8px auto 0', borderRadius: '4px', border: `1px solid ${originalThemeColors.borderColor}` }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: { xs: 2, sm: 3 }, borderTop: `1px solid ${originalThemeColors.borderColor}` }}>
          <Button onClick={handleNewUserCategoryDialogClose} sx={{ color: originalThemeColors.textSecondary, borderRadius: '8px' }}>
            Cancel
          </Button>
          <Button
            onClick={handleNewUserCategorySubmit} // Uses the modified handler
            variant="contained"
            disabled={isSubmittingNewUserCategory}
            startIcon={isSubmittingNewUserCategory ? <CircularProgress size={20} color="inherit" /> : <AddCircleIcon />}
            sx={{
              backgroundColor: '#9C27B0',
              color: originalThemeColors.white,
              borderRadius: '8px',
              px: 3,
              '&:hover': {
                backgroundColor: alpha('#9C27B0', 0.85),
              }
            }}
          >
            {isSubmittingNewUserCategory ? 'Adding...' : 'Add Category'}
          </Button>
        </DialogActions>
      </Dialog>

    </Container>
  );
};

export default DashboardUser;

