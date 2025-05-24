const CardUserModel = require("../models/carduser");
const path = require("path");

// Controller function to create a new Card/Category
exports.createCardUser = async (req, res) => {
    try {
        const { categoryName, categoryType } = req.body;

        // Basic validation
        if (!categoryName || !categoryType) {
            return res.status(400).json({ success: false, message: "Category name and type are required." });
        }

        // Check if category already exists (optional, based on unique constraint in model)
        const existingCategory = await CardUserModel.findOne({ categoryName });
        if (existingCategory) {
            return res.status(400).json({ success: false, message: "Category with this name already exists." });
        }

        let imagePath = null;
        // Handle potential image upload (assuming middleware like multer has processed the file)
        if (req.file) {
            // Construct the image path or URL to be saved
            // Example: store relative path accessible by the server/frontend
            // Adjust this based on your file storage strategy (e.g., uploads folder, cloud storage)
            imagePath = `/uploads/${req.file.filename}`; // Example path
        }

        // Create a new card document
        const newCard = new CardUserModel({
            categoryName,
            categoryType,
            image: imagePath, // Save the path to the image
        });

        // Save the document to the database
        await newCard.save();

        // Send success response
        res.status(201).json({
            success: true,
            message: "Card/Category created successfully.",
            data: newCard,
        });

    } catch (error) {
        console.error("Error creating card:", error);
        // Handle potential errors (e.g., validation errors from Mongoose)
        if (error.name === "ValidationError") {
            return res.status(400).json({ success: false, message: error.message });
        }
        res.status(500).json({ success: false, message: "Server error while creating card." });
    }
};

// Add other controller functions as needed (e.g., getCards, updateCard, deleteCard)

// Example: Get all cards
exports.getAllCardUsers = async (req, res) => {
    try {
        const cards = await CardUserModel.find();
        res.status(200).json({
            success: true,
            count: cards.length,
            data: cards,
        });
    } catch (error) {
        console.error("Error fetching cards:", error);
        res.status(500).json({ success: false, message: "Server error while fetching cards." });
    }
};

// Add more functions like getCardById, updateCardUser, deleteCardUser following a similar pattern

