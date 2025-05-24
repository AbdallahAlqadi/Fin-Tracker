const mongoose = require('mongoose');

// Define the schema for an individual card added by a user
const CardSchema = new mongoose.Schema({
    categoryName: {
        type: String,
        required: [true, 'Category name is required.'],
        trim: true
    },
    categoryImage: {
        type: String, // Assuming Base64 string or a URL
        required: [true, 'Category image is required.']
    },
    categoryType: {
        type: String,
        required: [true, 'Category type is required.'],
        trim: true
    }
}, { _id: false }); // Don't create a separate _id for subdocuments unless needed

// Define the main schema for user-specific cards
const CardUserSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users', // Reference to the User model (ensure you have a 'users' model)
        required: true,
        unique: true // Each user should have only one CardUser document
    },
    carduser: [CardSchema] // Array of cards added by this user
}, {
    timestamps: true // Automatically add createdAt and updatedAt fields
});

const CardUser = mongoose.model('carduser', CardUserSchema);

module.exports = CardUser;
