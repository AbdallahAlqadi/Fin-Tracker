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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import Autocomplete from '@mui/material/Autocomplete';
import { styled, keyframes, alpha } from '@mui/system';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import CloseIcon from '@mui/icons-material/Close';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import RemoveCircleIcon from '@mui/icons-material/RemoveCircle';

// لوحة ألوان هادئة وعصرية
const themeColors = {
  background: '#F9FAFB',
  primaryAccent: '#0D47A1',
  textPrimary: '#212121',
  textSecondary: '#424242',
  expense: '#C62828',
  income: '#2E7D32',
  surface: '#FFFFFF',
  dialogSurface: '#FFFFFF',
  inputBackground: '#FFFFFF',
  borderColor: '#E0E0E0',
  buttonTextLight: '#FFFFFF',
  buttonTextDark: '#0D47A1',
};

// تأثير تحويم محسّن
const hoverAnimation = keyframes`
  0% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
  100% { transform: translateY(0); }
`;

// بطاقة محسّنة مع تصميم أكثر جاذبية
const CategoryCard = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'type',
})(({ theme, type }) => ({
  backgroundColor: themeColors.surface,
  borderRadius: '16px',
  padding: theme.spacing(2.5),
  height: '220px',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  textAlign: 'center',
  boxShadow: `0 6px 20px ${alpha(themeColors.textPrimary, 0.1)}`,
  transition: 'transform 0.4s ease, box-shadow 0.4s ease, border-color 0.4s ease',
  border: `2px solid ${themeColors.borderColor}`,
  '&:hover': {
    transform: 'translateY(-10px)',
    boxShadow: `0 16px 32px ${alpha(themeColors.textPrimary, 0.2)}`,
    borderColor: themeColors.primaryAccent,
    backgroundColor: alpha(themeColors.primaryAccent, 0.05),
    animation: `${hoverAnimation} 0.8s ease-in-out`,
  },
  [theme.breakpoints.down('sm')]: {
    height: '200px',
    padding: theme.spacing(2),
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
  const [scale, setScale] = useState(1);
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

  const isSmallDevice = useMediaQuery('(max-width:600px)');

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get('https://fin-tracker-ncbx.onrender.com/api/getcategories');
        setCategories(response.data.data);
        const initialVisible = response.data.data.reduce((acc, cat) => {
          if (!acc[cat.categoryType]) acc[cat.categoryType] = 12;
          return acc;
        }, {});
        setVisibleItems(initialVisible);
      } catch (error) {
        console.error('Error fetching categories:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

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
    const current = selectedCategory;
    handleClose();
    setIsSubmitting(true);
    const token = sessionStorage.getItem('jwt');
    try {
      const response = await axios.post(
        'https://fin-tracker-ncbx.onrender.com/api/addBudget',
        {
          CategoriesId: current._id,
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
      setAddedItems((prev) => [...prev, current._id]);
    } catch (error) {
      if (error.response && error.response.status === 400) {
        setAddedItems((prev) => [...prev, current._id]);
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
      [type]: prev[type] + 10,
    }));
  };

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

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setNewCategoryImage(e.target.files[0]);
    }
  };

  const handleNewCategorySubmit = async () => {
    if (!newCategoryName || !newCategoryType) {
      setNewErrorMessage('Please fill in all required fields.');
      return;
    }
    setIsNewSubmitting(true);
    const token = sessionStorage.getItem('jwt');
    const formData = new FormData();
    formData.append('categoryName', newCategoryName);
    formData.append('categoryType', newCategoryType);
    if (newCategoryImage) {
      formData.append('image', newCategoryImage);
    }
    try {
      const response = await axios.post(
        'https://fin-tracker-ncbx.onrender.com/api/cardusers',
        formData,
        {
          headers: {
            Auth: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      setCategories((prev) => [...prev, response.data.data]);
      handleNewDialogClose();
    } catch (error) {
      console.error('Error adding new category:', error);
      setNewErrorMessage('An error occurred while adding the category.');
    } finally {
      setIsNewSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          backgroundColor: themeColors.background,
        }}
      >
        <CircularProgress sx={{ color: themeColors.primaryAccent }} size={60} />
        <Typography variant="h6" sx={{ color: themeColors.textPrimary, ml: 2 }}>
          Loading Dashboard...
        </Typography>
      </Box>
    );
  }

  let filteredCategories = categories.filter((cat) =>
    cat.categoryName.toLowerCase().includes(searchQuery.toLowerCase())
  );
  if (filterType === 'income') {
    filteredCategories = filteredCategories.filter(
      (cat) => !cat.categoryType.toLowerCase().startsWith('expens')
    );
  } else if (filterType === 'expenses') {
    filteredCategories = filteredCategories.filter((cat) =>
      cat.categoryType.toLowerCase().startsWith('expens')
    );
  }

  const groupedCategories = filteredCategories.reduce((acc, cat) => {
    if (!acc[cat.categoryType]) acc[cat.categoryType] = [];
    acc[cat.categoryType].push(cat);
    return acc;
  }, {});

  const getCategoryIcon = (type) =>
    type && type.toLowerCase().startsWith('expens') ? '💸' : '💰';

  const categoryOptions = categories.map((cat) => cat.categoryName);

  return (
    <Container
      maxWidth="xl"
      sx={{
        py: { xs: 3, sm: 5 },
        minHeight: '100vh',
        backgroundColor: themeColors.background,
        fontFamily:
          '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        color: themeColors.textPrimary,
      }}
    >
      {/* العنوان الرئيسي */}
      <Box sx={{ textAlign: 'center', mb: { xs: 4, sm: 6 } }}>
        <Typography
          variant="h2"
          sx={{
            fontWeight: 'bold',
            color: themeColors.primaryAccent,
            letterSpacing: '0.05em',
            transition: 'transform 0.3s ease',
            transform: `scale(${scale})`,
            cursor: 'pointer',
            fontSize: { xs: '2rem', sm: '2.8rem', md: '3.2rem' },
          }}
          onMouseEnter={() => setScale(1.05)}
          onMouseLeave={() => setScale(1)}
        >
          Finance Tracker
        </Typography>
        <Typography
          variant="h6"
          sx={{ color: themeColors.textSecondary, fontWeight: 300, mt: 1 }}
        >
          Manage your finances with ease
        </Typography>
      </Box>

      {/* شريط البحث */}
      <Box sx={{ mb: { xs: 3, sm: 5 }, maxWidth: '800px', mx: 'auto' }}>
        <Autocomplete
          freeSolo
          options={categoryOptions}
          onInputChange={(e, val) => setSearchQuery(val)}
          renderInput={(params) => (
            <TextField
              {...params}
              placeholder="Search for a category..."
              variant="outlined"
              sx={{
                backgroundColor: themeColors.inputBackground,
                borderRadius: '30px',
                boxShadow: `0 2px 10px ${alpha(themeColors.textPrimary, 0.1)}`,
                '& .MuiOutlinedInput-root': {
                  borderRadius: '30px',
                  color: themeColors.textPrimary,
                  '& fieldset': {
                    borderColor: alpha(themeColors.primaryAccent, 0.4),
                    borderWidth: '1px',
                  },
                  '&:hover fieldset': {
                    borderColor: themeColors.primaryAccent,
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: themeColors.primaryAccent,
                    boxShadow: `0 0 0 3px ${alpha(themeColors.primaryAccent, 0.25)}`,
                  },
                },
                '& .MuiInputBase-input': {
                  color: themeColors.textPrimary,
                  '&::placeholder': {
                    color: themeColors.textSecondary,
                    opacity: 1,
                  },
                },
              }}
              InputProps={{
                ...params.InputProps,
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: themeColors.textSecondary }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <>
                    {params.InputProps.endAdornment}
                    {searchQuery && (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setSearchQuery('')}
                          edge="end"
                          sx={{
                            color: themeColors.textSecondary,
                            '&:hover': { color: themeColors.primaryAccent },
                          }}
                        >
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
      </Box>

      {/* أزرار الفلترة */}
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: { xs: 4, sm: 6 } }}>
        <ButtonGroup
          variant="outlined"
          size="large"
          sx={{
            borderRadius: '20px',
            overflow: 'hidden',
            boxShadow: `0 2px 8px ${alpha(themeColors.textPrimary, 0.1)}`,
          }}
        >
          {[
            { label: 'All', value: 'all', icon: <AccountBalanceWalletIcon /> },
            { label: 'Revenues', value: 'income', icon: <AddCircleIcon /> },
            { label: 'Expenses', value: 'expenses', icon: <RemoveCircleIcon /> },
          ].map((opt, idx) => (
            <Button
              key={opt.value}
              onClick={() => setFilterType(opt.value)}
              variant={filterType === opt.value ? 'contained' : 'outlined'}
              startIcon={opt.icon}
              sx={{
                textTransform: 'none',
                fontWeight: filterType === opt.value ? 'bold' : 'normal',
                borderColor: themeColors.primaryAccent,
                color:
                  filterType === opt.value
                    ? themeColors.buttonTextLight
                    : themeColors.buttonTextDark,
                backgroundColor:
                  filterType === opt.value ? themeColors.primaryAccent : 'transparent',
                '&:hover': {
                  backgroundColor:
                    filterType === opt.value
                      ? alpha(themeColors.primaryAccent, 0.85)
                      : alpha(themeColors.primaryAccent, 0.08),
                  borderColor: themeColors.primaryAccent,
                },
                px: { xs: 2, sm: 3 },
                py: 1.5,
                fontSize: { xs: '0.8rem', sm: '1rem' },
                ...(idx === 0 && { borderRadius: '20px 0 0 20px' }),
                ...(idx === 2 && { borderRadius: '0 20px 20px 0' }),
              }}
            >
              {opt.label}
            </Button>
          ))}
        </ButtonGroup>
      </Box>

      {/* عرض الفئات */}
      {Object.keys(groupedCategories).length === 0 ? (
        <Typography
          variant="h6"
          align="center"
          sx={{ color: themeColors.textSecondary, mt: 4, fontStyle: 'italic' }}
        >
          No items found.
        </Typography>
      ) : (
        Object.keys(groupedCategories).map((type) => (
          <Box key={type} sx={{ mb: 6 }}>
            <Typography
              variant="h5"
              sx={{
                color: themeColors.primaryAccent,
                fontWeight: 600,
                mb: 3,
                pl: 2,
                borderLeft: `4px solid ${
                  type.toLowerCase().startsWith('expens')
                    ? themeColors.expense
                    : themeColors.income
                }`,
                display: 'inline-block',
              }}
            >
              {type} {getCategoryIcon(type)}
            </Typography>

            {/* شبكة محسّنة مع 5 بطاقات في الصف */}
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(5, 1fr)',
                gap: 3.5,
                mb: 2,
                '@media (max-width:1200px)': {
                  gridTemplateColumns: 'repeat(4, 1fr)',
                },
                '@media (max-width:900px)': {
                  gridTemplateColumns: 'repeat(3, 1fr)',
                },
                '@media (max-width:600px)': {
                  gridTemplateColumns: 'repeat(2, 1fr)',
                },
              }}
            >
              {groupedCategories[type].slice(0, visibleItems[type]).map((category) => {
                const isAdded = addedItems.includes(category._id);
                return (
                  <Tooltip
                    key={category._id}
                    title={isAdded ? 'Already added' : `Add ${category.categoryName}`}
                    placement="top"
                    arrow
                  >
                    <Box sx={{ height: '100%' }}>
                      <CategoryCard
                        type={category.categoryType}
                        onClick={isAdded ? undefined : () => handleClickOpen(category)}
                        sx={{
                          opacity: isAdded ? 0.6 : 1,
                          filter: isAdded ? 'grayscale(50%)' : 'none',
                          pointerEvents: isAdded ? 'none' : 'auto',
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
                              width: { xs: 70, sm: 80, md: 90 },
                              height: { xs: 70, sm: 80, md: 90 },
                              borderRadius: '50%',
                              mb: 2,
                              objectFit: 'cover',
                              border: `2px solid ${alpha(themeColors.primaryAccent, 0.4)}`,
                            }}
                          />
                        )}
                        <Typography
                          variant="subtitle1"
                          sx={{
                            color: themeColors.textPrimary,
                            fontWeight: 600,
                            fontSize: { xs: '1rem', sm: '1.1rem', md: '1.2rem' },
                          }}
                        >
                          {category.categoryName}
                        </Typography>
                        {isAdded && (
                          <Typography
                            variant="caption"
                            sx={{
                              color: themeColors.expense,
                              fontWeight: 'bold',
                              mt: 1,
                              textTransform: 'uppercase',
                              letterSpacing: '0.05em',
                            }}
                          >
                            Added
                          </Typography>
                        )}
                      </CategoryCard>
                    </Box>
                  </Tooltip>
                );
              })}
            </Box>

            {/* زر تحميل المزيد */}
            {groupedCategories[type].length > visibleItems[type] && (
              <Box sx={{ textAlign: 'center', mt: { xs: 3, sm: 4 } }}>
                <Button
                  onClick={() => handleLoadMore(type)}
                  variant="contained"
                  sx={{
                    backgroundColor: themeColors.primaryAccent,
                    color: themeColors.buttonTextLight,
                    px: 4,
                    py: 1.5,
                    borderRadius: '8px',
                    fontSize: { xs: '0.9rem', sm: '1rem' },
                    fontWeight: 600,
                    transition: 'background-color 0.3s ease, transform 0.2s ease',
                    '&:hover': {
                      backgroundColor: alpha(themeColors.primaryAccent, 0.85),
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

      {/* حوار إضافة قيمة جديدة */}
      <Dialog
        open={open}
        onClose={handleClose}
        fullWidth
        maxWidth="xs"
        PaperProps={{
          sx: {
            borderRadius: '16px',
            boxShadow: `0 10px 30px ${alpha(themeColors.textPrimary, 0.1)}`,
            background: themeColors.dialogSurface,
            color: themeColors.textPrimary,
          },
        }}
      >
        <DialogTitle
          sx={{
            background: themeColors.primaryAccent,
            color: themeColors.buttonTextLight,
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
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {selectedCategory && getCategoryIcon(selectedCategory.categoryType)}{' '}
            {selectedCategory?.categoryName}
          </Box>
          <IconButton
            onClick={handleClose}
            sx={{
              color: themeColors.buttonTextLight,
              '&:hover': { background: alpha(themeColors.buttonTextLight, 0.15) },
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: { xs: 2.5, sm: 3 }, backgroundColor: themeColors.dialogSurface }}>
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
                  border: `3px solid ${alpha(themeColors.primaryAccent, 0.5)}`,
                  boxShadow: `0 0 10px ${alpha(themeColors.primaryAccent, 0.3)}`,
                }}
              />
            </Box>
          )}
          <Typography
            variant="subtitle1"
            sx={{
              fontSize: { xs: '1rem', sm: '1.1rem' },
              color: themeColors.primaryAccent,
              mb: 2,
              fontWeight: 500,
              textAlign: 'center',
            }}
          >
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
                backgroundColor: themeColors.inputBackground,
                borderRadius: '8px',
                color: themeColors.textPrimary,
                '& fieldset': { borderColor: themeColors.borderColor },
                '&:hover fieldset': { borderColor: themeColors.primaryAccent },
                '&.Mui-focused fieldset': {
                  borderColor: themeColors.primaryAccent,
                  boxShadow: `0 0 0 2px ${alpha(themeColors.primaryAccent, 0.2)}`,
                },
              },
              '& .MuiInputLabel-root': { color: themeColors.textSecondary },
              '& .MuiInputLabel-root.Mui-focused': { color: themeColors.primaryAccent },
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
                backgroundColor: themeColors.inputBackground,
                borderRadius: '8px',
                color: themeColors.textPrimary,
                '& fieldset': { borderColor: themeColors.borderColor },
                '&:hover fieldset': { borderColor: themeColors.primaryAccent },
                '&.Mui-focused fieldset': {
                  borderColor: themeColors.primaryAccent,
                  boxShadow: `0 0 0 2px ${alpha(themeColors.primaryAccent, 0.2)}`,
                },
                '& input[type="date"]::-webkit-calendar-picker-indicator': {
                  filter: 'invert(0.3) sepia(1) saturate(5) hue-rotate(190deg)',
                },
              },
              '& .MuiInputLabel-root': { color: themeColors.textSecondary },
              '& .MuiInputLabel-root.Mui-focused': { color: themeColors.primaryAccent },
            }}
          />
          {errorMessage && (
            <Typography
              variant="body2"
              sx={{
                color: themeColors.expense,
                textAlign: 'center',
                mb: 2,
                fontWeight: 500,
              }}
            >
              {errorMessage}
            </Typography>
          )}
        </DialogContent>
        <DialogActions
          sx={{
            p: { xs: 2, sm: 2.5 },
            justifyContent: 'center',
            gap: 2,
            backgroundColor: themeColors.dialogSurface,
            borderBottomLeftRadius: '16px',
            borderBottomRightRadius: '16px',
          }}
        >
          <Button
            onClick={handleClose}
            variant="outlined"
            sx={{
              borderColor: themeColors.primaryAccent,
              color: themeColors.primaryAccent,
              px: { xs: 3, sm: 4 },
              py: 1.2,
              borderRadius: '8px',
              fontSize: { xs: '0.9rem', sm: '1rem' },
              fontWeight: 500,
              '&:hover': {
                borderColor: themeColors.primaryAccent,
                background: alpha(themeColors.primaryAccent, 0.08),
              },
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={isSubmitting}
            sx={{
              backgroundColor: themeColors.primaryAccent,
              color: themeColors.buttonTextLight,
              px: { xs: 3, sm: 4 },
              py: 1.2,
              borderRadius: '8px',
              fontSize: { xs: '0.9rem', sm: '1rem' },
              fontWeight: 600,
              transition: 'background-color 0.3s ease, transform 0.2s ease',
              '&:hover': {
                backgroundColor: alpha(themeColors.primaryAccent, 0.85),
                transform: 'scale(1.02)',
              },
              '&.Mui-disabled': {
                background: alpha(themeColors.textSecondary, 0.5),
                color: alpha(themeColors.buttonTextLight, 0.7),
              },
            }}
          >
            {isSubmitting ? <CircularProgress size={24} sx={{ color: themeColors.buttonTextLight }} /> : 'Submit'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* حوار إضافة فئة جديدة */}
      <Dialog
        open={newDialogOpen}
        onClose={handleNewDialogClose}
        fullWidth
        maxWidth="xs"
        PaperProps={{
          sx: {
            borderRadius: '20px',
            boxShadow: `0 12px 40px ${alpha(themeColors.textPrimary, 0.1)}`,
            background: themeColors.surface,
            color: themeColors.textPrimary,
          },
        }}
      >
        <DialogTitle
          sx={{
            background: themeColors.primaryAccent,
            color: themeColors.buttonTextLight,
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
          <IconButton
            onClick={handleNewDialogClose}
            sx={{
              color: themeColors.buttonTextLight,
              '&:hover': { background: alpha(themeColors.buttonTextLight, 0.15) },
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: { xs: 2.5, sm: 3 }, backgroundColor: themeColors.dialogSurface }}>
          {newCategoryImage && (
            <Box sx={{ textAlign: 'center', mb: 2 }}>
              <img
                src={URL.createObjectURL(newCategoryImage)}
                alt="Preview"
                style={{
                  width: 100,
                  height: 100,
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: `3px solid ${alpha(themeColors.primaryAccent, 0.5)}`,
                }}
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
                backgroundColor: themeColors.inputBackground,
                borderRadius: '8px',
                color: themeColors.textPrimary,
                '& fieldset': { borderColor: themeColors.borderColor },
                '&:hover fieldset': { borderColor: themeColors.primaryAccent },
                '&.Mui-focused fieldset': {
                  borderColor: themeColors.primaryAccent,
                  boxShadow: `0 0 0 2px ${alpha(themeColors.primaryAccent, 0.2)}`,
                },
              },
              '& .MuiInputLabel-root': { color: themeColors.textSecondary },
              '& .MuiInputLabel-root.Mui-focused': { color: themeColors.primaryAccent },
            }}
          />
          <FormControl
            fullWidth
            sx={{
              mb: 2.5,
              '& .MuiOutlinedInput-root': {
                backgroundColor: themeColors.inputBackground,
                borderRadius: '8px',
                color: themeColors.textPrimary,
                '& fieldset': { borderColor: themeColors.borderColor },
                '&:hover fieldset': { borderColor: themeColors.primaryAccent },
                '&.Mui-focused fieldset': {
                  borderColor: themeColors.primaryAccent,
                  boxShadow: `0 0 0 2px ${alpha(themeColors.primaryAccent, 0.2)}`,
                },
              },
              '& .MuiInputLabel-root': { color: themeColors.textSecondary },
              '& .MuiInputLabel-root.Mui-focused': { color: themeColors.primaryAccent },
              '& .MuiSelect-icon': { color: themeColors.textSecondary },
            }}
          >
            <InputLabel id="category-type-label">Category Type</InputLabel>
            <Select
              labelId="category-type-label"
              value={newCategoryType}
              label="Category Type"
              onChange={(e) => setNewCategoryType(e.target.value)}
              MenuProps={{
                PaperProps: {
                  sx: {
                    backgroundColor: themeColors.surface,
                    color: themeColors.textPrimary,
                    '& .MuiMenuItem-root:hover': {
                      backgroundColor: alpha(themeColors.primaryAccent, 0.08),
                    },
                    '& .MuiMenuItem-root.Mui-selected': {
                      backgroundColor: alpha(themeColors.primaryAccent, 0.15),
                      color: themeColors.primaryAccent,
                    },
                  },
                },
              }}
            >
              <MenuItem value="expenses">Expenses</MenuItem>
              <MenuItem value="income">Income</MenuItem>
            </Select>
          </FormControl>
          <Button
            variant="outlined"
            component="label"
            fullWidth
            sx={{
              mb: 2.5,
              borderColor: themeColors.primaryAccent,
              color: themeColors.primaryAccent,
              py: 1.2,
              borderRadius: '8px',
              fontWeight: 500,
              '&:hover': {
                borderColor: themeColors.primaryAccent,
                background: alpha(themeColors.primaryAccent, 0.08),
              },
            }}
          >
            Upload Image
            <input type="file" hidden accept="image/*" onChange={handleImageChange} />
          </Button>
          {newErrorMessage && (
            <Typography
              variant="body2"
              sx={{
                color: themeColors.expense,
                textAlign: 'center',
                mb: 2,
                fontWeight: 500,
              }}
            >
              {newErrorMessage}
            </Typography>
          )}
        </DialogContent>
        <DialogActions
          sx={{
            p: { xs: 2, sm: 2.5 },
            justifyContent: 'center',
            gap: 2,
            backgroundColor: themeColors.dialogSurface,
            borderBottomLeftRadius: '20px',
            borderBottomRightRadius: '20px',
          }}
        >
          <Button
            onClick={handleNewDialogClose}
            variant="outlined"
            sx={{
              borderColor: themeColors.primaryAccent,
              color: themeColors.primaryAccent,
              px: { xs: 3, sm: 4 },
              py: 1.2,
              borderRadius: '8px',
              fontSize: { xs: '0.9rem', sm: '1rem' },
              fontWeight: 500,
              '&:hover': {
                borderColor: themeColors.primaryAccent,
                background: alpha(themeColors.primaryAccent, 0.08),
              },
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleNewCategorySubmit}
            variant="contained"
            disabled={isNewSubmitting}
            sx={{
              backgroundColor: themeColors.primaryAccent,
              color: themeColors.buttonTextLight,
              px: { xs: 3, sm: 4 },
              py: 1.2,
              borderRadius: '8px',
              fontSize: { xs: '0.9rem', sm: '1rem' },
              fontWeight: 600,
              transition: 'background-color 0.3s ease, transform 0.2s ease',
              '&:hover': {
                backgroundColor: alpha(themeColors.primaryAccent, 0.85),
                transform: 'scale(1.02)',
              },
              '&.Mui-disabled': {
                background: alpha(themeColors.textSecondary, 0.5),
                color: alpha(themeColors.buttonTextLight, 0.7),
              },
            }}
          >
            {isNewSubmitting ? (
              <CircularProgress size={24} sx={{ color: themeColors.buttonTextLight }} />
            ) : (
              'Submit'
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default DashboardUser;