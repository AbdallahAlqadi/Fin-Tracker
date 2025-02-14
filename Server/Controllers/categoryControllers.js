const Category = require('../models/categoryData');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// التأكد من وجود مجلد uploads، وإن لم يكن موجودًا يتم إنشاؤه
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
  console.log('uploads folder created');
} else {
  console.log('uploads folder exists');
}

// تكوين multer لتحديد مكان حفظ الملفات وتسميتها
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname)); // إضافة توقيت لاسم الملف لتجنب التكرار
  }
});

// تكوين multer مع حد حجم 10 ميجابايت وتحديد أنواع الصور المسموحة
const uploadSingle = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: function (req, file, cb) {
    const filetypes = /jpeg|jpg|png|gif/; // السماح بأنواع محددة من الصور
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
    // استخدام Promise لانتظار انتهاء تحميل الملف
    await new Promise((resolve, reject) => {
      uploadSingle(req, res, (err) => {
        if (err) {
          return reject(err);
        }
        resolve();
      });
    });

    const { categoryName, categoryType } = req.body;
    const image = req.file ? `uploads/${req.file.filename}` : null;

    if (!categoryName || !categoryType || !image) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const newCategory = new Category({
      categoryName,
      categoryType,
      image,
    });

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
    const deletedCategory = await Category.findOneAndDelete({ _id: id });
    res.status(200).json(deletedCategory);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// تحديث تصنيف
exports.Updatecategory = async (req, res) => {
  try {
    // انتظار انتهاء عملية تحميل الملف
    await new Promise((resolve, reject) => {
      uploadSingle(req, res, (err) => {
        if (err) return reject(err);
        resolve();
      });
    });

    const id = req.params.id;
    // استخراج البيانات مع استبعاد _id إذا وُجد
    const { _id, ...updateData } = req.body;

    // إذا تم رفع صورة جديدة، تحديث مسار الصورة
    if (req.file) {
      updateData.image = `uploads/${req.file.filename}`;
    }

    const updatedCategory = await Category.findByIdAndUpdate(id, updateData, { new: true });
    if (!updatedCategory) {
      return res.status(404).json({ message: 'Category not found' });
    }
    res.status(200).json({ message: 'Category updated successfully', data: updatedCategory });
  } catch (error) {
    if (error instanceof multer.MulterError) {
      return res.status(400).json({ message: 'Error uploading file', error: error.message });
    } else if (error.message === 'Only images (jpeg, jpg, png, gif) are allowed!') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Error updating category', error: error.message });
  }
};
