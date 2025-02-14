// controllers/categoryController.js
const Category = require('../models/categoryData');
const multer = require('multer');
const path = require('path');

// تكوين multer لتخزين الملفات في مجلد "public/images"
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/images/'); // حفظ الصور في مجلد "public/images"
  },
  filename: function (req, file, cb) {
    // إنشاء اسم فريد للصورة باستخدام الوقت الحالي وامتداد الملف
    const filename = Date.now() + path.extname(file.originalname);
    cb(null, filename);
  }
});

// تكوين multer لتحميل ملف واحد فقط مع التحقق من نوع الصورة وحجمها
const uploadSingle = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // الحد الأقصى 5MB
  fileFilter: function (req, file, cb) {
    const filetypes = /jpeg|jpg|png|gif/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only images (jpeg, jpg, png, gif) are allowed!'));
    }
  }
}).single('image'); // "image" هو اسم الحقل في الطلب

// إنشاء تصنيف جديد
exports.createCategory = async (req, res) => {
  try {
    // رفع الصورة باستخدام multer
    await new Promise((resolve, reject) => {
      uploadSingle(req, res, (err) => {
        if (err) {
          return reject(err);
        }
        resolve();
      });
    });

    const { categoryName, categoryType } = req.body;

    if (!categoryName || !categoryType) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    if (!req.file) {
      return res.status(400).json({ message: 'Image is required' });
    }

    // يتم تخزين الرابط النسبي للصورة فقط، مثل "images/filename.jpg"
    const imageLink = `images/${req.file.filename}`;

    const newCategory = new Category({
      categoryName,
      categoryType,
      image: imageLink,
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

// تحديث التصنيف (مع إمكانية تغيير الصورة)
exports.Updatecategory = async (req, res) => {
  try {
    // معالجة رفع الصورة (إن وُجد)
    await new Promise((resolve, reject) => {
      uploadSingle(req, res, (err) => {
        if (err) {
          return reject(err);
        }
        resolve();
      });
    });

    const id = req.params.id;
    let updateData = req.body;

    // إذا تم رفع صورة جديدة، نقوم بتحديث حقل الصورة بالرابط الجديد
    if (req.file) {
      updateData.image = `images/${req.file.filename}`;
    }

    const updatedCategory = await Category.findByIdAndUpdate(id, updateData, { new: true });
    if (!updatedCategory) {
      return res.status(404).json({ message: 'Category not found' });
    }
    res.status(200).json(updatedCategory);
  } catch (error) {
    if (error instanceof multer.MulterError) {
      return res.status(400).json({ message: 'Error uploading file', error: error.message });
    } else if (error.message === 'Only images (jpeg, jpg, png, gif) are allowed!') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Error updating category', error: error.message });
  }
};
