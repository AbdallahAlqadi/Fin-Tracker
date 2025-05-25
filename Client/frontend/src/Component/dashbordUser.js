import React, { useState, useEffect } from 'react';
import axios from 'axios';
import imageCompression from 'browser-image-compression'; // <-- Import the library
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
  expense: '#FF5252', // Original Red for Expenses
  Revenuese: '#4CAF50', // Original Green for Revenuese
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

const CategoryCard = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'type',
})(({ theme, type }) => ({
  border: `2px solid ${type === 'Expenses' ? originalThemeColors.expense : originalThemeColors.Revenuese}`,
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
  [theme.breakpoints.between('md', 'lg')]: {
    width: '170px',
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
  const [isSubmitting, setIsSubmitting] = useState(false); // For adding budget
  const [filterType, setFilterType] = useState('all');
  const [newDialogOpen, setNewDialogOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryType, setNewCategoryType] = useState('');
  const [newCategoryImage, setNewCategoryImage] = useState(null); // Will store the compressed File object
  const [newErrorMessage, setNewErrorMessage] = useState('');
  const [isNewSubmitting, setIsNewSubmitting] = useState(false); // For adding category (includes compression)
  const [isCompressing, setIsCompressing] = useState(false); // Specific state for compression loading

  const isSmallDevice = useMediaQuery('(max-width:600px)'); // Adjusted breakpoint for small device grid
  const isMediumDevice = useMediaQuery('(max-width:900px)'); // Breakpoint for potentially 3-4 cards

  // --- NEW: Function to fetch user-specific cards --- 
  const fetchUserCards = async () => {
    const token = sessionStorage.getItem('jwt');
    if (!token) {
        console.warn('No JWT token found for fetching user cards.');
        return []; // Return empty array if no token
    }
    try {
      const response = await axios.get('http://127.0.0.1:5004/api/getUserCards', {
        headers: {
          Auth: `Bearer ${token}`,
        },
      });
      // The API returns an object with a 'carduser' array
      if (response.data && Array.isArray(response.data.carduser)) {
        return response.data.carduser;
      } else {
        console.error('Error fetching user cards: Invalid data format received', response.data);
        return [];
      }
    } catch (error) {
      if (error.response && error.response.status === 404) {
          console.log('No user-specific cards found.'); // Not necessarily an error
          return [];
      } else {
          console.error('Error fetching user cards:', error);
          return []; // Return empty array on error
      }
    }
  };

  // --- MODIFIED: Function to fetch general categories --- 
  const fetchCategories = async () => {
    try {
      const response = await axios.get('http://127.0.0.1:5004/api/getcategories');
      if (Array.isArray(response.data.data)) {
        return response.data.data;
      } else {
        console.error('Error fetching categories: Invalid data format received', response.data);
        return [];
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      return [];
    }
  };

  // --- MODIFIED: useEffect to fetch both and merge --- 
  useEffect(() => {
    const loadAllData = async () => {
      setLoading(true);
      try {
        // Fetch both sets of data concurrently
        const [generalCategories, userCards] = await Promise.all([
          fetchCategories(),
          fetchUserCards(),
        ]);

        // Merge and deduplicate categories
        const allCards = [...generalCategories, ...userCards];
        const uniqueCategoriesMap = new Map();
        allCards.forEach(card => {
          // Use _id for uniqueness check if available
          if (card._id) {
            if (!uniqueCategoriesMap.has(card._id)) {
              uniqueCategoriesMap.set(card._id, card);
            }
          } else {
            // Fallback if _id is missing (less reliable, e.g., for newly added cards before refetch)
            const key = `${card.categoryName}-${card.categoryType}`;
            if (!uniqueCategoriesMap.has(key)) {
                uniqueCategoriesMap.set(key, card);
            }
          }
        });

        const mergedCategories = Array.from(uniqueCategoriesMap.values());

        setCategories(mergedCategories);

        // Initialize visible items based on merged categories
        const initialVisibleItems = mergedCategories.reduce((acc, category) => {
          if (category.categoryType && !acc[category.categoryType]) {
            acc[category.categoryType] = 12; // Default visible count
          }
          return acc;
        }, {});
        setVisibleItems(initialVisibleItems);

      } catch (error) {
        // Handle any error from Promise.all or merging logic
        console.error('Error loading combined category data:', error);
        setCategories([]); // Set to empty on error
      } finally {
        setLoading(false);
      }
    };

    loadAllData(); // Call the combined loading function
  }, []); // Empty dependency array ensures it runs only once on mount

  // --- MODIFIED: handleNewCategorySubmit to refetch all data --- 
  const handleNewCategorySubmit = async () => {
    if (!newCategoryName || !newCategoryType) {
      setNewErrorMessage('Please fill in category name and type.');
      return;
    }
    if (isCompressing) {
        setNewErrorMessage('Please wait for image processing to complete.');
        return;
    }

    setIsNewSubmitting(true);
    setNewErrorMessage('');
    const token = sessionStorage.getItem('jwt');

    try {
        let imageBase64 = null;
        if (newCategoryImage) { 
            try {
                // Get the full data URL (includes prefix) from the compressed file
                imageBase64 = await imageCompression.getDataUrlFromFile(newCategoryImage);
            } catch (readError) {
                console.error('Error reading compressed file:', readError);
                setNewErrorMessage('Could not read the processed image data.');
                setIsNewSubmitting(false);
                return;
            }
        }

        const payload = {
            categoryName: newCategoryName,
            categoryType: newCategoryType,
            // Send the full data URI (or null) to the backend
            // The backend should ideally handle saving it appropriately (e.g., storing only base64 or the full URI)
            image: imageBase64, 
        };

        // Post to addCardToUser endpoint
        await axios.post(
            'http://127.0.0.1:5004/api/addCardToUser',
            payload,
            {
                headers: {
                    Auth: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        // --- REFETCH ALL DATA after successful add --- 
        // Re-run the combined loading logic from useEffect
        setLoading(true);
        try {
            const [generalCategories, userCards] = await Promise.all([
              fetchCategories(),
              fetchUserCards(),
            ]);
            const allCards = [...generalCategories, ...userCards];
            const uniqueCategoriesMap = new Map();
            allCards.forEach(card => {
              if (card._id) {
                if (!uniqueCategoriesMap.has(card._id)) {
                  uniqueCategoriesMap.set(card._id, card);
                }
              } else {
                const key = `${card.categoryName}-${card.categoryType}`;
                if (!uniqueCategoriesMap.has(key)) {
                    uniqueCategoriesMap.set(key, card);
                }
              }
            });
            const mergedCategories = Array.from(uniqueCategoriesMap.values());
            setCategories(mergedCategories);
            const initialVisibleItems = mergedCategories.reduce((acc, category) => {
              if (category.categoryType && !acc[category.categoryType]) {
                acc[category.categoryType] = 12;
              }
              return acc;
            }, {});
            setVisibleItems(initialVisibleItems);
        } catch (fetchError) {
            console.error('Error refetching data after add:', fetchError);
            // Optionally show an error message to the user
        } finally {
            setLoading(false);
        }
        // --------------------------------------------------

        handleNewDialogClose(); // Close dialog on success

    } catch (error) {
        console.error('Error adding new category:', error);
        if (error.code === 'ERR_NETWORK') {
             setNewErrorMessage('Network error. Please check your connection or the server status.');
        } else if (error.response) {
            if (error.response.status === 413) {
                setNewErrorMessage('Image is still too large even after compression. Try a smaller image or adjust compression settings.');
            } else {
                 // Display backend error message if available
                 const backendError = error.response.data?.error || error.response.statusText || 'Server error';
                 setNewErrorMessage(`Error: ${backendError}`);
            }
        } else {
            setNewErrorMessage('An unexpected error occurred while adding the category.');
        }
    } finally {
        setIsNewSubmitting(false);
    }
  };
  // --- END MODIFIED handleNewCategorySubmit --- 


  const handleClickOpen = (category) => {
    if (addedItems.includes(category._id)) return;
    setSelectedCategory(category);
    setOpen(true);
    setErrorMessage('');
    setSelectedDate('');
    setValue(''); // Reset value on opening dialog
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
        'http://127.0.0.1:5004/api/addBudget',
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

      console.log('Add Budget Response:', response.data);
      // Mark item as added visually
      setAddedItems((prev) => [...prev, currentCategory._id]);

    } catch (error) {
      console.error('Error submitting value:', error);
      if (error.response && error.response.status === 400) {
        setErrorMessage(error.response.data.error || 'You have already added this item on this date.');
        setAddedItems((prev) => [...prev, currentCategory._id]);
      } else if (error.code === 'ERR_NETWORK') {
          setErrorMessage('Network error. Could not submit budget.');
      } else {
        setErrorMessage('An unexpected error occurred while submitting.');
      }
      // Re-open dialog to show error
      setOpen(true);
      setSelectedCategory(currentCategory);
      setSelectedDate(selectedDate);
      setValue(value);

    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLoadMore = (type) => {
    setVisibleItems((prev) => ({
      ...prev,
      [type]: (prev[type] || 12) + 10,
    }));
  };

  // Use merged categories for options
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

  // Filter the merged categories
  let filteredCategories = categories.filter((category) =>
    category.categoryName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (filterType === 'Revenues') {
    filteredCategories = filteredCategories.filter(
      (category) => category.categoryType === 'Revenues'
    );
  } else if (filterType === 'Expenses') {
    filteredCategories = filteredCategories.filter(
      (category) => category.categoryType === 'Expenses'
    );
  }

  // Group the filtered, merged categories
  const groupedCategories = filteredCategories.reduce((acc, category) => {
    const type = category.categoryType;
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(category);
    return acc;
  }, {});

  const getCategoryIcon = (type) =>
    type === 'Expenses' ? '💸' : '💰';

  const handleNewDialogOpen = () => {
    setNewDialogOpen(true);
    setNewErrorMessage('');
    setNewCategoryName('');
    setNewCategoryType('');
    setNewCategoryImage(null);
  };

  const handleNewDialogClose = () => {
    setNewDialogOpen(false);
    setNewCategoryName('');
    setNewCategoryType('');
    setNewCategoryImage(null);
    setNewErrorMessage('');
    setIsCompressing(false);
  };

  const handleImageChange = async (event) => {
    const imageFile = event.target.files[0];
    if (!imageFile) {
      setNewCategoryImage(null);
      setNewErrorMessage('');
      event.target.value = null;
      return;
    }

    console.log(`Original file size: ${(imageFile.size / 1024 / 1024).toFixed(2)} MB`);
    setNewErrorMessage('');
    setIsCompressing(true);
    setNewCategoryImage(null); // Clear previous preview

    const options = {
      maxSizeMB: 0.5,
      maxWidthOrHeight: 800,
      useWebWorker: true,
    };

    try {
      const compressedFile = await imageCompression(imageFile, options);
      console.log(`Compressed file size: ${(compressedFile.size / 1024 / 1024).toFixed(2)} MB`);
      setNewCategoryImage(compressedFile); // Store the File object for preview and later conversion
    } catch (error) {
      console.error('Error compressing image:', error);
      setNewErrorMessage('Failed to process image. Please try another one or a smaller image.');
      setNewCategoryImage(null);
    } finally {
        setIsCompressing(false);
        event.target.value = null; // Allow re-selecting the same file
    }
  };


  // --- JSX Rendering --- 
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
      {/* --- Header --- */}
      <Box sx={{ textAlign: 'center', mb: { xs: 4, sm: 6 } }}>
        <Typography
          variant="h2"
          sx={{
            fontWeight: 'bold',
            textTransform: 'uppercase',
            color: originalThemeColors.primaryAccent,
            textShadow: '1px 1px 3px rgba(0,0,0,0.1)',
            letterSpacing: '1.5px',
            transform: `scale(${scale})`,
            transition: 'transform 0.5s ease-in-out',
            cursor: 'default',
            '&:hover': {
              transform: 'scale(1.05)',
            },
            fontSize: { xs: '2.5rem', sm: '3.5rem', md: '4rem' },
          }}
          onMouseEnter={() => setScale(1.05)}
          onMouseLeave={() => setScale(1)}
        >
          Dashboard
        </Typography>
      </Box>

      {/* --- Search Bar --- */}
      <Autocomplete
        freeSolo
        options={categoryOptions} // Use merged options
        inputValue={searchQuery}
        onInputChange={(event, newInputValue) => {
          setSearchQuery(newInputValue);
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            placeholder="Search categories..."
            variant="outlined"
            sx={{
              mb: { xs: 4, sm: 6 },
              maxWidth: '600px',
              mx: 'auto',
              display: 'block',
              '& .MuiOutlinedInput-root': {
                borderRadius: '30px',
                backgroundColor: alpha(originalThemeColors.surface, 0.9),
                boxShadow: `0 4px 12px ${alpha(originalThemeColors.primaryAccent, 0.1)}`,
                transition: 'box-shadow 0.3s ease',
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
                  {searchQuery && (
                    <IconButton
                      aria-label="clear search"
                      onClick={() => setSearchQuery('')}
                      edge="end"
                      sx={{ color: originalThemeColors.textSecondary, mr: -1 }}
                    >
                      <ClearIcon />
                    </IconButton>
                  )}
                  {params.InputProps.endAdornment}
                </>
              ),
            }}
          />
        )}
      />

      {/* --- Filter Buttons --- */}
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: { xs: 4, sm: 6 } }}>
        <ButtonGroup variant="outlined" size="large" sx={{ borderRadius: '20px', overflow: 'hidden', boxShadow: `0 2px 8px ${alpha(originalThemeColors.primaryAccent, 0.15)}` }}>
          {[
            { label: 'All', value: 'all', icon: <AccountBalanceWalletIcon /> },
            { label: 'Revenues', value: 'Revenues', icon: <AddCircleIcon /> },
            { label: 'Expenses', value: 'Expenses', icon: <RemoveCircleIcon /> },
          ].map((typeOption) => (
            <Button
              key={typeOption.value}
              onClick={() => setFilterType(typeOption.value)}
              variant={filterType === typeOption.value ? 'contained' : 'outlined'}
              startIcon={typeOption.icon}
              sx={{
                px: { xs: 2, sm: 3 },
                py: 1.5,
                fontSize: { xs: '0.8rem', sm: '0.9rem' },
                fontWeight: 600,
                borderColor: originalThemeColors.primaryAccent,
                color: filterType === typeOption.value ? originalThemeColors.buttonTextLight : originalThemeColors.primaryAccent,
                backgroundColor: filterType === typeOption.value ? originalThemeColors.primaryAccent : originalThemeColors.surface,
                '&:hover': {
                  backgroundColor: filterType === typeOption.value ? alpha(originalThemeColors.primaryAccent, 0.85) : alpha(originalThemeColors.primaryAccent, 0.08),
                },
                borderRightWidth: 0,
                '&:last-of-type': { borderRightWidth: '1px' }, 
              }}
            >
              {typeOption.label}
            </Button>
          ))}
        </ButtonGroup>
      </Box>

      {/* --- No Categories Message --- */}
      {Object.keys(groupedCategories).length === 0 && !loading && (
        <Typography sx={{ textAlign: 'center', color: originalThemeColors.textSecondary, mt: 5, fontStyle: 'italic' }}>
          No categories found matching your criteria.
        </Typography>
      )}

      {/* --- Category Sections --- */}
      {Object.entries(groupedCategories).map(([type, cats]) => (
        <Box key={type} sx={{ mb: { xs: 4, sm: 6 } }}>
          <Typography
            variant="h4"
            sx={{
              color: type === 'Expenses' ? originalThemeColors.expense : originalThemeColors.Revenuese,
              fontWeight: 600,
              mb: { xs: 2.5, sm: 3.5 },
              textAlign: 'center',
              borderBottom: `3px solid ${type === 'Expenses' ? originalThemeColors.expense : originalThemeColors.Revenuese}`,
              pb: 1,
              display: 'inline-block',
              fontSize: { xs: '1.8rem', sm: '2.2rem' },
            }}
          >
            {getCategoryIcon(type)} {type}
          </Typography>
          
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: 'repeat(auto-fill, minmax(140px, 1fr))',
                sm: 'repeat(auto-fill, minmax(150px, 1fr))',
                md: 'repeat(auto-fill, minmax(170px, 1fr))',
                lg: 'repeat(5, 1fr)', // Adjusted for potentially more cards
              },
              gap: { xs: 2, sm: 3, md: 4 },
              justifyContent: 'center',
            }}
          >
            {/* --- MODIFIED Image Handling Logic --- */}
            {cats.slice(0, visibleItems[type] || 12).map((category, index) => {
              const isAdded = addedItems.includes(category._id);
              let imageUrl = null; // Initialize to null

              if (category.image) {
                  const imageString = category.image;
                  if (imageString.startsWith('data:image')) {
                      // Case 1: Already a full data URI (from getcategories or future-proofed addCardToUser)
                      imageUrl = imageString;
                  } else if (imageString.includes('/') || imageString.match(/\.(jpeg|jpg|gif|png|webp)$/i)) {
                      // Case 2: Looks like a relative path (from getcategories)
                      imageUrl = `http://127.0.0.1:5004/${imageString.startsWith('/') ? imageString.substring(1) : imageString}`;
                  } else if (imageString.length > 50) { // Heuristic: Assume long string without slashes is base64
                      // Case 3: Assume it's raw base64 data (from getUserCards as currently implemented)
                      // Prepend the necessary prefix. Defaulting to png, but ideally backend should provide mime type.
                      imageUrl = `data:image/png;base64,${imageString}`;
                  } else {
                      // Case 4: Unrecognized format or short string - treat as no image
                      console.warn(`Unrecognized image format for category ${category.categoryName}: ${imageString.substring(0,50)}...`);
                  }
              }
              
              return (
                <Tooltip key={category._id || `${category.categoryName}-${index}`} title={isAdded ? 'Budget added for this category' : `Add ${type === 'Expenses' ? 'expense' : 'revenue'} for ${category.categoryName}` } arrow placement="top">
                  <Box sx={{ display: 'flex', justifyContent: 'center', animation: `${fadeIn} 0.6s ease-out forwards`, animationDelay: `${index * 0.05}s`, opacity: 0 }}> 
                    <CategoryCard
                      type={type}
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
                      aria-label={`Category: ${category.categoryName}, Type: ${type}${isAdded ? ', Budget Added' : ''}`}
                    >
                      {/* Image Display */} 
                      {imageUrl ? (
                        <Box
                          component="img"
                          src={imageUrl}
                          alt={category.categoryName}
                          onError={(e) => { 
                              console.error(`Failed to load image: ${imageUrl?.substring(0, 100)}...`); // Log error
                              e.target.style.display = 'none'; // Hide broken image
                              const placeholder = e.target.nextElementSibling; // Get the placeholder Box
                              if (placeholder) {
                                  placeholder.style.display = 'flex'; // Show placeholder
                              }
                          }}
                          sx={{
                            width: { xs: 50, sm: 60, md: 70 },
                            height: { xs: 50, sm: 60, md: 70 },
                            borderRadius: '50%',
                            mb: 1.5,
                            objectFit: 'cover',
                            border: `2px solid ${alpha(originalThemeColors.primaryAccent, 0.3)}`,
                          }}
                        />
                      ) : null} 
                      {/* Icon Placeholder (only shown if imageUrl is null OR if image fails onError) */} 
                      <Box sx={{ 
                           width: { xs: 50, sm: 60, md: 70 }, 
                           height: { xs: 50, sm: 60, md: 70 }, 
                           borderRadius: '50%', 
                           mb: 1.5, 
                           bgcolor: alpha(originalThemeColors.primaryAccent, 0.1), 
                           display: imageUrl ? 'none' : 'flex', // Initially hidden if imageUrl exists, shown if no image or on error
                           alignItems: 'center', 
                           justifyContent: 'center' 
                         }}> 
                           <Typography sx={{ fontSize: '1.5rem', color: originalThemeColors.primaryAccent }}>{getCategoryIcon(type)}</Typography> 
                      </Box>
                      {/* Category Name */} 
                      <Typography variant="subtitle1" sx={{ fontWeight: 'medium', color: originalThemeColors.textPrimary, fontSize: {xs: '0.9rem', sm: '1rem'} }}>
                        {category.categoryName}
                      </Typography>
                      {/* Added Badge */} 
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
            {/* --- END MODIFIED Image Handling Logic --- */}
          </Box>
          
          {cats.length > (visibleItems[type] || 12) && (
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
                Load More {type}
              </Button>
            </Box>
          )}
        </Box>
      ))}

      {/* --- Add Budget Dialog --- */}
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
          <Typography variant="subtitle1" sx={{ fontSize: {xs: '1rem', sm: '1.1rem'}, color: originalThemeColors.primaryAccent, mb: 2, fontWeight: 500, textAlign: 'center' }}>
            Enter {selectedCategory?.categoryType === 'Expenses' ? 'expense' : 'revenue'} details
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
            required
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
            required
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

      {/* --- Add New Category Dialog --- */}
      <Dialog
        open={newDialogOpen}
        onClose={handleNewDialogClose}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            borderRadius: '20px',
            boxShadow: `0 12px 40px ${alpha(originalThemeColors.primaryAccent, 0.25)}`,
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
            fontSize: { xs: '1.6rem', sm: '2rem' },
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
        <DialogContent sx={{ p: { xs: 3, sm: 4 }, backgroundColor: originalThemeColors.dialogSurface }}>
          <TextField
            autoFocus
            margin="dense"
            label="Category Name"
            type="text"
            fullWidth
            variant="outlined"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            required
            sx={{
              mb: 3,
              '& .MuiOutlinedInput-root': {
                backgroundColor: originalThemeColors.inputBackground,
                borderRadius: '12px',
                color: originalThemeColors.textPrimary,
                '& fieldset': { borderColor: originalThemeColors.borderColor },
                '&:hover fieldset': { borderColor: originalThemeColors.primaryAccent },
                '&.Mui-focused fieldset': { borderColor: originalThemeColors.primaryAccent, boxShadow: `0 0 0 2px ${alpha(originalThemeColors.primaryAccent, 0.2)}` },
              },
              '& .MuiInputLabel-root': { color: originalThemeColors.textSecondary },
              '& .MuiInputLabel-root.Mui-focused': { color: originalThemeColors.primaryAccent },
            }}
          />
          <FormControl fullWidth variant="outlined" sx={{ mb: 3 }}>
            <InputLabel id="category-type-label" sx={{ color: originalThemeColors.textSecondary, '&.Mui-focused': { color: originalThemeColors.primaryAccent } }}>Category Type</InputLabel>
            <Select
              labelId="category-type-label"
              value={newCategoryType}
              onChange={(e) => setNewCategoryType(e.target.value)}
              label="Category Type"
              required
              sx={{
                backgroundColor: originalThemeColors.inputBackground,
                borderRadius: '12px',
                color: originalThemeColors.textPrimary,
                '& .MuiOutlinedInput-notchedOutline': { borderColor: originalThemeColors.borderColor },
                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: originalThemeColors.primaryAccent },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: originalThemeColors.primaryAccent, boxShadow: `0 0 0 2px ${alpha(originalThemeColors.primaryAccent, 0.2)}` },
                '& .MuiSelect-icon': { color: originalThemeColors.textSecondary },
              }}
            >
              <MenuItem value="" disabled><em>Select Type</em></MenuItem>
              <MenuItem value="Revenues">Revenues</MenuItem>
              <MenuItem value="Expenses">Expenses</MenuItem>
            </Select>
          </FormControl>
          <Button
            variant="outlined"
            component="label"
            fullWidth
            disabled={isCompressing}
            sx={{
              mb: 2,
              py: 1.5,
              borderColor: originalThemeColors.primaryAccent,
              color: originalThemeColors.primaryAccent,
              borderRadius: '12px',
              fontWeight: 500,
              '&:hover': {
                borderColor: originalThemeColors.primaryAccent,
                background: alpha(originalThemeColors.primaryAccent, 0.08),
              }
            }}
          >
            {isCompressing ? 'Processing Image...' : (newCategoryImage ? 'Change Image' : 'Upload Image (Optional)')}
            <input type="file" accept="image/*" hidden onChange={handleImageChange} />
            {isCompressing && <CircularProgress size={20} sx={{ ml: 1.5, color: originalThemeColors.primaryAccent }} />}
          </Button>
          {newCategoryImage && (
            <Box sx={{ textAlign: 'center', mb: 2 }}>
              <Typography variant="caption" sx={{ color: originalThemeColors.textSecondary }}>
                Preview (Compressed: {(newCategoryImage.size / 1024).toFixed(1)} KB)
              </Typography>
              <Box
                component="img"
                // Use createObjectURL for previewing the File object
                src={URL.createObjectURL(newCategoryImage)} 
                alt="Preview"
                sx={{ display: 'block', maxWidth: '100px', maxHeight: '100px', borderRadius: '8px', margin: '8px auto 0', border: `1px solid ${originalThemeColors.borderColor}` }}
              />
            </Box>
          )}
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
            disabled={isNewSubmitting || isCompressing}
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
            {(isNewSubmitting || isCompressing) ? <CircularProgress size={24} sx={{ color: originalThemeColors.buttonTextLight }} /> : 'Add Category'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* --- Add New Category FAB --- */}
      <Fab
        color="primary"
        aria-label="add category"
        onClick={handleNewDialogOpen}
        sx={{
          position: 'fixed',
          bottom: { xs: 20, sm: 30 },
          right: { xs: 20, sm: 30 },
          backgroundColor: originalThemeColors.primaryAccent,
          color: originalThemeColors.buttonTextLight,
          boxShadow: `0 6px 20px ${alpha(originalThemeColors.primaryAccent, 0.4)}`,
          transition: 'transform 0.3s ease, background-color 0.3s ease',
          '&:hover': {
            backgroundColor: alpha(originalThemeColors.primaryAccent, 0.85),
            transform: 'scale(1.1)',
          },
        }}
      >
        <AddIcon />
      </Fab>
    </Container>
  );
};

export default DashboardUser;

