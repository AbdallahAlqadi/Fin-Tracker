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
  Tooltip,
  CircularProgress,
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
  const [searchQuery, setSearchQuery] = useState('');
  // حالة لتتبع العناصر التي تم إضافة قيمتها اليوم (يتم جلبها من الخادم)
  const [addedItems, setAddedItems] = useState([]);
  // حالة لتتبع عملية الإرسال
  const [isSubmitting, setIsSubmitting] = useState(false);

  // دالة للحصول على تاريخ اليوم بتوقيت عمّان بصيغة "YYYY-MM-DD"
  const getTodayDate = () => {
    return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Amman" });
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

  // جلب العناصر التي تمت إضافتها اليوم من الخادم
  useEffect(() => {
    const fetchAddedItems = async () => {
      try {
        const token = sessionStorage.getItem('jwt');
        const response = await axios.get('https://fin-tracker-ncbx.onrender.com/api/getBudget', {
          headers: { Auth: `Bearer ${token}` },
        });
        // نفترض أن الكائن budget يحتوي على مصفوفة المنتجات في الخاصية products
        const budget = response.data.budget;
        const today = getTodayDate();
        if (budget && budget.products) {
          const addedToday = budget.products
            .filter((product) => product.date === today)
            .map((product) => product.CategoriesId);
          setAddedItems(addedToday);
        }
      } catch (error) {
        console.error('Error fetching today’s budget items:', error);
      }
    };

    fetchAddedItems();
  }, []);

  // فتح نافذة الإدخال لعنصر معين إذا لم تتم إضافته اليوم
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

  // إرسال القيمة إلى الخادم مع التحقق من أن القيمة المدخلة رقم عشري وغير سالبة
  const handleSubmit = async () => {
    if (!selectedCategory || !value) {
      setErrorMessage('يرجى إدخال قيمة صحيحة.');
      return;
    }

    // التحقق من أن القيمة هي رقم عشري وغير سالبة
    const parsedValue = parseFloat(value);
    if (isNaN(parsedValue) || parsedValue < 0) {
      setErrorMessage('يرجى إدخال رقم عشري غير سالب.');
      return;
    }

    setIsSubmitting(true);
    const token = sessionStorage.getItem('jwt');

    try {
      const response = await axios.post(
        'https://fin-tracker-ncbx.onrender.com/api/addBudget',
        {
          CategoriesId: selectedCategory._id,
          valueitem: parsedValue, // إرسال القيمة كرقم عشري
        },
        {
          headers: {
            Auth: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      console.log('Response:', response.data);
      // تحديث الحالة بحيث لا يمكن إعادة الإضافة لنفس العنصر في اليوم ذاته
      setAddedItems((prev) => [...prev, selectedCategory._id]);
      handleClose();
    } catch (error) {
      if (error.response && error.response.status === 400) {
        // في حالة الخطأ (مثلاً تم إضافة العنصر سابقاً اليوم) يتم منع الإعادة
        setErrorMessage(error.response.data.error || 'لقد أضفت هذا العنصر بالفعل اليوم.');
        setAddedItems((prev) => [...prev, selectedCategory._id]);
      } else {
        console.error('Error submitting value:', error);
        setErrorMessage('حدث خطأ أثناء الإرسال. حاول مرة أخرى.');
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

  if (loading) {
    return (
      <Typography variant="h6" align="center" sx={{ mt: 4 }}>
        Loading...
      </Typography>
    );
  }

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

  // دالة لإرجاع أيقونة التصنيف حسب النوع
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

      {/* حقل البحث */}
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
                .map((category) => {
                  const isAdded = addedItems.includes(category._id);
                  return (
                    <Tooltip key={category._id} title={isAdded ? "تمت الإضافة اليوم" : ""}>
                      <Box>
                        <CategoryCard
                          onClick={() => handleClickOpen(category)}
                          sx={{
                            opacity: isAdded ? 0.6 : 1,
                            pointerEvents: isAdded ? 'none' : 'auto',
                          }}
                        >
                          {category.image && (
                            <Box
                              component="img"
                              src={`https://fin-tracker-ncbx.onrender.com/${category.image}`}
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

      {/* نافذة الحوار لإدخال القيمة للعنصر المختار */}
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
              src={`https://fin-tracker-ncbx.onrender.com/${selectedCategory.image}`}
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
            inputProps={{ step: "0.01", min: "0" }}  // للسماح بالأرقام العشرية ومنع الأرقام السالبة
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
    </Box>
  );
};

export default DashboardUser;
