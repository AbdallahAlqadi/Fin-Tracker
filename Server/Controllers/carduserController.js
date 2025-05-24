const CardUser = require("../models/carduser");
const Category = require("../models/categoryData");

// إرجاع بيانات المستخدم
exports.getUserCard = async (req, res) => {
    try {
        // Populate category details if needed, or just return the IDs
        const userCard = await CardUser.findOne({ userId: req.user }); //.populate('carduser.categoryId'); // Optional: if you need full category details
        res.status(200).json(userCard);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// إضافة فئة إلى carduser
exports.addToCard = async (req, res) => {
    const { CategoriesId } = req.body; // Assuming frontend sends the original Category._id as CategoriesId
    const userId = req.user;

    try {
        // التأكد من أن الفئة موجودة
        const category = await Category.findById(CategoriesId);
        if (!category) {
            return res.status(404).json({ error: "الفئة غير موجودة." });
        }

        // Check if this specific categoryId already exists for the user
        const existingCardEntry = await CardUser.findOne({
            userId,
            "carduser.categoryId": CategoriesId
        });

        if (existingCardEntry) {
            return res.status(400).json({ error: "الفئة موجودة بالفعل في البطاقة." });
        }

        // بناء بيانات الفئة لإضافتها
        const cardItem = {
            categoryId: category._id, // Store the original category ID
            categoryName: category.name,
            categoryImage: category.image,
            categoryType: category.type
        };

        // إدخال الفئة للمستخدم
        const updatedCard = await CardUser.findOneAndUpdate(
            { userId },
            { $push: { carduser: cardItem } },
            { new: true, upsert: true } // upsert: true creates the document if it doesn't exist
        );

        res.status(200).json({ message: "تمت إضافة الفئة إلى البطاقة بنجاح.", card: updatedCard });
    } catch (error) {
        console.error("Error in addToCard:", error);
        res.status(500).json({ error: error.message });
    }
};

// حذف فئة من البطاقة
exports.deleteFromCard = async (req, res) => {
    // It's better to delete by categoryId to avoid issues with duplicate names
    const { categoryId } = req.body; // Frontend should send the categoryId to delete
    const userId = req.user;

    if (!categoryId) {
        return res.status(400).json({ error: "معرف الفئة مطلوب للحذف." });
    }

    try {
        const updatedCard = await CardUser.findOneAndUpdate(
            { userId },
            { $pull: { carduser: { categoryId: categoryId } } }, // Pull based on categoryId
            { new: true }
        );

        if (!updatedCard) {
            // This might happen if the user document exists but the item wasn't found
            // Check if the user exists at all
            const userExists = await CardUser.findOne({ userId });
            if (!userExists) {
                 return res.status(404).json({ error: "لم يتم العثور على بطاقة المستخدم." });
            }
            // If user exists but item wasn't pulled, it means the item wasn't in their card
            return res.status(404).json({ error: "لم يتم العثور على الفئة في بطاقة المستخدم." });
        }

        res.status(200).json({ message: "تم حذف الفئة بنجاح.", card: updatedCard });
    } catch (error) {
        console.error("Error in deleteFromCard:", error);
        res.status(500).json({ error: error.message });
    }
};

