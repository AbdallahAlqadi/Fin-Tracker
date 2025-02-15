// CombinedPage.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../cssStyle/dashbord.css'; // تأكد من وجود ملف CSS الخاص بك

// مكون إنشاء التصنيف
const CategoryForm = ({ onCategoryAdded }) => {
  const [categoryName, setCategoryName] = useState('');
  const [categoryType, setCategoryType] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState(null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // التحقق من حجم الصورة (أقل من 5 ميجابايت)
      if (file.size > 5 * 1024 * 1024) {
        alert('حجم الصورة يجب أن يكون أقل من 5 ميجابايت');
        return;
      }
      // التحقق من نوع الصورة
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        alert('يرجى تحميل صورة بصيغة JPEG أو PNG أو GIF فقط');
        return;
      }
      setImageFile(file);
      // إعداد معاينة للصورة
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!categoryName || !categoryType || !imageFile) {
      alert('يرجى ملء جميع الحقول');
      return;
    }

    // تجهيز البيانات باستخدام FormData
    const formData = new FormData();
    formData.append('categoryName', categoryName);
    formData.append('categoryType', categoryType);
    formData.append('image', imageFile);

    try {
      const response = await axios.post(
        'https://fin-tracker-ncbx.onrender.com/api/category',
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      console.log('Success:', response.data);
      // إعادة تعيين الحقول بعد الإرسال
      setCategoryName('');
      setCategoryType('');
      setImageFile(null);
      setPreview(null);
      // إعلام الصفحة الرئيسية بوجود تصنيف جديد
      onCategoryAdded(response.data.data);
    } catch (error) {
      console.error('Error submitting data:', error);
      alert(
        'حدث خطأ أثناء إرسال البيانات: ' +
          (error.response?.data?.message || error.message)
      );
    }
  };

  return (
    <div className="form-container">
      <form onSubmit={handleSubmit}>
        <div className="input-group">
          <label htmlFor="categoryName">Category Name:</label>
          <input
            type="text"
            id="categoryName"
            value={categoryName}
            onChange={(e) => setCategoryName(e.target.value)}
            required
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
            <option value="">Select a type</option>
            <option value="Expenses">Expenses</option>
            <option value="Revenues">Revenues</option>
          </select>
        </div>
        <div className="input-group">
          <label htmlFor="image">Upload Image:</label>
          <input type="file" id="image" onChange={handleImageChange} required />
          {preview && (
            <img
              src={preview}
              alt="Preview"
              style={{ width: '100px', marginTop: '10px' }}
            />
          )}
        </div>
        <button type="submit">Submit</button>
      </form>
    </div>
  );
};

// مكون قائمة التصنيفات مع إمكانية التحديث والحذف
const CategoryList = ({ categories, onDelete, onUpdate }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [newImageFile, setNewImageFile] = useState(null);
  const [preview, setPreview] = useState(null);

  const handleUpdateImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('حجم الصورة يجب أن يكون أقل من 5 ميجابايت');
        return;
      }
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        alert('يرجى تحميل صورة بصيغة JPEG أو PNG أو GIF فقط');
        return;
      }
      setNewImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    // تجهيز بيانات التحديث باستخدام FormData
    const formData = new FormData();
    formData.append('categoryName', selectedCategory.categoryName);
    formData.append('categoryType', selectedCategory.categoryType);
    if (newImageFile) {
      formData.append('image', newImageFile);
    }
    try {
      await onUpdate(selectedCategory._id, formData);
      setIsModalOpen(false);
      setNewImageFile(null);
      setPreview(null);
    } catch (error) {
      console.error('Error updating category:', error);
      alert('Error updating category: ' + error.message);
    }
  };

  return (
    <div className="category-list-container">
      {categories.length === 0 && (
        <p className="no-categories-text">No categories found.</p>
      )}
      {categories.map((category) => (
        <div key={category._id} className="category-item">
          <div className="category-image-container">
            {category.image ? (
              <img
                src={`https://fin-tracker-ncbx.onrender.com/${category.image}`}
                alt={category.categoryName || 'Category Image'}
                className="category-image"
              />
            ) : (
              <span style={{ fontSize: '28px', color: '#a0aec0' }}>💰</span>
            )}
          </div>
          <p className="category-name">{category.categoryName}</p>
          <button
            className="update-button"
            onClick={() => {
              setSelectedCategory(category);
              setIsModalOpen(true);
            }}
          >
            Update
          </button>
          <button
            className="delete-button"
            onClick={() => onDelete(category._id)}
          >
            Delete
          </button>
        </div>
      ))}
      {isModalOpen && selectedCategory && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button
              className="modal-close-button"
              onClick={() => {
                setIsModalOpen(false);
                setNewImageFile(null);
                setPreview(null);
              }}
            >
              ×
            </button>
            <h2 className="modal-title">Edit Category</h2>
            <form onSubmit={handleUpdateSubmit}>
              <div className="input-group">
                <label htmlFor="updateCategoryName">Category Name:</label>
                <input
                  type="text"
                  id="updateCategoryName"
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
                <label htmlFor="updateCategoryType">Category Type:</label>
                <select
                  id="updateCategoryType"
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
                  <option value="Revenues">Revenues</option>
                  <option value="Expenses">Expenses</option>
                </select>
              </div>
              <div className="input-group">
                <label htmlFor="updateImage">Update Image (optional):</label>
                <input
                  type="file"
                  id="updateImage"
                  onChange={handleUpdateImageChange}
                />
                {preview && (
                  <img
                    src={preview}
                    alt="Preview"
                    style={{ width: '100px', marginTop: '10px' }}
                  />
                )}
              </div>
              <div className="modal-buttons">
                <button type="submit" className="save-button">
                  Save
                </button>
                <button
                  type="button"
                  className="cancel-button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setNewImageFile(null);
                    setPreview(null);
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// المكون الرئيسي الذي يجمع بين كل الوظائف
const CombinedPage = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // استرجاع التصنيفات من الخادم
  const fetchCategories = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(
        'https://fin-tracker-ncbx.onrender.com/api/getcategories'
      );
      setCategories(response.data.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // إضافة تصنيف جديد إلى القائمة
  const handleCategoryAdded = (newCategory) => {
    setCategories([...categories, newCategory]);
  };

  // حذف تصنيف
  const handleDelete = async (id) => {
    try {
      const response = await axios.delete(
        `https://fin-tracker-ncbx.onrender.com/api/deletecategory/${id}`
      );
      if (response.status === 200) {
        setCategories(categories.filter((cat) => cat._id !== id));
      }
    } catch (err) {
      alert('Error deleting category: ' + err.message);
    }
  };

  // تحديث تصنيف
  const handleUpdate = async (id, formData) => {
    try {
      const response = await axios.put(
        `https://fin-tracker-ncbx.onrender.com/api/updatecategory/${id}`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      if (response.status === 200) {
        setCategories(
          categories.map((cat) => (cat._id === id ? response.data.data : cat))
        );
      }
    } catch (err) {
      alert(
        'Error updating category: ' +
          (err.response?.data?.message || err.message)
      );
    }
  };

  return (
    <div className="combined-page">
      <h1>Category Management</h1>
      <CategoryForm onCategoryAdded={handleCategoryAdded} />
      {loading ? (
        <p>Loading categories...</p>
      ) : error ? (
        <p>Error: {error}</p>
      ) : (
        <CategoryList
          categories={categories}
          onDelete={handleDelete}
          onUpdate={handleUpdate}
        />
      )}
    </div>
  );
};

export default CombinedPage;
