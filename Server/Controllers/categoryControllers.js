// categoryController.js
const Category = require('../models/categoryData');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// التأكد من وجود مجلد "uploads" وإنشاؤه إذا لم يكن موجوداً

const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log('تم إنشاء مجلد uploads:', uploadDir);
}

// إعداد multer لتخزين الملفات في مجلد uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + path.extname(file.originalname);
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 }, // 5 ميجابايت
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const ext = allowedTypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mime = allowedTypes.test(file.mimetype);
    if (ext && mime) {
      return cb(null, true);
    }
    cb(new Error('فقط الصور (jpeg, jpg, png, gif) مسموحة'));
  },
}).single('image');

// إنشاء تصنيف جديد
exports.createCategory = async (req, res) => {
  try {
    await new Promise((resolve, reject) => {
      upload(req, res, (err) => {
        if (err) return reject(err);
        resolve();
      });
    });

    const { categoryName, categoryType } = req.body;
    if (!categoryName || !categoryType || !req.file) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const imagePath = `uploads/${req.file.filename}`;
    const newCategory = new Category({
      categoryName,
      categoryType,
      image: imagePath,
    });
    await newCategory.save();
    res
      .status(201)
      .json({ message: 'تم إنشاء التصنيف بنجاح', data: newCategory });
  } catch (err) {
    if (err instanceof multer.MulterError) {
      return res
        .status(400)
        .json({ message: 'خطأ في رفع الملف', error: err.message });
    }
    res
      .status(500)
      .json({ message: 'خطأ في إنشاء التصنيف', error: err.message });
  }
};

// جلب جميع التصنيفات
exports.getCategories = async (req, res) => {
  try {
    const categories = await Category.find();
    res.status(200).json({
      message: 'تم استرجاع التصنيفات بنجاح',
      data: categories,
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: 'خطأ في استرجاع التصنيفات', error: err.message });
  }
};

// حذف تصنيف
exports.Deletecategory = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Category.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ message: 'التصنيف غير موجود' });
    }
    res
      .status(200)
      .json({ message: 'تم حذف التصنيف بنجاح', data: deleted });
  } catch (err) {
    res
      .status(500)
      .json({ message: 'خطأ في حذف التصنيف', error: err.message });
  }
};

// تحديث تصنيف
exports.Updatecategory = async (req, res) => {
  try {
    await new Promise((resolve, reject) => {
      upload(req, res, (err) => {
        // في حال كان الخطأ متعلقاً بملف غير متوقع يمكن تجاوزه
        if (err && err.code !== 'LIMIT_UNEXPECTED_FILE') return reject(err);
        resolve();
      });
    });

    const { id } = req.params;
    const { categoryName, categoryType } = req.body;
    const updateData = { categoryName, categoryType };
    if (req.file) {
      updateData.image = `uploads/${req.file.filename}`;
    }

    const updated = await Category.findByIdAndUpdate(id, updateData, {
      new: true,
    });
    if (!updated) {
      return res.status(404).json({ message: 'التصنيف غير موجود' });
    }
    res
      .status(200)
      .json({ message: 'تم تحديث التصنيف بنجاح', data: updated });
  } catch (err) {
    if (err instanceof multer.MulterError) {
      return res
        .status(400)
        .json({ message: 'خطأ في رفع الملف', error: err.message });
    }
    res
      .status(500)
      .json({ message: 'خطأ في تحديث التصنيف', error: err.message });
  }
};
