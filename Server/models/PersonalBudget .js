const mongoose = require('mongoose');

const BudgetSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true },
    products: [{
        CategoriesId: { type: mongoose.Schema.Types.ObjectId, ref: 'categories', required: true },
        valueitem: { type: Number, default: 0, required: true },
        date: { type: Date, default: Date.now } // إضافة حقل التاريخ
    }]
});

const Budget = mongoose.model('budget', BudgetSchema);
module.exports = Budget;