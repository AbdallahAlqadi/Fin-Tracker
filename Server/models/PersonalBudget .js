const mongoose = require('mongoose');

const BudgetSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true },
    products: [{
        CategoriesId: { type: mongoose.Schema.Types.ObjectId, ref: 'categories', required: true },
        valueitem: { type: Number, default: 0, required: true },
        date: { type: Date } // حقل التاريخ موجود
    }]
});

const Budget = mongoose.model('budget', BudgetSchema);
module.exports = Budget;



// const mongoose = require('mongoose');

// const ProductSchema = new mongoose.Schema({
//   itemId: {
//     type: mongoose.Schema.Types.ObjectId,
//     required: true,
//     refPath: 'products.kind'
//   },
//   kind: {
//     type: String,
//     required: true,
//     enum: ['categories', 'usercards']
//   },
//   valueitem: { type: Number, default: 0, required: true },
//   date: { type: Date, required: true }
// });

// const BudgetSchema = new mongoose.Schema({
//   userId: { type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true },
//   products: [ProductSchema]
// });

// module.exports = mongoose.model('budget', BudgetSchema);