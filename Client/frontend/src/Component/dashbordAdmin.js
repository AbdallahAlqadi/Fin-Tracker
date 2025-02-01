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
      if (file.size > 10 * 1024 * 1024) {
        alert('حجم الصورة يجب أن يكون أقل من 50 ميجابايت');
        return;
      }

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

    const formData = new FormData();
    formData.append('categoryName', categoryName);
    formData.append('categoryType', categoryType);
    formData.append('image', image);

    try {
      const response = await axios.post('http://127.0.0.1:5003/api/category', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      console.log('Success:', response.data);

      setCategoryName('');
      setCategoryType('');
      setImage(null);

      // إعلام CombinedPage بوجود تحديث
      onCategoryAdded(response.data.data);
    } catch (error) {
      console.error('Error submitting data:', error);
      alert('حدث خطأ أثناء إرسال البيانات: ' + (error.response?.data?.message || error.message));
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
          <input
            type="file"
            id="image"
            onChange={handleImageChange}
            required
          />
        </div>
        <button type="submit">Submit</button>
      </form>
    </div>
  );
};

const CategoryList = ({ categories, onDelete, onUpdate }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);

  const categorizedData = categories.reduce((acc, category) => {
    const type = category.categoryType || "Uncategorized";
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

  return (
    <div className="category-list-container">
      {categories.length === 0 && (
        <p className="no-categories-text">No categories found.</p>
      )}
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
                            src={`http://127.0.0.1:5003/${category.image}`}
                            alt={category.categoryName || "Category Image"}
                            className="category-image"
                          />
                        ) : (
                          <span style={{ fontSize: "28px", color: "#a0aec0" }}>💰</span>
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
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
      {isModalOpen && selectedCategory && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Edit Category</h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                onUpdate(selectedCategory);
                setIsModalOpen(false);
              }}
            >
              <input
                type="text"
                value={selectedCategory.categoryName}
                onChange={(e) =>
                  setSelectedCategory({
                    ...selectedCategory,
                    categoryName: e.target.value,
                  })
                }
                placeholder="Category Name"
                className="modal-input"
              />
              <select
                value={selectedCategory.categoryType || ""}
                onChange={(e) =>
                  setSelectedCategory({
                    ...selectedCategory,
                    categoryType: e.target.value,
                  })
                }
                className="modal-select"
              >
                <option value="">Select Type</option>
                <option value="Revenues">Revenues</option>
                <option value="Expenses">Expenses</option>
              </select>
              <button type="submit" className="save-button">
                Save
              </button>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="cancel-button"
              >
                Cancel
              </button>
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
      const response = await axios.get("http://127.0.0.1:5003/api/getcategories");
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
      const response = await axios.delete(`http://127.0.0.1:5003/api/deletecategory/${id}`);
      if (response.status === 200) {
        setCategories(categories.filter((category) => category._id !== id));
      }
    } catch (error) {
      alert(error.message);
    }
  };

  const handleUpdate = async (updatedCategory) => {
    try {
      const response = await axios.put(`http://127.0.0.1:5003/api/updatecategory/${updatedCategory._id}`, updatedCategory);
      if (response.status === 200) {
        setCategories(categories.map((cat) => (cat._id === updatedCategory._id ? response.data : cat)));
      }
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <>
      <CategoryForm onCategoryAdded={handleCategoryAdded} />
      {loading && <p className="loading-text">Loading categories...</p>}
      {error && <p className="error-text">Error: {error}</p>}
      <CategoryList
        categories={categories}
        onDelete={handleDelete}
        onUpdate={handleUpdate}
      />
    </>
  );
};

export default CombinedPage;