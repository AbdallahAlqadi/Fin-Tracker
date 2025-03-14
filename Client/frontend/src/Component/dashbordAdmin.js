import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../cssStyle/dashbord.css';

const CategoryForm = ({ onCategoryAdded }) => {
  const [categoryName, setCategoryName] = useState('');
  const [categoryType, setCategoryType] = useState('');
  const [image, setImage] = useState(null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size must be less than 5 MB');
        return;
      }
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        alert('Please upload an image in JPEG, PNG, or GIF format only');
        return;
      }
      setImage(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!categoryName || !categoryType || !image) {
      alert('Please fill in all fields');
      return;
    }
    const formData = new FormData();
    formData.append('categoryName', categoryName);
    formData.append('categoryType', categoryType);
    formData.append('image', image);
    try {
      const response = await axios.post(
        'https://fin-tracker-ncbx.onrender.com/api/category',
        formData
      );
      console.log('Successfully submitted:', response.data);
      setCategoryName('');
      setCategoryType('');
      setImage(null);
      onCategoryAdded(response.data.data);
    } catch (error) {
      console.error('Error submitting form:', error);
      alert(
        'Error submitting form: ' +
          (error.response?.data?.message || error.message)
      );
    }
  };

  return (
    <div className="form-container">
      <form onSubmit={handleSubmit} className="category-form">
        <div className="input-group">
          <label htmlFor="categoryName">Category Name:</label>
          <input
            type="text"
            id="categoryName"
            value={categoryName}
            onChange={(e) => setCategoryName(e.target.value)}
            required
            placeholder="Enter category name"
          />
        </div>
        <div className="input-group">
          <label htmlFor="categoryType">Category Type:</label>
          <select
            id="categoryType"
            value={categoryType}
            onChange={(e) => setCategoryType(e.target.value)}
            required
          >
            <option value="">Category Type</option>
            <option value="Expenses">Expenses</option>
            <option value="Revenues">Revenues</option>
          </select>
        </div>
        <div className="input-group">
          <label htmlFor="image">Upload Image:</label>
          <input type="file" id="image" onChange={handleImageChange} required />
        </div>
        <button type="submit" className="submit-btn">
          Submit
        </button>
      </form>
    </div>
  );
};

const CategoryList = ({ categories, onDelete, onUpdate }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [newImage, setNewImage] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);

  const expenses = categories.filter((cat) => cat.categoryType === 'Expenses');
  const revenues = categories.filter((cat) => cat.categoryType === 'Revenues');

  const handleUpdateImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size must be less than 5 MB');
        return;
      }
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        alert('Please upload an image in JPEG, PNG, or GIF format only');
        return;
      }
      setNewImage(file);
    }
  };

  const handleModalSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('_id', selectedCategory._id);
    formData.append('categoryName', selectedCategory.categoryName);
    formData.append('categoryType', selectedCategory.categoryType);
    if (newImage) {
      formData.append('image', newImage);
    }
    onUpdate(formData);
    setIsModalOpen(false);
    setNewImage(null);
  };

  const handleDeleteClick = (id) => {
    setCategoryToDelete(id);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    onDelete(categoryToDelete);
    setShowDeleteConfirm(false);
    setCategoryToDelete(null);
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setCategoryToDelete(null);
  };

  const renderCategoryCard = (cat) => {
    const color = cat.categoryType === 'Expenses' ? 'red' : 'blue';
    return (
      <div
        key={cat._id}
        className="category-card"
        style={{ border: `2px solid ${color}` }}
      >
        <div className="card-image">
          {cat.image ? (
            <img
              src={
                cat.image.startsWith('data:')
                  ? cat.image
                  : `https://fin-tracker-ncbx.onrender.com/${cat.image}`
              }
              alt={cat.categoryName}
            />
          ) : (
            <span className="placeholder-icon">💰</span>
          )}
        </div>
        <div className="card-content">
          <h3>{cat.categoryName}</h3>
          <p style={{ color: color, fontWeight: 'bold' }}>
            {cat.categoryType}
          </p>
        </div>
        <div className="card-actions">
          <button
            className="edit-btn"
            onClick={() => {
              setSelectedCategory(cat);
              setIsModalOpen(true);
            }}
          >
            Edit
          </button>
          <button
            className="delete-btn"
            onClick={() => handleDeleteClick(cat._id)}
          >
            Delete
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="category-list-container">
      {categories.length === 0 && <p>No Categories</p>}

      {expenses.length > 0 && (
        <div className="category-section">
          <h2 className="section-title">Expenses</h2>
          <div className="category-cards">
            {expenses.map((cat) => renderCategoryCard(cat))}
          </div>
        </div>
      )}

      {revenues.length > 0 && (
        <div className="category-section">
          <h2 className="section-title">Revenues</h2>
          <div className="category-cards">
            {revenues.map((cat) => renderCategoryCard(cat))}
          </div>
        </div>
      )}

      {isModalOpen && selectedCategory && (
        <div className="modal">
          <div className="modal-content">
            <button className="modal-close" onClick={() => setIsModalOpen(false)}>
              ×
            </button>
            <form onSubmit={handleModalSubmit} className="modal-form">
              <div className="input-group">
                <label>Category Name:</label>
                <input
                  type="text"
                  value={selectedCategory.categoryName}
                  onChange={(e) =>
                    setSelectedCategory({
                      ...selectedCategory,
                      categoryName: e.target.value,
                    })
                  }
                  required
                />
              </div>
              <div className="input-group">
                <label>Category Type:</label>
                <select
                  value={selectedCategory.categoryType}
                  onChange={(e) =>
                    setSelectedCategory({
                      ...selectedCategory,
                      categoryType: e.target.value,
                    })
                  }
                  required
                >
                  <option value="">Select Type</option>
                  <option value="Expenses">Expenses</option>
                  <option value="Revenues">Revenues</option>
                </select>
              </div>
              <div className="input-group">
                <label>Update Image (Optional):</label>
                <input type="file" onChange={handleUpdateImageChange} />
              </div>
              <button type="submit" className="save-btn">
                Save
              </button>
            </form>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="modal">
          <div className="modal-content">
            <h3>تأكيد الحذف</h3>
            <p>هل أنت متأكد من حذف هذا التصنيف؟</p>
            <div className="modal-actions">
              <button className="confirm-btn" onClick={confirmDelete}>
                نعم
              </button>
              <button className="cancel-btn" onClick={cancelDelete}>
                لا
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const CombinedPage = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await axios.get('https://fin-tracker-ncbx.onrender.com/api/getcategories');
      setCategories(res.data.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleCategoryAdded = (newCategory) => {
    setCategories([...categories, newCategory]);
    setSuccessMessage('تمت إضافة التصنيف بنجاح!');
    setTimeout(() => setSuccessMessage(''), 3000); // إخفاء الرسالة بعد 3 ثوانٍ
  };

  const handleDelete = async (id) => {
    try {
      const res = await axios.delete(
        `https://fin-tracker-ncbx.onrender.com/api/deletecategory/${id}`
      );
      if (res.status === 200) {
        setCategories(categories.filter((cat) => cat._id !== id));
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const handleUpdate = async (formData) => {
    try {
      const id = formData.get('_id');
      const res = await axios.put(
        `https://fin-tracker-ncbx.onrender.com/api/updatecategory/${id}`,
        formData
      );
      if (res.status === 200) {
        setCategories(
          categories.map((cat) => (cat._id === id ? res.data.data : cat))
        );
      }
    } catch (err) {
      alert(
        'خطأ في تحديث التصنيف: ' +
          (err.response?.data?.message || err.message)
      );
    }
  };

  return (
    <div className="combined-page">
      <CategoryForm onCategoryAdded={handleCategoryAdded} />
      {successMessage && <div className="success-message">{successMessage}</div>}
      {loading && <p>جارٍ تحميل التصنيفات...</p>}
      {error && <p>خطأ: {error}</p>}
      <CategoryList
        categories={categories}
        onDelete={handleDelete}
        onUpdate={handleUpdate}
      />
    </div>
  );
};

export default CombinedPage;