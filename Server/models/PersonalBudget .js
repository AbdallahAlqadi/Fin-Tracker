const mongoose = require("mongoose");

// Revised Budget Schema without UserCardId
const BudgetSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "users", required: true },
  products: [{
    // Reference only to admin categories
    CategoriesId: { type: mongoose.Schema.Types.ObjectId, ref: "categories", required: true },
    valueitem:     { type: Number, default: 0, required: true },
    date:          { type: Date, required: true }
  }]
});

// Validate that products array items always have a CategoriesId
BudgetSchema.path("products").validate(function (products) {
  if (!products) return true; // Allow empty array
  return products.every(p => !!p.CategoriesId);
}, "Each budget product must have a CategoriesId.");

const Budget = mongoose.model("budget", BudgetSchema);
module.exports = Budget;
