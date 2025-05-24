const mongoose = require('mongoose');

// Define the schema for the Card/Category
const cardUserSchema = new mongoose.Schema({
    categoryName: {
        type: String,
        required: [true, 'Category name is required.'],
        trim: true,
        unique: true // Assuming category names should be unique
    },
    categoryType: {
        type: String,
        required: [true, 'Category type is required.'],
        enum: ['income', 'expenses'], // Restrict to specific types if needed, based on frontend logic
        trim: true
    },
    image: {
        type: String, // Store the path or URL of the image
        required: false // Image might be optional
    },
    // Add timestamps for tracking creation and updates
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Middleware to update the 'updatedAt' field on save
cardUserSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Create the model from the schema
const CardUserModel = mongoose.model('CardUser', cardUserSchema);

module.exports = CardUserModel;

