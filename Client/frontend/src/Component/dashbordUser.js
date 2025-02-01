import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import { styled } from '@mui/system';
import { keyframes } from '@emotion/react';

// Animation for category cards
const float = keyframes`
  0% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
  100% { transform: translateY(0); }
`;

const CategoryCard = styled('div')(({ theme, type }) => ({
  border: `2px solid ${type === 'Expense' ? '#FF6B6B' : '#4A90E2'}`,
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
    animation: `${float} 2s ease-in-out infinite`,
  },
}));

const DashboardUser = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [value, setValue] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get('http://127.0.0.1:5004/api/getcategories');
        setCategories(response.data.data);
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
      console.error('Error submitting value:', error);
    }
  };

  if (loading) return <p>Loading...</p>;

  const groupedCategories = categories.reduce((acc, category) => {
    if (!acc[category.categoryType]) {
      acc[category.categoryType] = [];
    }
    acc[category.categoryType].push(category);
    return acc;
  }, {});

  const getCategoryIcon = (type) => {
    return type === 'Expense' ? '💸' : '💰';
  };

  return (
    <div style={{ padding: '40px', fontFamily: 'Arial, sans-serif', backgroundColor: '#F5F7FA' }}>
      <h1
        style={{
          textAlign: 'center',
          marginBottom: '40px',
          fontSize: '42px',
          fontWeight: '700',
          color: '#2c3e50',
          textShadow: '2px 2px 4px rgba(0, 0, 0, 0.1)',
          fontFamily: '"Poppins", sans-serif',
        }}
      >
        Categories
      </h1>

      {Object.keys(groupedCategories).length === 0 ? (
        <p style={{ textAlign: 'center', color: '#666', fontSize: '18px' }}>No categories found.</p>
      ) : (
        Object.keys(groupedCategories).map((type) => (
          <div key={type} style={{ marginBottom: '40px' }}>
            <h2
              style={{
                backgroundColor: type === 'Expense' ? '#FFF0F0' : '#F0F8FF',
                color: type === 'Expense' ? '#FF6B6B' : '#4A90E2',
                padding: '15px 20px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                fontSize: '24px',
                fontWeight: '600',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                marginBottom: '20px',
              }}
            >
              {getCategoryIcon(type)} {type}
            </h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', marginTop: '10px' }}>
              {groupedCategories[type].map((category) => (
                <CategoryCard
                  key={category._id}
                  type={category.categoryType}
                  onClick={() => handleClickOpen(category)}
                >
                  {category.image && (
                    <img
                      src={`http://127.0.0.1:5004/${category.image}`}
                      alt={category.categoryName}
                      style={{
                        width: '70px',
                        height: '70px',
                        borderRadius: '50%',
                        marginBottom: '10px',
                        objectFit: 'cover',
                      }}
                    />
                  )}
                  <h3 style={{ fontSize: '16px', color: type === 'Expense' ? '#FF6B6B' : '#4A90E2', fontWeight: '500' }}>
                    {category.categoryName}
                  </h3>
                </CategoryCard>
              ))}
            </div>
          </div>
        ))
      )}

      <Dialog
        open={open}
        onClose={handleClose}
        fullWidth
        maxWidth="xs"
        PaperProps={{
          style: { minWidth: '320px', borderRadius: '15px', boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)' },
        }}
      >
        <DialogTitle
          style={{
            backgroundColor: selectedCategory?.categoryType === 'Expense' ? '#FFF0F0' : '#F0F8FF',
            color: selectedCategory?.categoryType === 'Expense' ? '#FF6B6B' : '#4A90E2',
            padding: '20px',
            textAlign: 'center',
            fontSize: '24px',
            fontWeight: '700',
            borderRadius: '15px 15px 0 0',
            fontFamily: '"Poppins", sans-serif',
          }}
        >
          {selectedCategory?.categoryName}
        </DialogTitle>
        <DialogContent style={{ padding: '20px', textAlign: 'center' }}>
          {selectedCategory?.image && (
            <img
              src={`http://127.0.0.1:5004/${selectedCategory.image}`}
              alt={selectedCategory.categoryName}
              style={{
                width: '100px',
                height: '100px',
                borderRadius: '50%',
                marginBottom: '20px',
                objectFit: 'cover',
              }}
            />
          )}
          <p
            style={{
              fontSize: '18px',
              color: selectedCategory?.categoryType === 'Expense' ? '#FF6B6B' : '#4A90E2',
              marginBottom: '20px',
              fontWeight: '500',
            }}
          >
            Type: {selectedCategory?.categoryType}
          </p>
          <TextField
            autoFocus
            margin="dense"
            label="Value"
            type="number"
            fullWidth
            variant="outlined"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            style={{ marginBottom: '20px' }}
          />
        </DialogContent>
        <DialogActions style={{ padding: '20px', justifyContent: 'center' }}>
          <Button
            onClick={handleClose}
            style={{
              backgroundColor: '#FF6B6B',
              color: '#FFFFFF',
              padding: '10px 20px',
              borderRadius: '8px',
              marginRight: '10px',
              fontWeight: '500',
              textTransform: 'none',
              fontSize: '16px',
              '&:hover': {
                backgroundColor: '#FF4C4C',
              },
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            style={{
              backgroundColor: '#4A90E2',
              color: '#FFFFFF',
              padding: '10px 20px',
              borderRadius: '8px',
              fontWeight: '500',
              textTransform: 'none',
              fontSize: '16px',
              '&:hover': {
                backgroundColor: '#357ABD',
              },
            }}
          >
            Submit
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default DashboardUser;