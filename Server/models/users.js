
const mongoose=require('mongoose')

const userSchema=new mongoose.Schema({
username:{type:String,required:true,unique:true},
password:{type:String,required:true},
// email:{type:String,required:true},
email: { type: String, required: true, unique: true, index: true },
roul:{type:String,required:true,default:'user'},


})

const User=mongoose.model('users',userSchema);

module.exports=User;