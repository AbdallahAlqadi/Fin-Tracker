// controllers/categoryController.js
const Category = require('../models/categoryData');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// تكوين multer لتحديد مكان حفظ الملفات وتسميتها
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // حفظ الملفات في مجلد 'uploads'
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname)); // إضافة توقيت لاسم الملف لتجنب التكرار
  }
});

// تكوين multer لتحميل ملف واحد فقط
const uploadSingle = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // الحد الأقصى لحجم الملف 5MB
  fileFilter: function (req, file, cb) {
    const filetypes = /jpeg|jpg|png|gif/; // السماح بأنواع الصور
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

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
    // رفع الملف باستخدام multer
    await new Promise((resolve, reject) => {
      uploadSingle(req, res, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });

    // استخراج البيانات من الطلب
    const { categoryName, categoryType } = req.body;
    const image = req.file ? `uploads/${req.file.filename}` : null;

    // التحقق من وجود جميع الحقول المطلوبة
    if (!categoryName || !categoryType || !image) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // إنشاء كائن جديد من التصنيف
    const newCategory = new Category({
      categoryName,
      categoryType,
      image,
    });

    // حفظ التصنيف في قاعدة البيانات
    await newCategory.save();

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
    const deletcategory = await Category.findOneAndDelete({ _id: id });
    res.status(200).json(deletcategory);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// تحديث التصنيف (مع إمكانية تغيير الصورة)
// يتم استخدام multer كـ middleware داخل الدالة للتعامل مع رفع الملف
exports.Updatecategory = (req, res) => {
  uploadSingle(req, res, async (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        return res.status(400).json({ message: 'Error uploading file', error: err.message });
      } else if (err.message === 'Only images (jpeg, jpg, png, gif) are allowed!') {
        return res.status(400).json({ message: err.message });
      } else {
        return res.status(500).json({ message: 'Error processing file', error: err.message });
      }
    }

    const id = req.params.id;
    let updateData = req.body;

    try {
      // إيجاد التصنيف الحالي للتأكد من وجوده والحصول على مسار الصورة القديمة
      const existingCategory = await Category.findById(id);
      if (!existingCategory) {
        return res.status(404).json({ message: 'Category not found' });
      }

      // إذا تم رفع ملف جديد، نحدث مسار الصورة ونحذف القديمة إن وُجدت
      if (req.file) {
        updateData.image = `uploads/${req.file.filename}`;
        if (existingCategory.image && fs.existsSync(existingCategory.image)) {
          fs.unlink(existingCategory.image, (unlinkErr) => {
            if (unlinkErr) {
              console.error('Error deleting old image:', unlinkErr);
            }
          });
        }
      }

      const updatedCategory = await Category.findByIdAndUpdate(id, updateData, { new: true });
      return res.status(200).json({ message: 'Category updated successfully', data: updatedCategory });
    } catch (error) {
      return res.status(500).json({ message: 'Error updating category', error: error.message });
    }
  });
};
