// categoryController.js
const Category = require('../models/categoryData');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// التأكد من وجود مجلد 'uploads' وإنشاؤه إذا لم يكن موجوداً
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// تكوين multer مع استخدام مسار مطلق لمجلد 'uploads'
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

// تكوين multer لتحميل ملف واحد مع تحديد حجم الملف ونوعه
const uploadSingle = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
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
}).single('image'); // 'image' هو اسم الحقل الذي يحتوي على الملف

// إنشاء فئة جديدة
exports.createCategory = async (req, res) => {
  try {
    // تحميل الصورة باستخدام multer
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
    const image = req.file ? `uploads/${req.file.filename}` : null;

    // التأكد من أن جميع الحقول مطلوبة موجودة
    if (!categoryName || !categoryType || !image) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // إنشاء الكائن الجديد من النموذج
    const newCategory = new Category({
      categoryName,
      categoryType,
      image,
    });

    // حفظ الكائن في قاعدة البيانات
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

// جلب جميع الفئات
exports.getCategories = async (req, res) => {
  try {
    const categories = await Category.find();
    res.status(200).json({ message: 'Categories retrieved successfully', data: categories });
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving categories', error: error.message });
  }
};

// حذف فئة بناءً على معرفها
exports.Deletecategory = async (req, res) => {
  try {
    const id = req.params.id;
    const deletcategory = await Category.findOneAndDelete({ _id: id });
    res.status(200).json(deletcategory);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// تعديل فئة
exports.Updatecategory = async (req, res) => {
  try {
    // استخدام multer لمعالجة الصورة في حالة وجودها
    await new Promise((resolve, reject) => {
      uploadSingle(req, res, (err) => {
        if (err && err.code !== 'LIMIT_UNEXPECTED_FILE') {
          return reject(err);
        }
        resolve();
      });
    });

    const id = req.params.id;
    const { categoryName, categoryType } = req.body;
    let updateData = { categoryName, categoryType };

    if (req.file) {
      updateData.image = `uploads/${req.file.filename}`;
    }

    const updatecategory = await Category.findByIdAndUpdate(id, updateData, { new: true });
    if (!updatecategory) {
      return res.status(404).json({ message: 'Category not found' });
    }
    res.status(200).json({ message: 'Category updated successfully', data: updatecategory });
  } catch (error) {
    if (error instanceof multer.MulterError) {
      return res.status(400).json({ message: 'Error uploading file', error: error.message });
    }
    res.status(500).json({ message: 'Error updating category', error: error.message });
  }
};
