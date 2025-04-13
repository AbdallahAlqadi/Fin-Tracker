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
} from '@mui/material';
import Autocomplete from '@mui/material/Autocomplete';
import { styled, keyframes } from '@mui/system';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import CloseIcon from '@mui/icons-material/Close';

// حركة انسيابية للبطاقات
const floatAnimation = keyframes`
  0% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
  100% { transform: translateY(0); }
`;

// حركة تلاشي دخول البطاقات
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

// تصميم بطاقة التصنيف بشكل حديث
const CategoryCard = styled(Box)(({ theme }) => ({
  border: '2px solid #4A90E2',
  backgroundColor: '#FFFFFF',
  borderRadius: '16px',
  padding: theme.spacing(2.5),
  width: '180px',
  height: '180px',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  textAlign: 'center',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
  cursor: 'pointer',
  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
  animation: `${fadeIn} 0.5s ease forwards`,
  '&:hover': {
    transform: 'scale(1.05)',
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
    animation: `${floatAnimation} 2s ease-in-out infinite`,
  },
  [theme.breakpoints.down('sm')]: {
    width: '140px',
    height: '140px',
    padding: theme.spacing(2),
  },
}));

const DashboardUser = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [value, setValue] = useState('');
  const [visibleItems, setVisibleItems] = useState({});
  const [errorMessage, setErrorMessage] = useState('');
  const [scale, setScale] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [addedItems, setAddedItems] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filterType, setFilterType] = useState('all');

  const isSmallDevice = useMediaQuery('(max-width:370px)');

  // دالة للحصول على تاريخ اليوم بتوقيت عمّان
  const getTodayDate = () => {
    return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Amman' });
  };

  // جلب التصنيفات من الخادم
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get('https://fin-tracker-ncbx.onrender.com/api/getcategories');
        setCategories(response.data.data);

        // تهيئة عدد العناصر المرئية لكل نوع (افتراضي 12)
        const initialVisibleItems = response.data.data.reduce((acc, category) => {
          if (!acc[category.categoryType]) {
            acc[category.categoryType] = 12;
          }
          return acc;
        }, {});
        setVisibleItems(initialVisibleItems);
      } catch (error) {
        console.error('Error fetching categories:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  const handleClickOpen = (category) => {
    if (addedItems.includes(category._id)) return; // منع الضغط إذا تمت الإضافة
    setSelectedCategory(category);
    setOpen(true);
    setErrorMessage('');
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedCategory(null);
    setValue('');
    setErrorMessage('');
  };

  // إرسال القيمة إلى الخادم بعد التحقق من صحة المدخلات
  const handleSubmit = async () => {
    if (!selectedCategory || !value) {
      setErrorMessage('يرجى إدخال قيمة صحيحة.');
      return;
    }

    const parsedValue = parseFloat(value);
    if (isNaN(parsedValue) || parsedValue < 0) {
      setErrorMessage('يرجى إدخال رقم عشري غير سالب.');
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
        console.error(error.response.data.error || 'لقد أضفت هذا العنصر بالفعل اليوم.');
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
      [type]: prev[type] + 12,
    }));
  };

  // خيارات البحث بناءً على أسماء التصنيفات
  const categoryOptions = categories.map((cat) => cat.categoryName);

  if (loading) {
    return (
      <Typography variant="h6" align="center" sx={{ mt: 4 }}>
        Loading...
      </Typography>
    );
  }

  // تصفية التصنيفات بناءً على البحث والنوع
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

  // تجميع التصنيفات بحسب النوع بعد التصفية
  const groupedCategories = filteredCategories.reduce((acc, category) => {
    if (!acc[category.categoryType]) {
      acc[category.categoryType] = [];
    }
    acc[category.categoryType].push(category);
    return acc;
  }, {});

  // دالة لإرجاع أيقونة التصنيف بناءً على النوع
  const getCategoryIcon = (type) =>
    type && type.toLowerCase().startsWith('expens') ? '💸' : '💰';

  return (
    <Container
      maxWidth="lg"
      sx={{
        py: { xs: 2, sm: 4 },
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #F0F8FF 0%, #E6F2FF 100%)',
        fontFamily: 'Arial, sans-serif',
      }}
    >
      <Typography
        variant="h2"
        align="center"
        sx={{
          fontWeight: 'bold',
          textTransform: 'uppercase',
          color: '#4A90E2',
          textShadow: '2px 2px 4px rgba(0,0,0,0.1)',
          letterSpacing: 2,
          transition: 'transform 0.3s ease-in-out',
          transform: `scale(${scale})`,
          cursor: 'pointer',
          mb: 4,
          fontSize: { xs: '2rem', md: '3rem' },
        }}
        onMouseEnter={() => setScale(1.1)}
        onMouseLeave={() => setScale(1)}
      >
        Finance Tracker
      </Typography>

      {/* حقل البحث مع اقتراحات تلقائية */}
      <Autocomplete
        freeSolo
        options={categoryOptions}
        onInputChange={(event, newInputValue) => setSearchQuery(newInputValue)}
        renderInput={(params) => (
          <TextField
            {...params}
            placeholder="ابحث عن صنف..."
            variant="outlined"
            sx={{
              mb: 4,
              backgroundColor: '#fff',
              borderRadius: '50px',
              '& .MuiOutlinedInput-root': {
                borderRadius: '50px',
                transition: 'box-shadow 0.3s ease, border-color 0.3s ease',
                '&:hover': {
                  boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
                },
                '&.Mui-focused': {
                  boxShadow: '0 0 8px rgba(74,144,226,0.6)',
                  borderColor: '#4A90E2',
                },
              },
            }}
            InputProps={{
              ...params.InputProps,
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
              endAdornment: (
                <>
                  {params.InputProps.endAdornment}
                  {searchQuery && (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setSearchQuery('')} edge="end">
                        <ClearIcon color="action" />
                      </IconButton>
                    </InputAdornment>
                  )}
                </>
              ),
            }}
          />
        )}
      />

      {/* مجموعة أزرار لتصفية التصنيفات */}
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
        <ButtonGroup variant="outlined" size="large" sx={{ borderRadius: '20px', overflow: 'hidden' }}>
          <Button
            onClick={() => setFilterType('all')}
            variant={filterType === 'all' ? 'contained' : 'outlined'}
            sx={{
              borderRadius: '20px 0 0 20px',
              textTransform: 'none',
              fontWeight: filterType === 'all' ? 'bold' : 'normal',
              borderColor: '#4A90E2',
              color: filterType === 'all' ? '#fff' : '#4A90E2',
              backgroundColor: filterType === 'all' ? '#4A90E2' : 'transparent',
              '&:hover': {
                backgroundColor: filterType === 'all' ? '#357ABD' : '#E6F2FF',
                borderColor: '#357ABD',
              },
              px: 3,
              py: 1.5,
            }}
          >
            All
          </Button>
          <Button
            onClick={() => setFilterType('income')}
            variant={filterType === 'income' ? 'contained' : 'outlined'}
            sx={{
              textTransform: 'none',
              fontWeight: filterType === 'income' ? 'bold' : 'normal',
              borderColor: '#4A90E2',
              color: filterType === 'income' ? '#fff' : '#4A90E2',
              backgroundColor: filterType === 'income' ? '#4A90E2' : 'transparent',
              '&:hover': {
                backgroundColor: filterType === 'income' ? '#357ABD' : '#E6F2FF',
                borderColor: '#357ABD',
              },
              px: 3,
              py: 1.5,
            }}
          >
            Revenues
          </Button>
          <Button
            onClick={() => setFilterType('expenses')}
            variant={filterType === 'expenses' ? 'contained' : 'outlined'}
            sx={{
              borderRadius: '0 20px 20px 0',
              textTransform: 'none',
              fontWeight: filterType === 'expenses' ? 'bold' : 'normal',
              borderColor: '#4A90E2',
              color: filterType === 'expenses' ? '#fff' : '#4A90E2',
              backgroundColor: filterType === 'expenses' ? '#4A90E2' : 'transparent',
              '&:hover': {
                backgroundColor: filterType === 'expenses' ? '#357ABD' : '#E6F2FF',
                borderColor: '#357ABD',
              },
              px: 3,
              py: 1.5,
            }}
          >
            Expenses
          </Button>
        </ButtonGroup>
      </Box>

      {Object.keys(groupedCategories).length === 0 ? (
        <Typography variant="h6" align="center" sx={{ color: '#666', mt: 2 }}>
          No Item found.
        </Typography>
      ) : (
        Object.keys(groupedCategories).map((type) => (
          <Box key={type} sx={{ mb: 6 }}>
            <Typography
              variant="h4"
              sx={{
                backgroundColor: '#4A90E2',
                color: '#FFFFFF',
                p: 2,
                borderRadius: 2,
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                mb: 3,
                display: 'flex',
                alignItems: 'center',
                gap: 1,
              }}
            >
              {getCategoryIcon(type)} {type}
            </Typography>
            {isSmallDevice ? (
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: 3,
                  justifyContent: 'center',
                }}
              >
                {groupedCategories[type]
                  .slice(0, visibleItems[type])
                  .map((category) => {
                    const isAdded = addedItems.includes(category._id);
                    return (
                      <Tooltip key={category._id} title={isAdded ? 'تمت الإضافة اليوم' : ''}>
                        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                          <CategoryCard
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
                                  width: { xs: 50, sm: 70 },
                                  height: { xs: 50, sm: 70 },
                                  borderRadius: '50%',
                                  mb: 1,
                                  objectFit: 'cover',
                                }}
                              />
                            )}
                            <Typography variant="h6" sx={{ color: '#4A90E2', fontWeight: 600 }}>
                              {category.categoryName}
                            </Typography>
                            {isAdded && (
                              <Typography variant="caption" sx={{ color: '#FF0000', fontWeight: 'bold', mt: 1 }}>
                                Added Today
                              </Typography>
                            )}
                          </CategoryCard>
                        </Box>
                      </Tooltip>
                    );
                  })}
              </Box>
            ) : (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, justifyContent: 'center' }}>
                {groupedCategories[type]
                  .slice(0, visibleItems[type])
                  .map((category) => {
                    const isAdded = addedItems.includes(category._id);
                    return (
                      <Tooltip key={category._id} title={isAdded ? 'تمت الإضافة اليوم' : ''}>
                        <Box>
                          <CategoryCard
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
                                  width: { xs: 50, sm: 70 },
                                  height: { xs: 50, sm: 70 },
                                  borderRadius: '50%',
                                  mb: 1,
                                  objectFit: 'cover',
                                }}
                              />
                            )}
                            <Typography variant="h6" sx={{ color: '#4A90E2', fontWeight: 600 }}>
                              {category.categoryName}
                            </Typography>
                            {isAdded && (
                              <Typography variant="caption" sx={{ color: '#FF0000', fontWeight: 'bold', mt: 1 }}>
                                Added Today
                              </Typography>
                            )}
                          </CategoryCard>
                        </Box>
                      </Tooltip>
                    );
                  })}
              </Box>
            )}
            {groupedCategories[type].length > visibleItems[type] && (
              <Box sx={{ textAlign: 'center', mt: 3 }}>
                <Button
                  onClick={() => handleLoadMore(type)}
                  sx={{
                    backgroundColor: '#4A90E2',
                    color: '#FFFFFF',
                    px: 3,
                    py: 1,
                    borderRadius: 2,
                    fontSize: 16,
                    '&:hover': {
                      backgroundColor: '#357ABD',
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

      {/* تحسين تصميم Dialog Box */}
      <Dialog
        open={open}
        onClose={handleClose}
        fullWidth
        maxWidth="xs"
        PaperProps={{
          sx: {
            minWidth: 320,
            borderRadius: '16px',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
            overflow: 'hidden',
          },
        }}
      >
        <DialogTitle
          sx={{
            background: 'linear-gradient(135deg, #4A90E2, #357ABD)',
            color: '#FFFFFF',
            p: 2,
            textAlign: 'center',
            fontSize: { xs: '1.5rem', sm: '2rem' },
            fontWeight: 'bold',
            borderTopLeftRadius: '16px',
            borderTopRightRadius: '16px',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {selectedCategory && getCategoryIcon(selectedCategory.categoryType)}{' '}
              {selectedCategory?.categoryName}
            </Box>
            <IconButton onClick={handleClose} sx={{ color: '#FFFFFF' }}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 3, textAlign: 'center', backgroundColor: '#FAFAFA' }}>
          {selectedCategory?.image && (
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
              }}
            />
          )}
          <Typography variant="subtitle1" sx={{ fontSize: 18, color: '#4A90E2', mb: 2, fontWeight: 500 }}>
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
            sx={{ mb: 2 }}
          />
          {errorMessage && (
            <Typography variant="body2" sx={{ color: '#4A90E2', textAlign: 'center' }}>
              {errorMessage}
            </Typography>
          )}
        </DialogContent>
        <DialogActions
          sx={{
            p: 2,
            justifyContent: 'center',
            gap: 2,
            backgroundColor: '#FAFAFA',
          }}
        >
          <Button
            onClick={handleClose}
            variant="outlined"
            sx={{
              borderColor: '#4A90E2',
              color: '#4A90E2',
              px: 3,
              py: 1,
              borderRadius: 2,
              fontSize: 16,
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={isSubmitting}
            sx={{
              backgroundColor: '#4A90E2',
              color: '#FFFFFF',
              px: 3,
              py: 1,
              borderRadius: 2,
              fontSize: 16,
              '&:hover': {
                backgroundColor: '#357ABD',
              },
            }}
          >
            {isSubmitting ? <CircularProgress size={24} sx={{ color: '#FFFFFF' }} /> : 'Submit'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default DashboardUser;