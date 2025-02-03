const Fedback=require('../models/fedback')





 
//Post
exports.creatFedback=async (req,res)=>{
const {username,message}=req.body;

try{


    const newFedback={username:username,message:message};
console.log(newFedback)
const dbFedback=await Fedback.create(newFedback)

res.status(200).json({message:`Send fedback ${dbFedback}`});


}
catch(error){
    res.status(400).json({message:error.message});
}
}


// Get all feedbacks
exports.getFedback = async (req, res) => {
    try {
        const feedbacks = await Fedback.find(); // جلب جميع التعليقات من قاعدة البيانات
        res.status(200).json(feedbacks);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
