import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
} from '@mui/material';
import { styled, keyframes } from '@mui/system';

// حركة انسيابية للبطاقات
const floatAnimation = keyframes`
  0% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
  100% { transform: translateY(0); }
`;

// بطاقة التصنيف بتصميم حديث
const CategoryCard = styled(Box)(({ theme }) => ({
  border: '2px solid #4A90E2',
  backgroundColor: '#FFFFFF',
  borderRadius: '16px',
  padding: '20px',
  width: '180px',
  height: '180px',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  textAlign: 'center',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
  cursor: 'pointer',
  transition: 'transform 0.2s, box-shadow 0.2s',
  '&:hover': {
    transform: 'scale(1.05)',
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
    animation: `${floatAnimation} 2s ease-in-out infinite`,
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
  const [searchQuery, setSearchQuery] = useState(''); // حالة لحفظ قيمة البحث

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get('http://127.0.0.1:5004/api/getcategories');
        setCategories(response.data.data);
        const initialVisibleItems = response.data.data.reduce((acc, category) => {
          if (!acc[category.categoryType]) {
            acc[category.categoryType] = 12; // إظهار أول 12 عنصر افتراضياً
          }
          return acc;
        }, {});
        setVisibleItems(initialVisibleItems);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleClickOpen = (category) => {
    setSelectedCategory(category);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedCategory(null);
    setValue('');
    setErrorMessage('');
  };

  const handleSubmit = async () => {
    if (!selectedCategory || !value) return;

    const token = sessionStorage.getItem('jwt');

    try {
      const response = await axios.post(
        'http://127.0.0.1:5004/api/addBudget',
        {
          CategoriesId: selectedCategory._id,
          valueitem: value,
        },
        {
          headers: {
            Auth: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      console.log('Response:', response.data);
      handleClose();
    } catch (error) {
      if (error.response && error.response.status === 400) {
        setErrorMessage('لقد اضفت هذا العنصر بالفعل اليوم.');
      } else {
        console.error('Error submitting value:', error);
      }
    }
  };

  const handleLoadMore = (type) => {
    setVisibleItems((prev) => ({
      ...prev,
      [type]: prev[type] + 12,
    }));
  };

  if (loading)
    return (
      <Typography variant="h6" align="center" sx={{ mt: 4 }}>
        Loading...
      </Typography>
    );

  // تصفية التصنيفات بناءً على قيمة البحث (غير حساس لحالة الأحرف)
  const filteredCategories = categories.filter((category) =>
    category.categoryName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // تجميع التصنيفات بحسب النوع بعد التصفية
  const groupedCategories = filteredCategories.reduce((acc, category) => {
    if (!acc[category.categoryType]) {
      acc[category.categoryType] = [];
    }
    acc[category.categoryType].push(category);
    return acc;
  }, {});

  // دالة لإرجاع أيقونة التصنيف
  const getCategoryIcon = (type) => (type === 'Expense' ? '💸' : '💰');

  return (
    <Box
      sx={{
        p: 4,
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #F0F8FF 0%, #E6F2FF 100%)',
        fontFamily: 'Arial, sans-serif',
      }}
    >
      {/* العنوان الرئيسي مع تأثير تكبير عند المرور */}
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
        }}
        onMouseEnter={() => setScale(1.1)}
        onMouseLeave={() => setScale(1)}
      >
        Finance Tracker
      </Typography>

      {/* حقل البحث لإيجاد التصنيفات */}
      <TextField
        label="Search Item"
        variant="outlined"
        fullWidth
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        sx={{ mb: 4 }}
      />

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
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
              {groupedCategories[type]
                .slice(0, visibleItems[type])
                .map((category) => (
                  <CategoryCard key={category._id} onClick={() => handleClickOpen(category)}>
                    {category.image && (
                      <Box
                        component="img"
                        src={`http://127.0.0.1:5004/${category.image}`}
                        alt={category.categoryName}
                        sx={{
                          width: 70,
                          height: 70,
                          borderRadius: '50%',
                          mb: 1,
                          objectFit: 'cover',
                        }}
                      />
                    )}
                    <Typography variant="h6" sx={{ color: '#4A90E2', fontWeight: 600 }}>
                      {category.categoryName}
                    </Typography>
                  </CategoryCard>
                ))}
            </Box>
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

      {/* نافذة الحوار لإدخال القيمة */}
      <Dialog
        open={open}
        onClose={handleClose}
        fullWidth
        maxWidth="xs"
        PaperProps={{
          sx: {
            minWidth: 320,
            borderRadius: 2,
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
          },
        }}
      >
        <DialogTitle
          sx={{
            backgroundColor: '#4A90E2',
            color: '#FFFFFF',
            p: 2,
            textAlign: 'center',
            fontSize: 24,
            fontWeight: 'bold',
            borderRadius: '2px 2px 0 0',
          }}
        >
          {selectedCategory?.categoryName}
        </DialogTitle>
        <DialogContent sx={{ p: 3, textAlign: 'center' }}>
          {selectedCategory?.image && (
            <Box
              component="img"
              src={`http://127.0.0.1:5004/${selectedCategory.image}`}
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
          <Typography
            variant="subtitle1"
            sx={{ fontSize: 18, color: '#4A90E2', mb: 2, fontWeight: 500 }}
          >
            Type: {selectedCategory?.categoryType}
          </Typography>
          <TextField
            autoFocus
            margin="dense"
            label="Value"
            type="number"
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
        <DialogActions sx={{ p: 2, justifyContent: 'center', gap: 2 }}>
          <Button
            onClick={handleClose}
            sx={{
              backgroundColor: '#FFFFFF',
              color: '#4A90E2',
              px: 3,
              py: 1,
              borderRadius: 2,
              border: '2px solid #4A90E2',
              fontSize: 16,
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
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
            Submit
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DashboardUser;
