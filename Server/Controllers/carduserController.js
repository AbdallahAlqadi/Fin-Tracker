const UserCategory = require("../models/carduser");
const mongoose = require("mongoose");

// Add a new category specific to the logged-in user
exports.addUserCategory = async (req, res) => {
    const { categoryName, categoryType } = req.body;
    const userId = req.user; // Assuming veryfyjwt middleware adds user ID to req.user
    let imagePath = null;

    // Basic validation
    if (!categoryName || !categoryType) {
        return res.status(400).json({ error: "Category name and type are required." });
    }

    // Validate categoryType
    if (!["revenues", "expenses"].includes(categoryType.toLowerCase())) {
        return res.status(400).json({ error: "Invalid category type. Must be 'revenues' or 'expenses'." });
    }

    // Handle image upload if file exists
    if (req.file) {
        // Store the path relative to the server's public/uploads directory or use a cloud storage URL
        // Example: storing relative path
        imagePath = `uploads/${req.file.filename}`; // Adjust path as needed
    }

    try {
        // Check if category with the same name already exists for this user
        const existingCategory = await UserCategory.findOne({ userId, name: categoryName });
        if (existingCategory) {
            return res.status(400).json({ error: `You already have a category named '${categoryName}'.` });
        }

        // Create new user-specific category
        const newUserCategory = new UserCategory({
            userId,
            name: categoryName,
            type: categoryType.toLowerCase(), // Store type in lowercase
            image: imagePath, // Save the image path/URL
        });

        await newUserCategory.save();

        res.status(201).json({ 
            message: "User-specific category created successfully.", 
            data: newUserCategory 
        });

    } catch (error) {
        console.error("Error adding user category:", error);
        // Handle potential duplicate key error from the index
        if (error.code === 11000) {
             return res.status(400).json({ error: `You already have a category named '${categoryName}'.` });
        }
        res.status(500).json({ error: "An error occurred while adding the category." });
    }
};

// Get all categories specific to the logged-in user
exports.getUserCategories = async (req, res) => {
    const userId = req.user; // Assuming veryfyjwt middleware adds user ID to req.user

    try {
        const userCategories = await UserCategory.find({ userId });
        res.status(200).json({ data: userCategories });
    } catch (error) {
        console.error("Error fetching user categories:", error);
        res.status(500).json({ error: "An error occurred while fetching your categories." });
    }
};

// Optional: Add update and delete controllers if needed later

