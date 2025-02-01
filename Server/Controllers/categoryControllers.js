//item يلي بضيفها المستخدم
const Category = require('../models/categoryData');
const multer = require('multer');
const path = require('path');

// تكوين multer لتحديد مكان حفظ الملفات وتسميتها
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // يتم حفظ الملفات في مجلد 'uploads'
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname)); // إضافة تاريخ لاسم الملف لتجنب التكرار
  }
});

// تكوين multer لتحميل ملف واحد فقط
const uploadSingle = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // تحديد حجم الملف بحد أقصى 5MB
  fileFilter: function (req, file, cb) {
    const filetypes = /jpeg|jpg|png|gif/; // السماح بأنواع محددة من الملفات
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only images (jpeg, jpg, png, gif) are allowed!'));
    }
  }
}).single('image'); // 'image' هو اسم الحقل الذي يحتوي على الملف

exports.createCategory = async (req, res) => {
  try {
    // تحميل الملف باستخدام multer
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

    // التحقق من أن جميع الحقول مطلوبة موجودة
    if (!categoryName || !categoryType || !image) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // إنشاء كائن جديد من النموذج Category
    const newCategory = new Category({
      categoryName,
      categoryType,
      image,
    });

    // حفظ الكائن في قاعدة البيانات
    await newCategory.save();

    // إرسال الرد بنجاح العملية
    res.status(201).json({ message: 'Category created successfully', data: newCategory });
  } catch (err) {
    // معالجة الأخطاء
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ message: 'Error uploading file', error: err.message });
    } else if (err.message === 'Only images (jpeg, jpg, png, gif) are allowed!') {
      return res.status(400).json({ message: err.message });
    } else {
      res.status(500).json({ message: 'Error creating category', error: err.message });
    }
  }
};

exports.getCategories = async (req, res) => {
  try {
    const categories = await Category.find();
    res.status(200).json({ message: 'Categories retrieved successfully', data: categories });
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving categories', error: error.message });
  }
};

exports.Deletecategory = async (req, res) => {
  try {
    const id = req.params.id;
    const deletcategory = await Category.findOneAndDelete({ _id: id }); // شرط الحذف بناءً على id
    res.status(200).json(deletcategory);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.Updatecategory = async (req, res) => {
  try {
    const id = req.params.id;
    const body = req.body;
    console.log(body);

    const updatecategory = await Category.findByIdAndUpdate(id, body, { new: true });
    if (!updatecategory) {
      return res.status(404).json({ message: 'Category not found' });
    }
    res.status(200).json(updatecategory);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
