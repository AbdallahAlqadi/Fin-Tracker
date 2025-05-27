const mongoose = require("mongoose");

// --- MODIFIED Budget Schema ---
const BudgetSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "users", required: true },
    products: [{
        // Can reference either an admin category or a user-created card
        CategoriesId: { type: mongoose.Schema.Types.ObjectId, ref: "categories" }, // Optional ref to admin categories
        UserCardId:   { type: mongoose.Schema.Types.ObjectId, ref: "usercards" }, // Optional ref to user cards
        valueitem: { type: Number, default: 0, required: true },
        date:      { type: Date, required: true } // Date is required
    }]
});

// Add a check to ensure at least one ID is provided per product
BudgetSchema.path("products").validate(function (products) {
    if (!products) return true; // Allow empty array
    return products.every(p => p.CategoriesId || p.UserCardId);
}, "Each budget product must have either a CategoriesId or a UserCardId.");

const Budget = mongoose.model("budget", BudgetSchema);
module.exports = Budget;
