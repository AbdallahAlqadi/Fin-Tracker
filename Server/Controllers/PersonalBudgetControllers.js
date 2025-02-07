const Budget = require('../models/PersonalBudget ');
const Category = require('../models/categoryData');


// get all products
exports.getUserBudget = async (req, res) => {
    try {                                                          //populate  :هاي يلي بتخليني اوصل للبيانات الموجوده في الداتابيز ل model ثانيه
        const budget = await Budget.findOne({ userId: req.user }).populate('products.CategoriesId');
        res.status(200).json(budget);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}



exports.addBudget = async (req, res) => {
    const { CategoriesId, valueitem } = req.body;
    const userId = req.user;
    const today = new Date();
    today.setHours(0, 0, 0, 0); // تصفير الوقت لضمان المقارنة حسب اليوم فقط

    try {
        let budget = await Budget.findOne({ userId });

        if (!budget) {
            budget = new Budget({
                userId,
                products: []
            });
        }

        // التحقق مما إذا كان العنصر موجودًا بالفعل في نفس اليوم
        const isDuplicate = budget.products.some(item => 
            item.CategoriesId.toString() === CategoriesId && 
            new Date(item.date).setHours(0, 0, 0, 0) === today.getTime()
        );

        if (isDuplicate) {
            return res.status(400).json({ error: 'لا يمكنك إضافة نفس الفئة أكثر من مرة في اليوم.' });
        }

        // إضافة العنصر إذا لم يكن مكررًا
        budget.products.push({ CategoriesId, valueitem, date: new Date() });

        await budget.save();
        res.status(200).json(budget);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};




// Update budget item
exports.updateBudget = async (req, res) => {
    const { CategoriesId, valueitem, date } = req.body;
    const userId = req.user;

    try {
        const budget = await Budget.findOne({ userId });
        if (!budget) {
            return res.status(404).json({ error: 'Budget not found' });
        }

        const budgetIndex = budget.products.findIndex((item) => 
            item.CategoriesId.toString() === CategoriesId && new Date(item.date).toISOString() === new Date(date).toISOString()
        );

        if (budgetIndex > -1) {
            budget.products[budgetIndex].valueitem = valueitem;
            await budget.save();
            res.status(200).json(budget);
        } else {
            res.status(404).json({ error: 'Category not found in budget' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};



// Delete budget item
exports.deleteBudget = async (req, res) => {
    const { CategoriesId, date } = req.body;
    const userId = req.user;

    try {
        const budget = await Budget.findOne({ userId });
        if (!budget) {
            return res.status(404).json({ error: 'Budget not found' });
        }

        const budgetIndex = budget.products.findIndex((item) => 
            item.CategoriesId.toString() === CategoriesId && new Date(item.date).toISOString() === new Date(date).toISOString()
        );

        if (budgetIndex > -1) {
            budget.products.splice(budgetIndex, 1);
            await budget.save();
            res.status(200).json({ message: 'Category deleted successfully', budget });
        } else {
            res.status(404).json({ error: 'Category not found in budget' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};