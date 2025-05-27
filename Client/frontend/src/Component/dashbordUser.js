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

// ***ADDED*** Helper function to get image URL (handles both paths and base64)
const getImageUrl = (imagePath) => {
  if (!imagePath) return "/placeholder-image.svg"; // Provide a path to a placeholder if needed
  // Check if it's a Base64 string
  if (imagePath.startsWith("data:image")) {
    return imagePath;
  }
  // Otherwise, assume it's a relative path and prepend the backend URL
  return `http://127.0.0.1:5004/${imagePath}`;
};

const DashboardUser = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null); // Will now contain the isUserCard flag
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
      // Assuming the API returns an object like { carduser: [...] }
      const response = await axios.get('http://127.0.0.1:5004/api/getUserCards', {
        headers: {
          Auth: `Bearer ${token}`,
        },
      });
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
      // Assuming the API returns an object like { data: [...] }
      const response = await axios.get('http://127.0.0.1:5004/api/getcategories');
      if (response.data && Array.isArray(response.data.data)) {
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

  // --- ***MODIFIED***: useEffect to fetch both, merge, and add flag --- 
  useEffect(() => {
    const loadAllData = async () => {
      setLoading(true);
      try {
        // Fetch both sets of data concurrently
        const [generalCategoriesData, userCardsData] = await Promise.all([
          fetchCategories(), // Returns array like [{ _id: 'cat1', ... }]
          fetchUserCards(),   // Returns array like [{ _id: 'user1', ... }]
        ]);

        // Add flags to distinguish the source
        const generalCategoriesWithFlag = generalCategoriesData.map(cat => ({ ...cat, isUserCard: false }));
        const userCardsWithFlag = userCardsData.map(card => ({ ...card, isUserCard: true }));

        // Merge the two arrays
        const allCards = [...generalCategoriesWithFlag, ...userCardsWithFlag];
        
        // Deduplicate based on _id
        const uniqueCategoriesMap = new Map();
        allCards.forEach(card => {
          if (card._id) { // Prioritize _id for uniqueness
            if (!uniqueCategoriesMap.has(card._id)) {
              uniqueCategoriesMap.set(card._id, card);
            }
          } else { 
            // Fallback if _id is missing (less reliable)
            const key = `${card.categoryName}-${card.categoryType}`;
            if (!uniqueCategoriesMap.has(key)) {
                uniqueCategoriesMap.set(key, card);
            }
          }
        });

        const mergedCategories = Array.from(uniqueCategoriesMap.values());

        setCategories(mergedCategories); // Set the combined and deduplicated list

        // Initialize visible items based on merged categories (logic remains the same)
        const initialVisibleItems = mergedCategories.reduce((acc, category) => {
          if (category.categoryType && !acc[category.categoryType]) {
            acc[category.categoryType] = 12; // Default visible count per type
          }
          return acc;
        }, {});
        setVisibleItems(initialVisibleItems);

      } catch (error) {
        console.error('Error loading combined category data:', error);
        setCategories([]); // Set to empty on error
      } finally {
        setLoading(false);
      }
    };

    loadAllData(); // Call the combined loading function on mount
  }, []); // Empty dependency array ensures it runs only once
  // --- ***END MODIFIED useEffect*** ---

  // --- handleNewCategorySubmit remains the same, it adds USER cards, not budget items ---
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
            image: imageBase64, 
        };

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
        setLoading(true);
        try {
            const [generalCategoriesData, userCardsData] = await Promise.all([
              fetchCategories(),
              fetchUserCards(),
            ]);
            const generalCategoriesWithFlag = generalCategoriesData.map(cat => ({ ...cat, isUserCard: false }));
            const userCardsWithFlag = userCardsData.map(card => ({ ...card, isUserCard: true }));
            const allCards = [...generalCategoriesWithFlag, ...userCardsWithFlag];
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
  // --- END handleNewCategorySubmit ---


  const handleClickOpen = (category) => {
    // The category object here now includes the `isUserCard` flag from the merged state
    if (addedItems.includes(category._id)) return; // Prevent re-adding visually
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

  // --- ***MODIFIED***: handleSubmit to send correct ID field based on flag --- 
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

    const currentCategory = selectedCategory; // Keep reference before closing dialog
    handleClose(); // Close dialog immediately for better UX

    setIsSubmitting(true);
    const token = sessionStorage.getItem('jwt');
    setErrorMessage(''); // Clear previous errors before new submission

    // --- Prepare payload based on category type (using the isUserCard flag) ---
    const payload = {
        valueitem: parsedValue,
        date: selectedDate,
    };
    if (currentCategory.isUserCard) { // Check the flag added during data load
        payload.UserCardId = currentCategory._id;
    } else {
        payload.CategoriesId = currentCategory._id;
    }
    // -------------------------------------------------------------------------

    try {
      // Send the correct payload to the backend
      const response = await axios.post(
        'http://127.0.0.1:5004/api/addBudget',
        payload, // Use the dynamically constructed payload
        {
          headers: {
            Auth: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      console.log('Add Budget Response:', response.data);
      // Mark item as added visually (prevents clicking again)
      setAddedItems((prev) => [...prev, currentCategory._id]);
      // No need to reopen dialog on success

    } catch (error) {
      console.error('Error submitting budget value:', error);
      let specificErrorMessage = 'An unexpected error occurred while submitting.'; // Default error message

      if (error.response) {
          // Use the specific error message from the backend if available
          specificErrorMessage = error.response.data?.error || `Server error: ${error.response.status}`;
          // If it was a duplicate error (400), mark as added visually anyway, as the backend confirmed it exists
          // This check relies on the backend sending a specific error message containing 'already added'
          if (error.response.status === 400 && error.response.data?.error?.toLowerCase().includes('already added')) {
              setAddedItems((prev) => [...prev, currentCategory._id]);
          }
      } else if (error.request) {
          // Network error (no response received)
          specificErrorMessage = 'Network error. Could not submit budget. Please check your connection.';
      } else {
          // Other errors (e.g., setting up the request)
           specificErrorMessage = `Error: ${error.message}`;
      }

      // Set the determined error message to display in the dialog
      setErrorMessage(specificErrorMessage);

      // Re-open the dialog to show the error message to the user
      setOpen(true);
      setSelectedCategory(currentCategory); // Restore the selected category in the dialog
      setSelectedDate(selectedDate); // Restore the selected date
      setValue(value); // Restore the entered value

    } finally {
      setIsSubmitting(false); // Ensure loading state is turned off
    }
  };
  // --- ***END MODIFIED handleSubmit*** ---

  const handleLoadMore = (type) => {
    setVisibleItems((prev) => ({
      ...prev,
      [type]: (prev[type] || 12) + 10,
    }));
  };

  // --- handleImageChange remains the same ---
  const handleImageChange = async (event) => {
    const file = event.target.files[0];
    if (!file) {
      setNewCategoryImage(null);
      return;
    }

    // Basic type check
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
        setNewErrorMessage('Invalid file type. Please select a JPG, PNG, WEBP, or GIF image.');
        setNewCategoryImage(null);
        event.target.value = null; // Clear the input
        return;
    }

    const options = {
      maxSizeMB: 0.5, // Target size: 0.5MB
      maxWidthOrHeight: 1024, // Max dimensions
      useWebWorker: true,
      initialQuality: 0.7, // Start with decent quality
      alwaysKeepResolution: false, // Allow resolution reduction if needed
      onProgress: (p) => console.log(`Compression progress: ${p}%`),
    };

    setIsCompressing(true); // Show compression loading indicator
    setNewErrorMessage(''); // Clear previous errors

    try {
      console.log(`Original file size: ${(file.size / 1024 / 1024).toFixed(2)} MB`);
      const compressedFile = await imageCompression(file, options);
      console.log(`Compressed file size: ${(compressedFile.size / 1024 / 1024).toFixed(2)} MB`);
      
      // Check final size again (important!)
      if (compressedFile.size > 1 * 1024 * 1024) { // Example: Check if still over 1MB (adjust as needed)
          setNewErrorMessage('Compression failed to reduce the image size sufficiently. Please try a smaller image.');
          setNewCategoryImage(null);
          event.target.value = null; // Clear the input
      } else {
          setNewCategoryImage(compressedFile); // Store the compressed File object
          setNewErrorMessage(''); // Clear error if compression is successful
      }
    } catch (error) {
      console.error('Image compression error:', error);
      setNewErrorMessage('Failed to process the image. Please try again or use a different image.');
      setNewCategoryImage(null);
      event.target.value = null; // Clear the input
    } finally {
      setIsCompressing(false); // Hide compression loading indicator
    }
  };
  // --- END handleImageChange ---

  // --- handleNewDialogOpen, handleNewDialogClose remain the same ---
  const handleNewDialogOpen = () => {
    setNewDialogOpen(true);
    setNewCategoryName('');
    setNewCategoryType('');
    setNewCategoryImage(null);
    setNewErrorMessage('');
    // Reset file input visually if possible (depends on browser/setup)
    const fileInput = document.getElementById('new-category-image-input');
    if (fileInput) fileInput.value = null;
  };

  const handleNewDialogClose = () => {
    setNewDialogOpen(false);
    // Don't clear states immediately if submission is in progress
    if (!isNewSubmitting) {
      setNewCategoryName('');
      setNewCategoryType('');
      setNewCategoryImage(null);
      setNewErrorMessage('');
    }
  };
  // --- END handleNewDialogOpen/Close ---

  // --- Filtering Logic (remains the same) ---
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

  // Filter the merged categories based on search and type filter
  let filteredCategories = categories.filter((category) =>
    category.categoryName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (filterType !== 'all') {
    filteredCategories = filteredCategories.filter(category => category.categoryType === filterType);
  }

  // Group filtered categories by type (Expenses, Revenues)
  const groupedCategories = filteredCategories.reduce((acc, category) => {
    const type = category.categoryType || 'Uncategorized'; // Handle potential missing type
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(category);
    return acc;
  }, {});
  // --- END Filtering Logic ---

  // --- JSX Rendering (remains the same structure) ---
  return (
    <Box sx={{
      minHeight: '100vh',
      background: `linear-gradient(135deg, ${originalThemeColors.backgroundGradientStart} 0%, ${originalThemeColors.backgroundGradientEnd} 100%)`,
      py: 6,
      px: {
        xs: 2, // Padding for extra-small screens
        sm: 3, // Padding for small screens
        md: 4, // Padding for medium screens
      },
    }}>
      <Container maxWidth="lg">
        {/* Header Section */}
        <Box
          sx={{
            textAlign: 'center',
            mb: 6,
            transform: `scale(${scale})`,
            transition: 'transform 0.5s ease-in-out',
            color: originalThemeColors.textPrimary,
          }}
          onMouseEnter={() => setScale(1.05)}
          onMouseLeave={() => setScale(1)}
        >
          <AccountBalanceWalletIcon sx={{ fontSize: 50, color: originalThemeColors.primaryAccent, mb: 1 }} />
          <Typography variant="h3" component="h1" fontWeight="bold">
            Your Financial Dashboard
          </Typography>
          <Typography variant="h6" color={originalThemeColors.textSecondary} sx={{ mt: 1 }}>
            Manage your Expenses and Revenues effortlessly.
          </Typography>
        </Box>

        {/* Search and Filter Controls */}
        <Box sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' }, // Stack on small screens, row on medium+
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 5,
          gap: 2, // Add gap between items
          p: 2,
          backgroundColor: alpha(originalThemeColors.surface, 0.8),
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
        }}>
          <Autocomplete
            freeSolo
            options={categoryOptions}
            inputValue={searchQuery}
            onInputChange={(event, newInputValue) => {
              setSearchQuery(newInputValue);
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                variant="outlined"
                placeholder="Search categories..."
                sx={{
                  width: { xs: '100%', md: 350 }, // Full width on small, fixed on medium+
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '8px',
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
                          <ClearIcon fontSize="small" />
                        </IconButton>
                      )}
                    </InputAdornment>
                  ),
                }}
              />
            )}
          />
          <ButtonGroup variant="outlined" aria-label="filter category type" sx={{ 
              borderColor: originalThemeColors.primaryAccent, 
              width: { xs: '100%', md: 'auto' }, // Full width on small, auto on medium+
              mt: { xs: 2, md: 0 } // Margin top on small screens
            }}>
            <Button
              onClick={() => setFilterType('all')}
              sx={{
                backgroundColor: filterType === 'all' ? alpha(originalThemeColors.primaryAccent, 0.1) : 'transparent',
                color: filterType === 'all' ? originalThemeColors.primaryAccent : originalThemeColors.textSecondary,
                borderColor: originalThemeColors.primaryAccent,
                '&:hover': {
                  backgroundColor: alpha(originalThemeColors.primaryAccent, 0.2),
                  borderColor: originalThemeColors.primaryAccent,
                }
              }}
            >
              All
            </Button>
            <Button
              onClick={() => setFilterType('Expenses')}
              sx={{
                backgroundColor: filterType === 'Expenses' ? alpha(originalThemeColors.expense, 0.1) : 'transparent',
                color: filterType === 'Expenses' ? originalThemeColors.expense : originalThemeColors.textSecondary,
                borderColor: originalThemeColors.primaryAccent,
                 '&:hover': {
                  backgroundColor: alpha(originalThemeColors.expense, 0.2),
                  borderColor: originalThemeColors.expense,
                }
              }}
            >
              Expenses
            </Button>
            <Button
              onClick={() => setFilterType('Revenues')}
              sx={{
                backgroundColor: filterType === 'Revenues' ? alpha(originalThemeColors.Revenuese, 0.1) : 'transparent',
                color: filterType === 'Revenues' ? originalThemeColors.Revenuese : originalThemeColors.textSecondary,
                borderColor: originalThemeColors.primaryAccent,
                 '&:hover': {
                  backgroundColor: alpha(originalThemeColors.Revenuese, 0.2),
                  borderColor: originalThemeColors.Revenuese,
                }
              }}
            >
              Revenues
            </Button>
          </ButtonGroup>
        </Box>

        {/* Category Sections */}
        {Object.entries(groupedCategories).map(([type, items]) => (
          <Box key={type} sx={{ mb: 6 }}>
            <Typography
              variant="h4"
              component="h2"
              gutterBottom
              fontWeight="600"
              sx={{
                color: type === 'Expenses' ? originalThemeColors.expense : originalThemeColors.Revenuese,
                borderBottom: `3px solid ${type === 'Expenses' ? originalThemeColors.expense : originalThemeColors.Revenuese}`,
                display: 'inline-block',
                pb: 0.5,
                mb: 4,
              }}
            >
              {type}
            </Typography>
            <Box
              sx={{
                display: 'grid',
                // Responsive grid columns
                gridTemplateColumns: {
                  xs: 'repeat(auto-fill, minmax(140px, 1fr))', // Smaller cards for xs
                  sm: 'repeat(auto-fill, minmax(160px, 1fr))', // Adjust for sm
                  md: 'repeat(auto-fill, minmax(180px, 1fr))', // Adjust for md
                  lg: 'repeat(auto-fill, minmax(190px, 1fr))', // Target size for lg
                },
                gap: { xs: 2, sm: 3, md: 4 }, // Responsive gap
              }}
            >
              {items.slice(0, visibleItems[type] || 12).map((category, index) => (
                <Tooltip
                  key={category._id || index} // Use _id if available, fallback to index
                  title={addedItems.includes(category._id) ? 'Value already added for today' : `Add value for ${category.categoryName}`}
                  arrow
                  placement="top"
                >
                  {/* Wrap CategoryCard in a Box to prevent Tooltip interfering with styled component props */}
                  <Box sx={{ animationDelay: `${index * 0.05}s` }}>
                    <CategoryCard
                                     type={category.categoryType}
                      onClick={() => handleClickOpen(category)}
                      sx={{
                        opacity: addedItems.includes(category._id) ? 0.5 : 1,
                        cursor: addedItems.includes(category._id) ? 'not-allowed' : 'pointer',
                        position: 'relative',
                        overflow: 'hidden', // Ensure pseudo-elements stay within bounds
                      }}
                    >
                       {/* Checkmark Overlay */}
                      {addedItems.includes(category._id) && (
                        <Box sx={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          backgroundColor: alpha(originalThemeColors.Revenuese, 0.7),
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center',
                          borderRadius: 'inherit',
                          zIndex: 1,
                        }}>
                          <svg width="60" height="60" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M20.25 6.75L9.75 17.25L4.5 12" stroke={originalThemeColors.white} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </Box>
                      )}
                      {/* Card Content */}
                      <Box sx={{
                        width: 60,
                        height: 60,
                        mb: 1.5,
                        borderRadius: '50%',
                        overflow: 'hidden',
                        border: `2px solid ${alpha(originalThemeColors.borderColor, 0.5)}`,
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        backgroundColor: alpha(originalThemeColors.backgroundGradientStart, 0.5),
                      }}>
                         {category.image ? (
                          <img
                            src={getImageUrl(category.image)} // ***MODIFIED*** Use helper function
                            alt={category.categoryName}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        ) : (
                          // Placeholder Icon/Initial
                          <Typography sx={{ fontSize: '24px', color: originalThemeColors.primaryAccent, fontWeight: 'bold' }}>
                            {category.categoryName.substring(0, 1).toUpperCase()}
                          </Typography>
                        )}
                      </Box>
                      <Typography
                        variant="subtitle1"
                        fontWeight="600"
                        sx={{ color: originalThemeColors.textPrimary, wordBreak: 'break-word' }}
                      >
                        {category.categoryName}
                      </Typography>
                    </CategoryCard>
                  </Box>
                </Tooltip>
              ))}
            </Box>
            {items.length > (visibleItems[type] || 12) && (
              <Box sx={{ textAlign: 'center', mt: 4 }}>
                <Button
                  variant="contained"
                  onClick={() => handleLoadMore(type)}
                  sx={{
                    backgroundColor: originalThemeColors.primaryAccent,
                    color: originalThemeColors.buttonTextLight,
                    '&:hover': {
                      backgroundColor: alpha(originalThemeColors.primaryAccent, 0.85),
                    },
                  }}
                >
                  Load More {type}
                </Button>
              </Box>
            )}
          </Box>
        ))}

        {/* Add New Category FAB */}
        <Fab
          color="primary"
          aria-label="add category"
          onClick={handleNewDialogOpen}
          sx={{
            position: 'fixed',
            bottom: { xs: 20, md: 40 },
            right: { xs: 20, md: 40 },
            backgroundColor: originalThemeColors.primaryAccent,
            '&:hover': {
              backgroundColor: alpha(originalThemeColors.primaryAccent, 0.85),
            },
          }}
        >
          <AddIcon sx={{ color: originalThemeColors.white }}/>
        </Fab>

      </Container>

      {/* Add Value Dialog */}
      <Dialog
        open={open}
        onClose={handleClose}
        PaperProps={{
          sx: {
            borderRadius: '16px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
            background: originalThemeColors.dialogSurface,
          },
        }}
      >
        <DialogTitle sx={{ textAlign: 'center', borderBottom: `1px solid ${originalThemeColors.borderColor}`, pb: 1.5 }}>
          <Typography variant="h5" component="div" fontWeight="600" color={originalThemeColors.textPrimary}>
            Add Value for {selectedCategory?.categoryName}
          </Typography>
          <IconButton
            aria-label="close"
            onClick={handleClose}
            sx={{
              position: 'absolute',
              right: 12,
              top: 12,
              color: originalThemeColors.textSecondary,
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: '20px !important', pb: 3, px: 3 }}>
          {errorMessage && (
            <Typography color="error" sx={{ mb: 2, textAlign: 'center', fontWeight: '500' }}>
              {errorMessage}
            </Typography>
          )}
          <TextField
            autoFocus
            margin="dense"
            id="value"
            label="Value (e.g., 123.45)"
            type="number" // Use number type for better mobile input
            fullWidth
            variant="outlined"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            InputProps={{
              startAdornment: <InputAdornment position="start">$</InputAdornment>,
              sx: { backgroundColor: originalThemeColors.inputBackground, borderRadius: '8px' },
            }}
            sx={{ mb: 2.5 }}
          />
          <TextField
            id="date"
            label="Select Date"
            type="date"
            fullWidth
            variant="outlined"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            InputLabelProps={{
              shrink: true,
            }}
            InputProps={{
              sx: { backgroundColor: originalThemeColors.inputBackground, borderRadius: '8px' },
            }}
          />
        </DialogContent>
        <DialogActions sx={{ borderTop: `1px solid ${originalThemeColors.borderColor}`, px: 3, py: 2 }}>
          <Button
            onClick={handleClose}
            variant="outlined"
            sx={{
              color: originalThemeColors.textSecondary,
              borderColor: originalThemeColors.borderColor,
              '&:hover': {
                backgroundColor: alpha(originalThemeColors.textSecondary, 0.05),
                borderColor: originalThemeColors.textSecondary,
              }
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={isSubmitting}
            startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : <AddCircleIcon />}
            sx={{
              backgroundColor: originalThemeColors.primaryAccent,
              color: originalThemeColors.buttonTextLight,
              '&:hover': {
                backgroundColor: alpha(originalThemeColors.primaryAccent, 0.85),
              },
              '&.Mui-disabled': {
                backgroundColor: alpha(originalThemeColors.primaryAccent, 0.5),
              }
            }}
          >
            {isSubmitting ? 'Adding...' : 'Add Value'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add New Category Dialog */}
      <Dialog
        open={newDialogOpen}
        onClose={handleNewDialogClose}
        PaperProps={{
          sx: {
            borderRadius: '16px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
            background: originalThemeColors.dialogSurface,
            width: '90%',
            maxWidth: '500px',
          },
        }}
      >
        <DialogTitle sx={{ textAlign: 'center', borderBottom: `1px solid ${originalThemeColors.borderColor}`, pb: 1.5 }}>
          <Typography variant="h5" component="div" fontWeight="600" color={originalThemeColors.textPrimary}>
            Create New Custom Card
          </Typography>
          <IconButton
            aria-label="close"
            onClick={handleNewDialogClose}
            sx={{
              position: 'absolute',
              right: 12,
              top: 12,
              color: originalThemeColors.textSecondary,
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: '20px !important', pb: 3, px: 3 }}>
          {newErrorMessage && (
            <Typography color="error" sx={{ mb: 2, textAlign: 'center', fontWeight: '500' }}>
              {newErrorMessage}
            </Typography>
          )}
          <TextField
            autoFocus
            margin="dense"
            id="new-category-name"
            label="Card Name"
            type="text"
            fullWidth
            variant="outlined"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            InputProps={{
              sx: { backgroundColor: originalThemeColors.inputBackground, borderRadius: '8px' },
            }}
            sx={{ mb: 2.5 }}
          />
          <FormControl fullWidth variant="outlined" sx={{ mb: 2.5 }}>
            <InputLabel id="new-category-type-label">Card Type</InputLabel>
            <Select
              labelId="new-category-type-label"
              id="new-category-type"
              value={newCategoryType}
              onChange={(e) => setNewCategoryType(e.target.value)}
              label="Card Type"
              sx={{ backgroundColor: originalThemeColors.inputBackground, borderRadius: '8px' }}
            >
              <MenuItem value=""><em>Select Type</em></MenuItem>
              <MenuItem value="Expenses">Expenses</MenuItem>
              <MenuItem value="Revenues">Revenues</MenuItem>
            </Select>
          </FormControl>
          <Button
            variant="outlined"
            component="label"
            fullWidth
            disabled={isCompressing} // Disable while compressing
            startIcon={isCompressing ? <CircularProgress size={20} /> : null}
            sx={{
              mb: 2,
              py: 1.5,
              borderColor: originalThemeColors.borderColor,
              color: originalThemeColors.textSecondary,
              '&:hover': {
                backgroundColor: alpha(originalThemeColors.primaryAccent, 0.05),
                borderColor: originalThemeColors.primaryAccent,
              }
            }}
          >
            {isCompressing ? 'Processing Image...' : (newCategoryImage ? 'Change Image' : 'Upload Image (Optional)')}
            <input
              id="new-category-image-input"
              type="file"
              hidden
              accept="image/png, image/jpeg, image/webp, image/gif"
              onChange={handleImageChange}
            />
          </Button>
          {newCategoryImage && (
            <Box sx={{ textAlign: 'center', mb: 2 }}>
              <Typography variant="caption" color={originalThemeColors.textSecondary}>
                Preview (Compressed: {(newCategoryImage.size / 1024).toFixed(1)} KB)
              </Typography>
              <Box sx={{ mt: 1, border: `1px solid ${originalThemeColors.borderColor}`, display: 'inline-block', borderRadius: '4px', overflow: 'hidden' }}>
                <img 
                  src={URL.createObjectURL(newCategoryImage)} 
                  alt="Preview" 
                  style={{ display: 'block', maxWidth: '100px', maxHeight: '100px' }} 
                  onLoad={() => URL.revokeObjectURL(newCategoryImage)} // Clean up object URL
                />
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ borderTop: `1px solid ${originalThemeColors.borderColor}`, px: 3, py: 2 }}>
          <Button
            onClick={handleNewDialogClose}
            variant="outlined"
            disabled={isNewSubmitting} // Disable cancel during submission
            sx={{
              color: originalThemeColors.textSecondary,
              borderColor: originalThemeColors.borderColor,
              '&:hover': {
                backgroundColor: alpha(originalThemeColors.textSecondary, 0.05),
                borderColor: originalThemeColors.textSecondary,
              }
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleNewCategorySubmit}
            variant="contained"
            disabled={isNewSubmitting || isCompressing} // Disable if submitting or compressing
            startIcon={(isNewSubmitting || isCompressing) ? <CircularProgress size={20} color="inherit" /> : <AddCircleIcon />}
            sx={{
              backgroundColor: originalThemeColors.primaryAccent,
              color: originalThemeColors.buttonTextLight,
              '&:hover': {
                backgroundColor: alpha(originalThemeColors.primaryAccent, 0.85),
              },
              '&.Mui-disabled': {
                backgroundColor: alpha(originalThemeColors.primaryAccent, 0.5),
              }
            }}
          >
            {isNewSubmitting ? 'Creating...' : 'Create Card'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DashboardUser;

