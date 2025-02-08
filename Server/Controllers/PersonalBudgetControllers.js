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
    const userId = req.user; // تأكد أن الـ middleware للمصادقة يملأ req.user
  
    // الحصول على التاريخ بتوقيت عمّان (تاريخ اليوم فقط بصيغة ISO مثل "2025-02-08")
    const todayJordan = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Amman" });
  
    try {
      /**
       * نستخدم findOneAndUpdate مع شرط أن لا يوجد في مصفوفة المنتجات عنصر بنفس الـ CategoriesId وتاريخ اليوم.
       * في حالة عدم وجود وثيقة Budget للمستخدم، نستخدم upsert لإنشائها.
       * إذا لم يتم تحديث الوثيقة فهذا يعني أن العنصر موجود مسبقًا.
       */
      const updatedBudget = await Budget.findOneAndUpdate(
        {
          userId,
          $or: [
            { products: { $eq: [] } }, // حالة الوثيقة جديدة أو لا تحتوي على منتجات
            { products: { $not: { $elemMatch: { CategoriesId, date: todayJordan } } } } // لا يوجد عنصر بنفس الـ CategoriesId وتاريخ اليوم
          ]
        },
        { $push: { products: { CategoriesId, valueitem, date: todayJordan } } },
        { new: true, upsert: true }
      );
  
      // إذا لم يتم التحديث فهذا يعني أن العنصر موجود بالفعل
      if (!updatedBudget) {
        return res.status(400).json({ error: 'لا يمكنك إضافة نفس الفئة أكثر من مرة في اليوم.' });
      }
  
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