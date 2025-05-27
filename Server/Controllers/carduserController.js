  const CardUser = require("../models/carduser");

exports.addCardToUser = async (req, res) => {
    const { categoryName, categoryType, image } = req.body;
    const userId = req.user;
    let imageDataToSave = null;

    if (!categoryType || (categoryType !== "Revenues" && categoryType !== "Expenses")) {
        return res.status(400).json({ error: 'نوع الفئة غير صالح. يجب أن يكون "Revenues" أو "Expenses".' });
    }

    if (image && typeof image === "string" && image.startsWith("data:image/")) {
        const base64Parts = image.split(",");
        if (base64Parts.length === 2) {
            imageDataToSave = base64Parts[1];
        } else {
            console.warn("Unexpected Base64 format received for image.");
           
        }
    } else if (image) {
        return res.status(400).json({ error: "يرجى إرسال صورة بصيغة base64 صحيحة (تبدأ بـ data:image/)." });
    }

    try {
        const userDoc = await CardUser.findOne({ userId });
        const cardExists = userDoc && userDoc.carduser.some(card =>
            card.categoryName === categoryName && card.categoryType === categoryType
        );

        if (cardExists) {
            return res.status(400).json({ error: "تمت إضافة بطاقة بنفس الاسم والنوع مسبقًا." });
        }

        const updatedCardUser = await CardUser.findOneAndUpdate(
            { userId },
            {
                $push: {
                    carduser: { categoryName, categoryType, image: image } // حفظ سلسلة Base64 الكاملة
                }
            },
            { new: true, upsert: true, setDefaultsOnInsert: true }
        );

        return res.status(200).json({
            message: "تمت إضافة البطاقة بنجاح.",
            data: updatedCardUser
        });
    } catch (error) {
        console.error("Error in addCardToUser:", error);
        if (error.name === "ValidationError") {
            return res.status(400).json({ error: "بيانات الإدخال غير صالحة.", details: error.message });
        }
        return res.status(500).json({ error: "خطأ في الخادم الداخلي." });
    }
};

exports.getUserCards = async (req, res) => {
    const userId = req.user;

    try {
        const cardData = await CardUser.findOne({ userId });

        if (!cardData || !cardData.carduser || cardData.carduser.length === 0) {
            return res.status(404).json({ message: "لا توجد بطاقات مضافة لهذا المستخدم." });
        }

        return res.status(200).json(cardData);
    } catch (error) {
        console.error("Error in getUserCards:", error);
        return res.status(500).json({ error: "خطأ في الخادم الداخلي." });
    }
};
