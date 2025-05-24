const CardUser = require('../models/carduser');
const Category = require('../models/categoryData');
exports.getCardUser = async (req, res) => {
    try {
        const carduser = await CardUser.findOne({ userId: req.user }).populate('carduser');
        res.status(200).json(carduser);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};



exports.addCardUser = async (req, res) => {
    const { categoryName, categoryImage, categoryType } = req.body;
    const userId = req.user;

    try {
        // التحقق من وجود نفس الفئة مسبقًا لنفس المستخدم
        const existing = await CardUser.findOne({
            userId,
            carduser: {
                $elemMatch: {
                    categoryName,
                }
            }
        });

        if (existing) {
            return res.status(400).json({ error: 'هذه الفئة موجودة بالفعل لهذا المستخدم.' });
        }

        const updatedCard = await CardUser.findOneAndUpdate(
            { userId },
            {
                $push: {
                    carduser: {
                        categoryName,
                        categoryImage, // Expecting Base64 string here now
                        categoryType
                    }
                }
            },
            { new: true, upsert: true }
        );

        return res.status(200).json({ message: 'تمت الإضافة بنجاح.', data: updatedCard });
    } catch (error) {
        console.error('Error in addCardUser:', error);
        return res.status(500).json({ error: error.message });
    }
};
