const Budget = require('../models/PersonalBudget ');
const Category = require('../models/categoryData');

exports.getUserBudget = async (req, res) => {
    try {
        const budget = await Budget.findOne({ userId: req.user }).populate('products.CategoriesId');
        res.status(200).json(budget);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Add budget item
exports.addBudget = async (req, res) => {
    const { CategoriesId, valueitem, date } = req.body;
    const userId = req.user;

    // تحويل التاريخ المرسل إلى صيغة YYYY-MM-DD
    const selectedDate = new Date(date).toISOString().split('T')[0];

    try {
        // التحقق من وجود الفئة في نفس التاريخ
        const existingBudget = await Budget.findOne({
            userId,
            products: {
                $elemMatch: {
                    CategoriesId,
                    date: {
                        $gte: new Date(selectedDate),
                        $lt: new Date(new Date(selectedDate).setDate(new Date(selectedDate).getDate() + 1))
                    }
                }
            }
        });

        if (existingBudget) {
            return res.status(400).json({ error: 'لا يمكنك إضافة نفس الفئة أكثر من مرة في نفس التاريخ.' });
        }

        // إضافة العنصر الجديد
        const updatedBudget = await Budget.findOneAndUpdate(
            { userId },
            {
                $push: {
                    products: {
                        CategoriesId,
                        valueitem,
                        date: new Date(selectedDate)
                    }
                }
            },
            { new: true, upsert: true }
        );

        return res.status(200).json({ message: 'تمت الإضافة بنجاح.', budget: updatedBudget });
    } catch (error) {
        console.error('Error in addBudget:', error);
        return res.status(500).json({ error: error.message });
    }
};

// Update budget item
exports.updateBudget = async (req, res) => {
    const { CategoriesId, valueitem, date } = req.body;
    const userId = req.user;

    // تحويل التاريخ إلى صيغة YYYY-MM-DD
    const selectedDate = new Date(date).toISOString().split('T')[0];

    try {
        const budget = await Budget.findOne({ userId });
        if (!budget) {
            return res.status(404).json({ error: 'Budget not found' });
        }

        // البحث عن العنصر بناءً على CategoriesId والتاريخ
        const budgetIndex = budget.products.findIndex((item) =>
            item.CategoriesId.toString() === CategoriesId &&
            new Date(item.date).toISOString().split('T')[0] === selectedDate
        );

        if (budgetIndex > -1) {
            budget.products[budgetIndex].valueitem = valueitem;
            await budget.save();
            res.status(200).json(budget);
        } else {
            res.status(404).json({ error: 'Category not found in budget for the specified date' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Delete budget item
exports.deleteBudget = async (req, res) => {
    const { CategoriesId, date } = req.body;
    const userId = req.user;

    // تحويل التاريخ إلى صيغة YYYY-MM-DD
    const selectedDate = new Date(date).toISOString().split('T')[0];

    try {
        const budget = await Budget.findOne({ userId });
        if (!budget) {
            return res.status(404).json({ error: 'Budget not found' });
        }

        // البحث عن العنصر بناءً على CategoriesId والتاريخ
        const budgetIndex = budget.products.findIndex((item) =>
            item.CategoriesId.toString() === CategoriesId &&
            new Date(item.date).toISOString().split('T')[0] === selectedDate
        );

        if (budgetIndex > -1) {
            budget.products.splice(budgetIndex, 1);
            await budget.save();
            res.status(200).json({ message: 'Category deleted successfully', budget });
        } else {
            res.status(404).json({ error: 'Category not found in budget for the specified date' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};