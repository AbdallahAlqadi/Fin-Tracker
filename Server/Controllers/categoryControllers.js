// categoryController.js
const Category = require('../models/categoryData');
const multer = require('multer');

// استخدام التخزين في الذاكرة لتحويل الصورة إلى base64
const storage = multer.memoryStorage();

const uploadSingle = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: function (req, file, cb) {
    const filetypes = /jpeg|jpg|png|gif/; // السماح بأنواع محددة من الصور
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(file.originalname.toLowerCase());

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only images (jpeg, jpg, png, gif) are allowed!'));
    }
  }
}).single('image'); // 'image' هو اسم الحقل الذي يحتوي على الملف

// إنشاء تصنيف جديد
exports.createCategory = async (req, res) => {
  try {
    // تحميل الملف باستخدام multer
    await new Promise((resolve, reject) => {
      uploadSingle(req, res, (err) => {
        if (err) {
          return reject(err);
        }
        resolve();
      });
    });

    // استخراج البيانات من الطلب
    const { categoryName, categoryType } = req.body;
    // تحويل الصورة إلى سلسلة base64 إذا تم رفعها
    const image = req.file ? `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}` : null;

    // التأكد من وجود جميع الحقول المطلوبة
    if (!categoryName || !categoryType || !image) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // إنشاء كائن جديد من نموذج Category
    const newCategory = new Category({
      categoryName,
      categoryType,
      image,
    });

    // حفظ الكائن في قاعدة البيانات
    await newCategory.save();

    // إرسال استجابة موحدة مع بيانات التصنيف الجديد
    res.status(201).json({ message: 'Category created successfully', data: newCategory });
  } catch (err) {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ message: 'Error uploading file', error: err.message });
    } else if (err.message === 'Only images (jpeg, jpg, png, gif) are allowed!') {
      return res.status(400).json({ message: err.message });
    } else {
      res.status(500).json({ message: 'Error creating category', error: err.message });
    }
  }
};

// جلب جميع التصنيفات
exports.getCategories = async (req, res) => {
  try {
    const categories = await Category.find();
    res.status(200).json({ message: 'Categories retrieved successfully', data: categories });
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving categories', error: error.message });
  }
};

// حذف تصنيف
exports.Deletecategory = async (req, res) => {
  try {
    const id = req.params.id;
    const deletedCategory = await Category.findOneAndDelete({ _id: id });
    res.status(200).json(deletedCategory);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// تحديث تصنيف
exports.Updatecategory = (req, res) => {
  uploadSingle(req, res, async function(err) {
    if (err) {
      if (err instanceof multer.MulterError) {
        return res.status(400).json({ message: 'Error uploading file', error: err.message });
      } else if (err.message === 'Only images (jpeg, jpg, png, gif) are allowed!') {
        return res.status(400).json({ message: err.message });
      } else {
        return res.status(500).json({ message: 'Error uploading file', error: err.message });
      }
    }

    const id = req.params.id;
    const { _id, ...updateData } = req.body;

    // إذا تم رفع صورة جديدة، تحويلها إلى base64 وتحديث مسار الصورة
    if (req.file) {
      updateData.image = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    }

    try {
      const updatedCategory = await Category.findByIdAndUpdate(id, updateData, { new: true });
      if (!updatedCategory) {
        return res.status(404).json({ message: 'Category not found' });
      }
      res.status(200).json({ message: 'Category updated successfully', data: updatedCategory });
    } catch (error) {
      console.error("updateCategory error:", error);
      res.status(500).json({ message: 'Error updating category', error: error.message });
    }
  });
};
