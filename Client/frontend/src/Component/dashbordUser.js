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
  const [open, setOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [value, setValue] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [visibleItems, setVisibleItems] = useState({});
  const [errorMessage, setErrorMessage] = useState('');
  const [scale, setScale] = useState(1); // Title scale effect
  const [searchQuery, setSearchQuery] = useState('');
  const [addedItems, setAddedItems] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [newDialogOpen, setNewDialogOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryType, setNewCategoryType] = useState('');
  const [newCategoryImage, setNewCategoryImage] = useState(null);
  const [newErrorMessage, setNewErrorMessage] = useState('');
  const [isNewSubmitting, setIsNewSubmitting] = useState(false);

  const isSmallDevice = useMediaQuery('(max-width:600px)'); // Adjusted breakpoint for small device grid
  const isMediumDevice = useMediaQuery('(max-width:900px)'); // Breakpoint for potentially 3-4 cards

  useEffect(() => {
    const fetchCategories = async () => {
      setLoading(true); // Start loading
      const token = sessionStorage.getItem('jwt'); // Get token

      try {
        // Fetch general categories
        const generalCategoriesResponse = await axios.get('https://fin-tracker-ncbx.onrender.com/api/getcategories');
        const generalCategories = generalCategoriesResponse.data.data || [];

        let userCategories = [];
        if (token) {
          try {
            // Fetch user-specific categories if token exists
            const userCategoriesResponse = await axios.get(
              'https://fin-tracker-ncbx.onrender.com/api/getUserCategories',
              {
                headers: {
                  Auth: `Bearer ${token}`,
                },
              }
            );
            userCategories = userCategoriesResponse.data.data || [];
          } catch (userError) {
            console.error('Error fetching user categories:', userError);
            // Handle potential errors like invalid token, maybe clear session?
            // For now, just log the error and proceed with general categories
          }
        }

        // Merge categories - using Set to avoid duplicates based on _id
        const allCategoriesMap = new Map();
        generalCategories.forEach(cat => allCategoriesMap.set(cat._id, cat));
        userCategories.forEach(cat => allCategoriesMap.set(cat._id, cat)); // Overwrites general if ID matches, or adds if new
        const mergedCategories = Array.from(allCategoriesMap.values());

        setCategories(mergedCategories);

        // Recalculate initialVisibleItems based on merged categories
        const initialVisibleItems = mergedCategories.reduce((acc, category) => {
          if (!acc[category.categoryType]) {
            acc[category.categoryType] = 12; // Or 10
          }
          return acc;
        }, {});
        setVisibleItems(initialVisibleItems);

      } catch (error) {
        console.error('Error fetching initial categories:', error);
      } finally {
        setLoading(false); // Stop loading regardless of success or error
      }
    };

    fetchCategories();
  }, []); // Empty dependency array means this runs once on mount


  const handleClickOpen = (category) => {
    if (addedItems.includes(category._id)) return;
    setSelectedCategory(category);
    setOpen(true);
    setErrorMessage('');
    setSelectedDate('');
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

      console.log('Response:', response.data);
      setAddedItems((prev) => [...prev, currentCategory._id]);
    } catch (error) {
      if (error.response && error.response.status === 400) {
        console.error(error.response.data.error || 'You have already added this item on this date.');
        setAddedItems((prev) => [...prev, currentCategory._id]);
      } else {
        console.error('Error submitting value:', error);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLoadMore = (type) => {
    setVisibleItems((prev) => ({
      ...prev,
      [type]: prev[type] + 10, // Load 10 more (2 rows of 5)
    }));
  };

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
    if (!acc[category.categoryType]) {
      acc[category.categoryType] = [];
    }
    acc[category.categoryType].push(category);
    return acc;
  }, {});

  const getCategoryIcon = (type) =>
    type && type.toLowerCase().startsWith('expens') ? '💸' : '💰';

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
    const token = sessionStorage.getItem('jwt');

    // Ensure token exists before proceeding
    if (!token) {
        setNewErrorMessage('Authentication error. Please log in again.');
        setIsNewSubmitting(false);
        return;
    }

    const formData = new FormData();
    formData.append('categoryName', newCategoryName);
    formData.append('categoryType', newCategoryType);
    if (newCategoryImage) {
      formData.append('image', newCategoryImage);
    }

    try {
      const response = await axios.post(
        'https://fin-tracker-ncbx.onrender.com/api/addUserCategory', // Correct endpoint for user categories
        formData,
        {
          headers: {
            Auth: `Bearer ${token}`, // Send JWT token
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      console.log('New Category Response:', response.data);
      // Add the new category to the existing list immediately
      setCategories((prev) => [...prev, response.data.data]);
      handleNewDialogClose();
    } catch (error) {
      console.error('Error adding new category:', error);
      setNewErrorMessage('An error occurred while adding the category.');
    } finally {
      setIsNewSubmitting(false);
    }
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
        options={categoryOptions}
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
                fontSize: { xs: '0.9rem', sm: '1rem' },
                borderRight: index < 2 ? `1px solid ${alpha(originalThemeColors.primaryAccent, 0.3)}` : 'none',
                '&:last-child': {
                  borderTopRightRadius: '20px',
                  borderBottomRightRadius: '20px',
                },
                '&:first-of-type': {
                  borderTopLeftRadius: '20px',
                  borderBottomLeftRadius: '20px',
                },
              }}
            >
              {typeOption.label}
            </Button>
          ))}
        </ButtonGroup>
      </Box>

      {Object.keys(groupedCategories).length === 0 ? (
        <Typography variant="h6" sx={{ textAlign: 'center', color: originalThemeColors.textSecondary, mt: 5 }}>
          No categories found matching your criteria.
        </Typography>
      ) : (
        Object.entries(groupedCategories).map(([type, items]) => (
          <Box key={type} sx={{ mb: { xs: 4, sm: 6 } }}>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 'bold',
                color: originalThemeColors.primaryAccent,
                mb: { xs: 3, sm: 4 },
                textAlign: 'center',
                textTransform: 'capitalize',
                borderBottom: `2px solid ${alpha(originalThemeColors.primaryAccent, 0.3)}`,
                pb: 1,
                display: 'inline-block',
              }}
            >
              {type.replace(/([A-Z])/g, ' $1').trim()} {getCategoryIcon(type)}
            </Typography>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: {
                  xs: 'repeat(auto-fit, minmax(140px, 1fr))', // Fit more on small screens
                  sm: 'repeat(auto-fit, minmax(160px, 1fr))',
                  md: 'repeat(5, 1fr)', // Aim for 5 on medium and up
                },
                gap: { xs: 2, sm: 3, md: 4 }, // Responsive gap
                justifyContent: 'center',
              }}
            >
              {items
                .slice(0, visibleItems[type] || 12)
                .map((category, index) => {
                  const isAdded = addedItems.includes(category._id);
                  return (
                    <Tooltip
                      key={category._id}
                      title={isAdded ? 'Value already added for today' : `Add value for ${category.categoryName}`}
                      arrow
                      placement="top"
                    >
                      <Box sx={{ animationDelay: `${index * 0.05}s` }}>
                        <CategoryCard
                          type={category.categoryType}
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
                            // Ensure cards can shrink if needed to fit 5 across, or adjust CategoryCard width
                            minWidth: 0,
                          }}
                          aria-disabled={isAdded}
                        >
                          {category.image && (
                            <Box
                              component="img"
                              src={
                                category.image.startsWith('data:')
                                  ? category.image
                                  : `https://fin-tracker-ncbx.onrender.com/${category.image}`
                              }
                              alt={category.categoryName}
                              sx={{
                                width: { xs: 60, sm: 70, md: 80 }, // Adjusted image size for card changes
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
            {items.length > (visibleItems[type] || 12) && (
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
                selectedCategory.image.startsWith('data:')
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
            {isSubmitting ? <CircularProgress size={24} sx={{ color: originalThemeColors.buttonTextLight }} /> : 'Submit'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog for Adding New Category */}
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
          Add New Category
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
          <FormControl fullWidth sx={{
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
              '& .MuiSelect-icon': { color: originalThemeColors.textSecondary },
            }}>
            <InputLabel id="category-type-label">Category Type</InputLabel>
            <Select
              labelId="category-type-label"
              value={newCategoryType}
              label="Category Type"
              onChange={(e) => setNewCategoryType(e.target.value)}
              MenuProps={{
                PaperProps: {
                  sx: {
                    backgroundColor: originalThemeColors.surface,
                    color: originalThemeColors.textPrimary,
                    '& .MuiMenuItem-root:hover': {
                      backgroundColor: alpha(originalThemeColors.primaryAccent, 0.08),
                    },
                    '& .MuiMenuItem-root.Mui-selected': {
                      backgroundColor: alpha(originalThemeColors.primaryAccent, 0.15),
                      color: originalThemeColors.primaryAccent,
                    }
                  }
                }
              }}
            >
              <MenuItem value="Income">Income</MenuItem>
              <MenuItem value="Expenses">Expenses</MenuItem>
              {/* Add more types if needed */}
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
                background: alpha(originalThemeColors.primaryAccent, 0.08),
              }
            }}
          >
            Upload Image
            <input
              type="file"
              hidden
              accept="image/*"
              onChange={handleImageChange}
            />
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
          <Button
            onClick={handleNewDialogClose}
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
            onClick={handleNewCategorySubmit}
            variant="contained"
            disabled={isNewSubmitting}
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
            {isNewSubmitting ? <CircularProgress size={24} sx={{ color: originalThemeColors.buttonTextLight }} /> : 'Submit'}
          </Button>
        </DialogActions>
      </Dialog>

      <Fab
        aria-label="add new category"
        onClick={handleNewDialogOpen}
        sx={{
          position: 'fixed',
          bottom: { xs: 20, sm: 32 },
          right: { xs: 20, sm: 32 },
          backgroundColor: originalThemeColors.primaryAccent,
          color: originalThemeColors.buttonTextLight,
          width: { xs: 56, sm: 64 },
          height: { xs: 56, sm: 64 },
          boxShadow: `0 8px 25px ${alpha(originalThemeColors.primaryAccent, 0.3)}`,
          transition: 'transform 0.3s ease, box-shadow 0.3s ease, background-color 0.3s ease',
          '&:hover': {
            backgroundColor: alpha(originalThemeColors.primaryAccent, 0.85),
            transform: 'scale(1.1)',
            boxShadow: `0 12px 35px ${alpha(originalThemeColors.primaryAccent, 0.4)}`,
          },
        }}
      >
        <AddIcon sx={{ fontSize: { xs: 28, sm: 32} }} />
      </Fab>
    </Container>
  );
};

export default DashboardUser;

