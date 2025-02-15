// uploadAndCategoryController.js

const multer = require('multer');
const path = require('path');
const Category = require('../models/categoryData'); // تأكد من صحة مسار ملف الموديل



const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // __dirname يُشير إلى "server/controllers"، لذا نعود خطوة للخلف للوصول إلى "server/uploads"
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    // إنشاء اسم فريد للملف باستخدام الوقت الحالي
    cb(null, Date.now() + ext);
  },
});

/*** إعداد Multer ***/
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, 'uploads/'); // تأكد من وجود مجلد "uploads" في جذر المشروع
//   },
//   filename: (req, file, cb) => {
//     const ext = path.extname(file.originalname);
//     cb(null, Date.now() + ext);
//   },
// });

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('فقط ملفات JPEG, PNG, و GIF مسموحة.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // الحد الأقصى 5 ميجابايت
});

/*** وظائف الـ Controller ***/

// إنشاء تصنيف جديد مع رفع الصورة
exports.createCategory = async (req, res) => {
  try {
    const { categoryName, categoryType } = req.body;
    if (!categoryName || !categoryType) {
      return res.status(400).json({ message: 'جميع الحقول مطلوبة' });
    }
    if (!req.file) {
      return res.status(400).json({ message: 'يجب تحميل صورة' });
    }
    const imageUrl = `/uploads/${req.file.filename}`;
    const newCategory = new Category({
      categoryName,
      categoryType,
      image: imageUrl,
    });
    await newCategory.save();
    res.status(201).json({
      message: 'تم إنشاء التصنيف بنجاح',
      data: newCategory,
    });
  } catch (err) {
    res.status(500).json({ message: 'خطأ في إنشاء التصنيف', error: err.message });
  }
};

// استرجاع جميع التصنيفات
exports.getCategories = async (req, res) => {
  try {
    const categories = await Category.find();
    res.status(200).json({
      message: 'تم استرجاع التصنيفات بنجاح',
      data: categories,
    });
  } catch (err) {
    res.status(500).json({ message: 'خطأ في استرجاع التصنيفات', error: err.message });
  }
};

// حذف تصنيف محدد
exports.Deletecategory = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedCategory = await Category.findByIdAndDelete(id);
    if (!deletedCategory) {
      return res.status(404).json({ message: 'التصنيف غير موجود' });
    }
    res.status(200).json({
      message: 'تم حذف التصنيف بنجاح',
      data: deletedCategory,
    });
  } catch (err) {
    res.status(500).json({ message: 'خطأ في حذف التصنيف', error: err.message });
  }
};

// تحديث تصنيف موجود (مع إمكانية رفع صورة جديدة)
exports.Updatecategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { categoryName, categoryType } = req.body;
    let updateData = { categoryName, categoryType };

    // إذا تم رفع صورة جديدة، نقوم بتحديث مسار الصورة
    if (req.file) {
      updateData.image = `/uploads/${req.file.filename}`;
    }

    const updatedCategory = await Category.findByIdAndUpdate(id, updateData, { new: true });
    if (!updatedCategory) {
      return res.status(404).json({ message: 'التصنيف غير موجود' });
    }
    res.status(200).json({
      message: 'تم تحديث التصنيف بنجاح',
      data: updatedCategory,
    });
  } catch (err) {
    res.status(500).json({ message: 'خطأ في تحديث التصنيف', error: err.message });
  }
};

