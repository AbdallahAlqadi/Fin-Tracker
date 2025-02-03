
const mongoose=require('mongoose')

const fedbackSchema=new mongoose.Schema({
username:{type:String,required:true},
message:{type:String,required:true},


})

const Fedback=mongoose.model('fedback',fedbackSchema);

module.exports=Fedback;