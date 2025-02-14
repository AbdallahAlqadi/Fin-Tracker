// categoryController.js
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
    // استخدام المسار المطلق للمجلد
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
    const image = req.file ? `uploads/${req.file.filename}` : null;

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
    const deletedCategory = await Category.findOneAndDelete({ _id: id }); // حذف بناءً على _id
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

    // إذا تم رفع صورة جديدة، تحديث مسار الصورة
    if (req.file) {
      updateData.image = `uploads/${req.file.filename}`;
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
