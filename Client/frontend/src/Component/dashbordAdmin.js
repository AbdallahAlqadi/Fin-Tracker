// // CombinedPage.jsx
// import React, { useState, useEffect } from 'react';
// import axios from 'axios';
// import '../cssStyle/dashbord.css';

// const CategoryForm = ({ onCategoryAdded }) => {
//   const [categoryName, setCategoryName] = useState('');
//   const [categoryType, setCategoryType] = useState('');
//   const [image, setImage] = useState(null);

//   // التعامل مع تغيير الصورة والتحقق من نوعها وحجمها
//   const handleImageChange = (e) => {
//     const file = e.target.files[0];
//     if (file) {
//       if (file.size > 5 * 1024 * 1024) {
//         alert('حجم الصورة يجب أن يكون أقل من 5 ميجابايت');
//         return;
//       }
//       const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
//       if (!allowedTypes.includes(file.type)) {
//         alert('يرجى تحميل صورة بصيغة JPEG أو PNG أو GIF فقط');
//         return;
//       }
//       setImage(file);
//     }
//   };

//   // إرسال البيانات إلى الخادم
//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     if (!categoryName || !categoryType || !image) {
//       alert('يرجى ملء جميع الحقول');
//       return;
//     }

//     const formData = new FormData();
//     formData.append('categoryName', categoryName);
//     formData.append('categoryType', categoryType);
//     formData.append('image', image);

//     try {
//       const response = await axios.post(
//         'https://fin-tracker-ncbx.onrender.com/api/category',
//         formData
//       );
//       console.log('تم الإرسال بنجاح:', response.data);
//       // إعادة تعيين الحقول بعد النجاح
//       setCategoryName('');
//       setCategoryType('');
//       setImage(null);
//       onCategoryAdded(response.data.data);
//     } catch (error) {
//       console.error('حدث خطأ أثناء الإرسال:', error);
//       alert(
//         'حدث خطأ أثناء الإرسال: ' +
//           (error.response?.data?.message || error.message)
//       );
//     }
//   };

//   return (
//     <div className="form-container">
//       <form onSubmit={handleSubmit} className="category-form">
//         <div className="input-group">
//           <label htmlFor="categoryName">اسم التصنيف:</label>
//           <input
//             type="text"
//             id="categoryName"
//             value={categoryName}
//             onChange={(e) => setCategoryName(e.target.value)}
//             required
//           />
//         </div>
//         <div className="input-group">
//           <label htmlFor="categoryType">نوع التصنيف:</label>
//           <select
//             id="categoryType"
//             value={categoryType}
//             onChange={(e) => setCategoryType(e.target.value)}
//             required
//           >
//             <option value="">اختر نوع التصنيف</option>
//             <option value="Expenses">مصروفات</option>
//             <option value="Revenues">إيرادات</option>
//           </select>
//         </div>
//         <div className="input-group">
//           <label htmlFor="image">تحميل الصورة:</label>
//           <input type="file" id="image" onChange={handleImageChange} required />
//         </div>
//         <button type="submit" className="submit-btn">إرسال</button>
//       </form>
//     </div>
//   );
// };

// const CategoryList = ({ categories, onDelete, onUpdate }) => {
//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const [selectedCategory, setSelectedCategory] = useState(null);
//   const [newImage, setNewImage] = useState(null);

//   // تصنيف التصنيفات إلى مصروفات وإيرادات
//   const expenses = categories.filter((cat) => cat.categoryType === 'Expenses');
//   const revenues = categories.filter((cat) => cat.categoryType === 'Revenues');

//   // التعامل مع تغيير الصورة في حالة التعديل
//   const handleUpdateImageChange = (e) => {
//     const file = e.target.files[0];
//     if (file) {
//       if (file.size > 5 * 1024 * 1024) {
//         alert('حجم الصورة يجب أن يكون أقل من 5 ميجابايت');
//         return;
//       }
//       const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
//       if (!allowedTypes.includes(file.type)) {
//         alert('يرجى تحميل صورة بصيغة JPEG أو PNG أو GIF فقط');
//         return;
//       }
//       setNewImage(file);
//     }
//   };

//   // إرسال بيانات التعديل إلى الخادم
//   const handleModalSubmit = (e) => {
//     e.preventDefault();
//     const formData = new FormData();
//     formData.append('_id', selectedCategory._id);
//     formData.append('categoryName', selectedCategory.categoryName);
//     formData.append('categoryType', selectedCategory.categoryType);
//     if (newImage) {
//       formData.append('image', newImage);
//     }
//     onUpdate(formData);
//     setIsModalOpen(false);
//     setNewImage(null);
//   };

//   // مكون البطاقة الخاص بكل تصنيف
//   const renderCategoryCard = (cat) => (
//     <div key={cat._id} className="category-card">
//       <div className="card-image">
//         {cat.image ? (
//           <img
//             src={
//               cat.image.startsWith('data:')
//                 ? cat.image
//                 : `https://fin-tracker-ncbx.onrender.com/${cat.image}`
//             }
//             alt={cat.categoryName}
//           />
//         ) : (
//           <span className="placeholder-icon">💰</span>
//         )}
//       </div>
//       <div className="card-content">
//         <h3>{cat.categoryName}</h3>
//       </div>
//       <div className="card-actions">
//         <button
//           className="edit-btn"
//           onClick={() => {
//             setSelectedCategory(cat);
//             setIsModalOpen(true);
//           }}
//         >
//           تعديل
//         </button>
//         <button className="delete-btn" onClick={() => onDelete(cat._id)}>
//           حذف
//         </button>
//       </div>
//     </div>
//   );

//   return (
//     <div className="category-list-container">
//       {categories.length === 0 && <p>لا توجد تصنيفات</p>}

//       {expenses.length > 0 && (
//         <div className="category-section">
//           <h2 className="section-title">مصروفات</h2>
//           <div className="category-cards">
//             {expenses.map((cat) => renderCategoryCard(cat))}
//           </div>
//         </div>
//       )}

//       {revenues.length > 0 && (
//         <div className="category-section">
//           <h2 className="section-title">إيرادات</h2>
//           <div className="category-cards">
//             {revenues.map((cat) => renderCategoryCard(cat))}
//           </div>
//         </div>
//       )}

//       {isModalOpen && selectedCategory && (
//         <div className="modal">
//           <div className="modal-content">
//             <button className="modal-close" onClick={() => setIsModalOpen(false)}>
//               إغلاق
//             </button>
//             <form onSubmit={handleModalSubmit} className="modal-form">
//               <div className="input-group">
//                 <label>اسم التصنيف:</label>
//                 <input
//                   type="text"
//                   value={selectedCategory.categoryName}
//                   onChange={(e) =>
//                     setSelectedCategory({
//                       ...selectedCategory,
//                       categoryName: e.target.value,
//                     })
//                   }
//                   required
//                 />
//               </div>
//               <div className="input-group">
//                 <label>نوع التصنيف:</label>
//                 <select
//                   value={selectedCategory.categoryType}
//                   onChange={(e) =>
//                     setSelectedCategory({
//                       ...selectedCategory,
//                       categoryType: e.target.value,
//                     })
//                   }
//                   required
//                 >
//                   <option value="">اختر النوع</option>
//                   <option value="Expenses">مصروفات</option>
//                   <option value="Revenues">إيرادات</option>
//                 </select>
//               </div>
//               <div className="input-group">
//                 <label>تحديث الصورة (اختياري):</label>
//                 <input type="file" onChange={handleUpdateImageChange} />
//               </div>
//               <button type="submit" className="save-btn">
//                 حفظ
//               </button>
//             </form>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// const CombinedPage = () => {
//   const [categories, setCategories] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);

//   // جلب التصنيفات من الخادم
//   const fetchCategories = async () => {
//     try {
//       setLoading(true);
//       const res = await axios.get(
//         'https://fin-tracker-ncbx.onrender.com/api/getcategories'
//       );
//       setCategories(res.data.data);
//     } catch (err) {
//       setError(err.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchCategories();
//   }, []);

//   // إضافة تصنيف جديد إلى القائمة
//   const handleCategoryAdded = (newCategory) => {
//     setCategories([...categories, newCategory]);
//   };

//   // حذف تصنيف
//   const handleDelete = async (id) => {
//     try {
//       const res = await axios.delete(
//         `https://fin-tracker-ncbx.onrender.com/api/deletecategory/${id}`
//       );
//       if (res.status === 200) {
//         setCategories(categories.filter((cat) => cat._id !== id));
//       }
//     } catch (err) {
//       alert(err.message);
//     }
//   };

//   // تحديث التصنيف
//   const handleUpdate = async (formData) => {
//     try {
//       const id = formData.get('_id');
//       const res = await axios.put(
//         `https://fin-tracker-ncbx.onrender.com/api/updatecategory/${id}`,
//         formData
//       );
//       if (res.status === 200) {
//         setCategories(
//           categories.map((cat) => (cat._id === id ? res.data.data : cat))
//         );
//       }
//     } catch (err) {
//       alert(
//         'خطأ في تحديث التصنيف: ' +
//           (err.response?.data?.message || err.message)
//       );
//     }
//   };

//   return (
//     <div className="combined-page">
//       <CategoryForm onCategoryAdded={handleCategoryAdded} />
//       {loading && <p>جارِ تحميل التصنيفات...</p>}
//       {error && <p>خطأ: {error}</p>}
//       <CategoryList
//         categories={categories}
//         onDelete={handleDelete}
//         onUpdate={handleUpdate}
//       />
//     </div>
//   );
// };

// export default CombinedPage;


// CombinedPage.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../cssStyle/dashbord.css';

const CategoryForm = ({ onCategoryAdded }) => {
  const [categoryName, setCategoryName] = useState('');
  const [categoryType, setCategoryType] = useState('');
  const [image, setImage] = useState(null);

  // التعامل مع تغيير الصورة والتحقق من حجمها ونوعها
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

  // إرسال بيانات النموذج إلى الخادم
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
        'http://127.0.0.1:5002/api/category',
        formData
      );
      console.log('Successfully submitted:', response.data);
      // إعادة تعيين الحقول بعد النجاح
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
            <option value="">Select Category Type</option>
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

  // فصل التصنيفات إلى Expenses و Revenues
  const expenses = categories.filter((cat) => cat.categoryType === 'Expenses');
  const revenues = categories.filter((cat) => cat.categoryType === 'Revenues');

  // التعامل مع تغيير الصورة في حالة التعديل
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

  // إرسال بيانات التحديث إلى الخادم
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

  // عرض بطاقة التصنيف
  const renderCategoryCard = (cat) => (
    <div key={cat._id} className="category-card">
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
        <button className="delete-btn" onClick={() => onDelete(cat._id)}>
          Delete
        </button>
      </div>
    </div>
  );

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
              &times;
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
    </div>
  );
};

const CombinedPage = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // جلب التصنيفات من الخادم
  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        'https://fin-tracker-ncbx.onrender.com/api/getcategories'
      );
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

  // إضافة تصنيف جديد
  const handleCategoryAdded = (newCategory) => {
    setCategories([...categories, newCategory]);
  };

  // حذف تصنيف
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

  // تحديث التصنيف
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
        'Error updating category: ' +
          (err.response?.data?.message || err.message)
      );
    }
  };

  return (
    <div className="combined-page">
      <CategoryForm onCategoryAdded={handleCategoryAdded} />
      {loading && <p>Loading categories...</p>}
      {error && <p>Error: {error}</p>}
      <CategoryList
        categories={categories}
        onDelete={handleDelete}
        onUpdate={handleUpdate}
      />
    </div>
  );
};

export default CombinedPage;
