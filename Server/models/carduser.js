const mongoose = require('mongoose');

const CardUserSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true },
    carduser: [{
        categoryName: { type: String, required: true },
        categoryImage: { type: String ,required: true}, 
        categoryType: { type: String ,required: true},  
    }]
});

const CardUser = mongoose.model('carduser', CardUserSchema);
module.exports = CardUser;