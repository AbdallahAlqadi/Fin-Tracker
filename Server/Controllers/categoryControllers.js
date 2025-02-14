// controllers/categoryController.js
const Category = require('../models/categoryData');
const fs = require('fs');
const path = require('path');

/**
 * دالة مساعدة للتحقق من صحة صورة DataURL واستخلاص البيانات
 * تتوقع السلسلة بصيغة: data:image/jpeg;base64,........
 */
function parseImageData(dataUrl) {
  // التعبير النظامي للتحقق من صيغة الصورة (jpeg, jpg, png, gif)
  const regex = /^data:(image\/(jpeg|jpg|png|gif));base64,(.+)$/;
  const matches = dataUrl.match(regex);
  if (!matches) return null;
  return {
    mimeType: matches[1],
    extension: matches[2] === 'jpeg' || matches[2] === 'jpg' ? '.jpg'
               : matches[2] === 'png' ? '.png'
               : '.gif',
    base64Data: matches[3]
  };
}

// إنشاء تصنيف جديد باستخدام JSON (مع صورة DataURL)
exports.createCategory = async (req, res) => {
  try {
    const { categoryName, categoryType, image } = req.body;

    // التحقق من وجود جميع الحقول المطلوبة
    if (!categoryName || !categoryType || !image) {
      return res.status(400).json({ message: 'يرجى ملء جميع الحقول' });
    }

    // التحقق من صحة صيغة الصورة
    const parsedImage = parseImageData(image);
    if (!parsedImage) {
      return res.status(400).json({ message: 'صيغة الصورة غير صحيحة' });
    }

    // تحويل البيانات المشفرة إلى Buffer
    const imageBuffer = Buffer.from(parsedImage.base64Data, 'base64');

    // (اختياري) التحقق من حجم الصورة (مثلاً أقل من 50 ميجابايت)
    if (imageBuffer.length > 50 * 1024 * 1024) {
      return res.status(400).json({ message: 'حجم الصورة يجب أن يكون أقل من 50 ميجابايت' });
    }

    // إنشاء اسم فريد للصورة وتحديد المسار
    const filename = Date.now() + parsedImage.extension;
    const relativePath = `images/${filename}`;
    const absolutePath = path.join(__dirname, '..', 'public', 'images', filename);

    // حفظ الصورة على القرص
    fs.writeFileSync(absolutePath, imageBuffer);

    // إنشاء التصنيف مع تخزين الرابط النسبي للصورة
    const newCategory = new Category({
      categoryName,
      categoryType,
      image: relativePath,
    });

    await newCategory.save();

    res.status(201).json({ message: 'تم إنشاء التصنيف بنجاح', data: newCategory });
  } catch (err) {
    res.status(500).json({ message: 'حدث خطأ أثناء إنشاء التصنيف', error: err.message });
  }
};

// جلب جميع التصنيفات
exports.getCategories = async (req, res) => {
  try {
    const categories = await Category.find();
    res.status(200).json({ message: 'تم جلب التصنيفات بنجاح', data: categories });
  } catch (error) {
    res.status(500).json({ message: 'حدث خطأ أثناء جلب التصنيفات', error: error.message });
  }
};

// حذف تصنيف
exports.Deletecategory = async (req, res) => {
  try {
    const id = req.params.id;
    const deletedCategory = await Category.findOneAndDelete({ _id: id });
    res.status(200).json(deletedCategory);
  } catch (error) {
    res.status(500).json({ message: 'حدث خطأ أثناء حذف التصنيف', error: error.message });
  }
};

// تحديث التصنيف (مع إمكانية تعديل الصورة)
exports.Updatecategory = async (req, res) => {
  try {
    const id = req.params.id;
    let updateData = { ...req.body };

    // إذا تم إرسال بيانات صورة جديدة، نقوم بمعالجتها
    if (updateData.image) {
      const parsedImage = parseImageData(updateData.image);
      if (!parsedImage) {
        return res.status(400).json({ message: 'صيغة الصورة غير صحيحة' });
      }

      const imageBuffer = Buffer.from(parsedImage.base64Data, 'base64');
      if (imageBuffer.length > 50 * 1024 * 1024) {
        return res.status(400).json({ message: 'حجم الصورة يجب أن يكون أقل من 50 ميجابايت' });
      }

      const filename = Date.now() + parsedImage.extension;
      const relativePath = `images/${filename}`;
      const absolutePath = path.join(__dirname, '..', 'public', 'images', filename);

      fs.writeFileSync(absolutePath, imageBuffer);
      updateData.image = relativePath;
    }

    const updatedCategory = await Category.findByIdAndUpdate(id, updateData, { new: true });
    if (!updatedCategory) {
      return res.status(404).json({ message: 'التصنيف غير موجود' });
    }
    res.status(200).json(updatedCategory);
  } catch (error) {
    res.status(500).json({ message: 'حدث خطأ أثناء تحديث التصنيف', error: error.message });
  }
};
