const CardUser = require('../models');
const Category = require('../models/categoryData');
const mongoose = require('mongoose');

// إرجاع بيانات المستخدم
exports.getUserCard = async (req, res) => {
    try {
        const userCard = await CardUser.findOne({ userId: req.user });
        res.status(200).json(userCard);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// إضافة فئة إلى carduser
exports.addToCard = async (req, res) => {
    const { CategoriesId } = req.body;
    const userId = req.user;

    try {
        // التأكد من أن الفئة موجودة
        const category = await Category.findById(CategoriesId);
        if (!category) {
            return res.status(404).json({ error: 'الفئة غير موجودة.' });
        }

        // التأكد من عدم تكرار نفس الفئة للمستخدم
        const existingCard = await CardUser.findOne({
            userId,
            'carduser.categoryName': category.name
        });

        if (existingCard) {
            return res.status(400).json({ error: 'الفئة موجودة بالفعل في البطاقة.' });
        }

        // بناء بيانات الفئة لإضافتها
        const cardItem = {
            categoryName: category.name,
            categoryImage: category.image,
            categoryType: category.type
        };

        // إدخال الفئة للمستخدم
        const updatedCard = await CardUser.findOneAndUpdate(
            { userId },
            { $push: { carduser: cardItem } },
            { new: true, upsert: true }
        );

        res.status(200).json({ message: 'تمت إضافة الفئة إلى البطاقة بنجاح.', card: updatedCard });
    } catch (error) {
        console.error('Error in addToCard:', error);
        res.status(500).json({ error: error.message });
    }
};

// حذف فئة من البطاقة
exports.deleteFromCard = async (req, res) => {
    const { categoryName } = req.body;
    const userId = req.user;

    try {
        const updatedCard = await CardUser.findOneAndUpdate(
            { userId },
            { $pull: { carduser: { categoryName } } },
            { new: true }
        );

        if (!updatedCard) {
            return res.status(404).json({ error: 'لم يتم العثور على بطاقة المستخدم.' });
        }

        res.status(200).json({ message: 'تم حذف الفئة بنجاح.', card: updatedCard });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
