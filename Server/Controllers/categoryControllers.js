// categoryController.js
const Category = require('../models/categoryData');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// تكوين multer مع مسار مطلق وإنشاء مجلد تلقائي
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '..', 'uploads');
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

// فلترة أنواع الملفات المسموحة
const fileFilter = (req, file, cb) => {
  const filetypes = /jpeg|jpg|png|gif/;
  const mimetype = filetypes.test(file.mimetype);
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only images (jpeg, jpg, png, gif) are allowed!'));
  }
};

// تكوين الرفع النهائي
const uploadSingle = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: fileFilter
}).single('image');

exports.createCategory = async (req, res) => {
  try {
    await new Promise((resolve, reject) => {
      uploadSingle(req, res, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    const { categoryName, categoryType } = req.body;
    const image = req.file ? `/uploads/${req.file.filename}` : null;

    if (!categoryName || !categoryType || !image) {
      return res.status(400).json({ message: 'جميع الحقول مطلوبة' });
    }

    const newCategory = new Category({
      categoryName,
      categoryType,
      image,
    });

    await newCategory.save();
    res.status(201).json({ 
      message: 'تم إنشاء التصنيف بنجاح', 
      data: newCategory 
    });
  } catch (err) {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ 
        message: 'خطأ في رفع الملف', 
        error: err.message 
      });
    } else if (err.message.includes('مسموحة فقط')) {
      return res.status(400).json({ message: err.message });
    } else {
      res.status(500).json({ 
        message: 'خطأ في إنشاء التصنيف', 
        error: err.message 
      });
    }
  }
};

exports.getCategories = async (req, res) => {
  try {
    const categories = await Category.find();
    res.status(200).json({ 
      message: 'تم استرجاع التصنيفات بنجاح', 
      data: categories 
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'خطأ في استرجاع التصنيفات', 
      error: error.message 
    });
  }
};

exports.Deletecategory = async (req, res) => {
  try {
    const id = req.params.id;
    const deleteCategory = await Category.findByIdAndDelete(id);

    if (!deleteCategory) {
      return res.status(404).json({ message: 'التصنيف غير موجود' });
    }

    // حذف الصورة المرتبطة
    if (deleteCategory.image) {
      const imagePath = path.join(__dirname, '..', deleteCategory.image);
      fs.unlink(imagePath, (err) => {
        if (err) console.error('خطأ في حذف الصورة:', err);
      });
    }

    res.status(200).json({ 
      message: 'تم حذف التصنيف بنجاح', 
      data: deleteCategory 
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'خطأ في حذف التصنيف', 
      error: error.message 
    });
  }
};

exports.Updatecategory = async (req, res) => {
  try {
    await new Promise((resolve, reject) => {
      uploadSingle(req, res, (err) => {
        if (err && err.code !== 'LIMIT_UNEXPECTED_FILE') reject(err);
        else resolve();
      });
    });

    const id = req.params.id;
    const { categoryName, categoryType } = req.body;
    let updateData = { categoryName, categoryType };

    if (req.file) {
      // حذف الصورة القديمة
      const oldCategory = await Category.findById(id);
      if (oldCategory?.image) {
        const oldImagePath = path.join(__dirname, '..', oldCategory.image);
        fs.unlink(oldImagePath, (err) => {
          if (err) console.error('خطأ في حذف الصورة القديمة:', err);
        });
      }
      updateData.image = `/uploads/${req.file.filename}`;
    }

    const updatedCategory = await Category.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );

    if (!updatedCategory) {
      return res.status(404).json({ message: 'التصنيف غير موجود' });
    }

    res.status(200).json({ 
      message: 'تم تحديث التصنيف بنجاح', 
      data: updatedCategory 
    });
  } catch (error) {
    if (error instanceof multer.MulterError) {
      res.status(400).json({ 
        message: 'خطأ في رفع الملف', 
        error: error.message 
      });
    } else {
      res.status(500).json({ 
        message: 'خطأ في تحديث التصنيف', 
        error: error.message 
      });
    }
  }
};