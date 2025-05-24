const mongoose = require("mongoose");

const UserCategorySchema = new mongoose.Schema({
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "users", // Assuming your user model is named 'users'
        required: true 
    },
    name: { 
        type: String, 
        required: [true, "Category name is required."],
        trim: true 
    },
    type: { 
        type: String, 
        required: [true, "Category type is required."],
        enum: ["revenues", "expenses"] // Use 'revenues' instead of 'income'
    },
    image: { 
        type: String, // Store image path or URL
        default: null 
    },
    // Add timestamps if you want to track creation/update times
    // timestamps: true 
});

// Ensure a user cannot have two private categories with the same name
UserCategorySchema.index({ userId: 1, name: 1 }, { unique: true });

const UserCategory = mongoose.model("UserCategory", UserCategorySchema);
module.exports = UserCategory;

