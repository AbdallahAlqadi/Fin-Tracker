const UserCategory = require("../models/carduser"); // Ensure this path is correct
const mongoose = require("mongoose");

// Add a new category specific to the logged-in user (Handles Base64 image in JSON)
exports.addUserCategory = async (req, res) => {
    // Destructure categoryName, categoryType, and image (Base64 string) from req.body
    const { categoryName, categoryType, image } = req.body;
    const userId = req.user; // Assuming veryfyjwt middleware adds user ID to req.user

    // Basic validation for required fields
    if (!categoryName || !categoryType) {
        return res.status(400).json({ error: "Category name and type are required." });
    }

    // Validate categoryType
    if (!["revenues", "expenses"].includes(categoryType.toLowerCase())) {
        return res.status(400).json({ error: "Invalid category type. Must be 'revenues' or 'expenses'." });
    }

    // Optional: Basic validation for Base64 image string
    let imageBase64 = null;
    if (image) {
        // Check if it looks like a data URI
        if (typeof image === 'string' && image.startsWith('data:image/')) {
            imageBase64 = image; // Use the provided Base64 string
        } else {
            // Handle cases where the image field is present but not a valid data URI (optional)
            console.warn("Received image field is not a valid Base64 data URI.");
            // Depending on requirements, you might return an error or just ignore it
            // return res.status(400).json({ error: "Invalid image format. Expected Base64 data URI." });
        }
    }

    try {
        // Check if category with the same name already exists for this user
        const existingCategory = await UserCategory.findOne({ userId, name: categoryName });
        if (existingCategory) {
            return res.status(400).json({ error: `You already have a category named '${categoryName}'.` });
        }

        // Create new user-specific category, storing the Base64 string directly
        const newUserCategory = new UserCategory({
            userId,
            name: categoryName,
            type: categoryType.toLowerCase(), // Store type in lowercase
            image: imageBase64, // Save the Base64 string (or null if not provided/invalid)
        });

        await newUserCategory.save();

        // Return the created category data (including the image field)
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
        // Handle potential validation errors from Mongoose schema
        if (error.name === 'ValidationError') {
            return res.status(400).json({ error: error.message });
        }
        res.status(500).json({ error: "An error occurred while adding the category." });
    }
};

// Get all categories specific to the logged-in user
exports.getUserCategories = async (req, res) => {
    const userId = req.user; // Assuming veryfyjwt middleware adds user ID to req.user

    try {
        // Fetch categories, ensuring the 'image' field is included
        const userCategories = await UserCategory.find({ userId });
        res.status(200).json({ data: userCategories });
    } catch (error) {
        console.error("Error fetching user categories:", error);
        res.status(500).json({ error: "An error occurred while fetching your categories." });
    }
};

// Optional: Add update and delete controllers if needed later

