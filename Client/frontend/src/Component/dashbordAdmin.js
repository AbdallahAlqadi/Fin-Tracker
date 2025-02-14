// CombinedPage.jsx
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
      // التحقق من حجم الصورة (50 ميجابايت كحد أقصى)
      if (file.size > 50 * 1024 * 1024) {
        alert('حجم الصورة يجب أن يكون أقل من 50 ميجابايت');
        return;
      }
      // التحقق من نوع الصورة
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        alert('يرجى تحميل صورة بصيغة JPEG أو PNG أو GIF فقط');
        return;
      }
      setImage(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!categoryName || !categoryType || !image) {
      alert('يرجى ملء جميع الحقول');
      return;
    }

    // استخدام FileReader لتحويل الصورة إلى DataURL
    const reader = new FileReader();
    reader.onload = async function () {
      const imgData = reader.result; // ستكون النتيجة بصيغة DataURL

      const data = {
        categoryName,
        categoryType,
        image: imgData,
      };

      try {
        const response = await axios.post(
          'https://fin-tracker-ncbx.onrender.com/api/category',
          data,
          { headers: { 'Content-Type': 'application/json' } }
        );
        console.log('Success:', response.data);

        setCategoryName('');
        setCategoryType('');
        setImage(null);

        // إعلام الصفحة الرئيسية بوجود تصنيف جديد
        onCategoryAdded(response.data.data);
      } catch (error) {
        console.error('Error submitting data:', error);
        alert('حدث خطأ أثناء إرسال البيانات: ' + (error.response?.data?.message || error.message));
      }
    };

    reader.readAsDataURL(image);
  };

  return (
    <div className="form-container">
      <form onSubmit={handleSubmit} id="categoryForm">
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
        </div>
        <button type="submit">Submit</button>
      </form>
    </div>
  );
};

const CategoryList = ({ categories, onDelete, onUpdate, setCategories }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [newImage, setNewImage] = useState(null);

  const categorizedData = categories.reduce((acc, category) => {
    const type = category.categoryType || 'Uncategorized';
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(category);
    return acc;
  }, {});

  const chunkArray = (array, size) => {
    const result = [];
    for (let i = 0; i < array.length; i += size) {
      result.push(array.slice(i, i + size));
    }
    return result;
  };

  const handleUpdateImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 50 * 1024 * 1024) {
        alert('حجم الصورة يجب أن يكون أقل من 50 ميجابايت');
        return;
      }
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        alert('يرجى تحميل صورة بصيغة JPEG أو PNG أو GIF فقط');
        return;
      }
      setNewImage(file);
    }
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();

    // إعداد البيانات للتحديث
    const data = {
      categoryName: selectedCategory.categoryName,
      categoryType: selectedCategory.categoryType,
    };

    // إذا تم اختيار صورة جديدة، نستخدم FileReader لتحويلها إلى DataURL
    if (newImage) {
      const reader = new FileReader();
      reader.onload = async function () {
        data.image = reader.result;
        await sendUpdate(data);
      };
      reader.readAsDataURL(newImage);
    } else {
      await sendUpdate(data);
    }
  };

  const sendUpdate = async (data) => {
    try {
      const id = selectedCategory._id;
      const response = await axios.put(
        `https://fin-tracker-ncbx.onrender.com/api/updatecategory/${id}`,
        data,
        { headers: { 'Content-Type': 'application/json' } }
      );
      if (response.status === 200) {
        setCategories((prevCategories) =>
          prevCategories.map((cat) => (cat._id === id ? response.data : cat))
        );
      }
      setNewImage(null);
      setIsModalOpen(false);
    } catch (error) {
      alert('Error updating category: ' + (error.response?.data?.message || error.message));
    }
  };

  return (
    <div className="category-list-container">
      {categories.length === 0 && <p className="no-categories-text">No categories found.</p>}
      {Object.keys(categorizedData).length > 0 && (
        <div>
          {Object.entries(categorizedData).map(([type, items]) => (
            <div key={type} className="category-type-container">
              <h2 className="category-type-title">{type}</h2>
              {chunkArray(items, 5).map((chunk, index) => (
                <div key={index} className="category-chunk">
                  {chunk.map((category) => (
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
                      <button className="delete-button" onClick={() => onDelete(category._id)}>
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
      {isModalOpen && selectedCategory && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button className="modal-close-button" onClick={() => setIsModalOpen(false)}>
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
                  placeholder="Category Name"
                  className="modal-input"
                  required
                />
              </div>
              <div className="input-group">
                <label htmlFor="updateCategoryType">Category Type:</label>
                <select
                  id="updateCategoryType"
                  value={selectedCategory.categoryType || ''}
                  onChange={(e) =>
                    setSelectedCategory({
                      ...selectedCategory,
                      categoryType: e.target.value,
                    })
                  }
                  className="modal-select"
                  required
                >
                  <option value="">Select Type</option>
                  <option value="Revenues">Revenues</option>
                  <option value="Expenses">Expenses</option>
                </select>
              </div>
              <div className="input-group">
                <label htmlFor="updateImage">Update Image (optional):</label>
                <input type="file" id="updateImage" onChange={handleUpdateImageChange} />
              </div>
              <div className="modal-buttons">
                <button type="submit" className="save-button">
                  Save
                </button>
                <button type="button" onClick={() => setIsModalOpen(false)} className="cancel-button">
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

const CombinedPage = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCategories = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get('https://fin-tracker-ncbx.onrender.com/api/getcategories');
      setCategories(response.data.data);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleCategoryAdded = (newCategory) => {
    setCategories([...categories, newCategory]);
  };

  const handleDelete = async (id) => {
    try {
      const response = await axios.delete(`https://fin-tracker-ncbx.onrender.com/api/deletecategory/${id}`);
      if (response.status === 200) {
        setCategories(categories.filter((category) => category._id !== id));
      }
    } catch (error) {
      alert(error.message);
    }
  };

  const handleUpdate = (data) => {
    // عملية التحديث تتم داخل مكون CategoryList
  };

  return (
    <>
      <CategoryForm onCategoryAdded={handleCategoryAdded} />
      {loading && <p className="loading-text">Loading categories...</p>}
      {error && <p className="error-text">Error: {error}</p>}
      <CategoryList categories={categories} onDelete={handleDelete} onUpdate={handleUpdate} setCategories={setCategories} />
    </>
  );
};

export default CombinedPage;
