// const User=require('../models/users')
// const bcrypt = require('bcrypt');
// const jwt = require('jsonwebtoken');





 
// //Post
// exports.creatUser=async (req,res)=>{
// const {username,email,password}=req.body;

// try{

//     //وظيفه السطر انه يخفي password ب mongo
//     const  hashedPassword=await bcrypt.hash(password,10);

//     const newUser={username:username,email:email,password:hashedPassword};
// console.log(newUser)
// //مهمه لاجيب البيانات من post to get
// const dbUser=await User.create(newUser)//مشان اقدر اوصل للمعلومات يلي كتيتها ب postman

// res.status(200).json({message:`user Created successfully ${dbUser}`});


// }
// catch(error){
//     res.status(400).json({message:error.message});
// }
// }






// //هون بتاكد اذا المستخدم موجود او لا
// //post


// exports.userLogin=async(req,res)=>{
//     const {email,password}=req.body;
//     try{

//        const user=await User.findOne({email})
//        if(!user){
//         return res.status(400).json({message:'username is not found'})
//        }


//        const isMatch=await bcrypt.compare(password,user.password);
//        if(!isMatch){
//         return  res.status(400).json({message:'wrong username and pass' })

//        }

//        const  token=jwt.sign({userId:user._id},'fdfdfsddsdffeqweqqeqeqeqweq',{
//         expiresIn:'1h'
//        });
//        res.status(200).json({message:'user Found',token})
       

//     }
//     catch(error){
//         res.status(500).json({error:error.message})
//     }

// }




// //get(filter)

// exports.veryfyjwt=  async(req,res,next)=>{



//     //ببعت token من خلال header
//     try{
//         const token=req.header('Auth').replace('Bearer ','');

//         if(!token){
//             return res.status(401).json({message:'no token, authorization denird'})
//         }
//         // console.log('before jwt verify ')
//         const verified=jwt.verify(token,'fdfdfsddsdffeqweqqeqeqeqweq')
//         req.user=verified.userId;
//         // console.log(req.user)
        
//       next();
//     }


//     catch(error){
//         res.status(401).json({error:error.message})
//     }
// }



// //get
// //ببعت {email,password} and token
// exports.home= async(req,res)=>{
// user=req.user;
// roul=req.roul;

// try{
//     chekUser=await User.findById(user);
//     chekroul=await User.findById(user);

//     res.status(200).json({message:'welcome to home page',user:chekUser.username,roul:chekroul.roul})
// }

//  catch(error){
//         res.status(500).json({message:'error in home page'})
//     }
// }

    



// // GET: استرجاع جميع المستخدمين
// exports.getAllUsers = async (req, res) => {
//     try {
//       const users = await User.find({});
//       res.status(200).json({
//         message: "تم استرجاع المستخدمين بنجاح",
//         users
//       });
//     } catch (error) {
//       res.status(500).json({ message: error.message });
//     }
//   };
  





//   exports.updateUser = async (req, res) => {
//     const userId = req.user; // يأتي من veryfyjwt
//     const { username, email, password } = req.body;
  
//     try {
//       // التحقق من وجود المستخدم
//       const user = await User.findById(userId);
//       if (!user) {
//         return res.status(404).json({ message: 'المستخدم غير موجود' });
//       }
  
//       // إذا أرسل المستخدم اسم جديد، نحدّثه
//       if (username) {
//         user.username = username;
//       }
  
//       // إذا أرسل المستخدم بريد إلكتروني جديد، نتحقق أولاً أن البريد غير مستخدم مسبقاً
//       if (email && email !== user.email) {
//         const existingEmail = await User.findOne({ email });
//         if (existingEmail) {
//           return res.status(400).json({ message: 'هذا البريد مسجل لمستخدم آخر' });
//         }
//         user.email = email;
//       }
  
//       // إذا أرسل المستخدم كلمة مرور جديدة، نشفّرها ثم نحدّثها
//       if (password) {
//         const hashed = await bcrypt.hash(password, 10);
//         user.password = hashed;
//       }
  
//       // حفظ التعديلات في قاعدة البيانات
//       const updatedUser = await user.save();
  
//       // نرجع البيانات مع استثناء الحقل password من الاستجابة
//       const { password: _, ...userWithoutPassword } = updatedUser.toObject();
//       res.status(200).json({
//         message: 'تم تحديث بيانات المستخدم بنجاح',
//         user: userWithoutPassword
//       });
//     } catch (error) {
//       console.error('Error in updateUser:', error);
//       res.status(500).json({ message: error.message });
//     }
//   };


//   exports.deleteUser = async (req, res) => {
//     const userId = req.user; // يأتي من veryfyjwt
  
//     try {
//       // نحاول إيجاد المستخدم وحذفه
//       const deleted = await User.findByIdAndDelete(userId);
  
//       if (!deleted) {
//         return res.status(404).json({ message: 'المستخدم غير موجود أو تم حذفه مسبقًا' });
//       }
  
//       // إذا أردت حذف بيانات مرتبطة بالمستخدم (مثل الميزانية)، يمكنك فعل ذلك هنا.
//       // مثال: await Budget.deleteOne({ userId });
  
//       return res.status(200).json({ message: 'تم حذف الحساب بنجاح' });
//     } catch (error) {
//       console.error('Error in deleteUser:', error);
//       return res.status(500).json({ message: error.message });
//     }
//   };
const User=require('../models/users')
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');





 
//Post
exports.creatUser=async (req,res)=>{
const {username,email,password}=req.body;

try{

    //وظيفه السطر انه يخفي password ب mongo
    const  hashedPassword=await bcrypt.hash(password,10);

    const newUser={username:username,email:email,password:hashedPassword};
console.log(newUser)
//مهمه لاجيب البيانات من post to get
const dbUser=await User.create(newUser)//مشان اقدر اوصل للمعلومات يلي كتيتها ب postman

res.status(200).json({message:`user Created successfully ${dbUser}`});


}
catch(error){
    res.status(400).json({message:error.message});
}
}






//هون بتاكد اذا المستخدم موجود او لا
//post


exports.userLogin=async(req,res)=>{
    const {email,password}=req.body;
    try{

       const user=await User.findOne({email})
       if(!user){
        return res.status(400).json({message:'username is not found'})
       }


       const isMatch=await bcrypt.compare(password,user.password);
       if(!isMatch){
        return  res.status(400).json({message:'wrong username and pass' })

       }

       const  token=jwt.sign({userId:user._id},'fdfdfsddsdffeqweqqeqeqeqweq',{
        expiresIn:'1h'
       });
       res.status(200).json({message:'user Found',token})
       

    }
    catch(error){
        res.status(500).json({error:error.message})
    }

}




//get(filter)

exports.veryfyjwt=  async(req,res,next)=>{



    //ببعت token من خلال header
    try{
        const token=req.header('Auth').replace('Bearer ','');

        if(!token){
            return res.status(401).json({message:'no token, authorization denird'})
        }
        // console.log('before jwt verify ')
        const verified=jwt.verify(token,'fdfdfsddsdffeqweqqeqeqeqweq')
        req.user=verified.userId;
        // console.log(req.user)
        
      next();
    }


    catch(error){
        res.status(401).json({error:error.message})
    }
}



//get
//ببعت {email,password} and token
exports.home= async(req,res)=>{
user=req.user;
roul=req.roul;

try{
    chekUser=await User.findById(user);
    chekroul=await User.findById(user);

    res.status(200).json({message:'welcome to home page',user:chekUser.username,roul:chekroul.roul})
}

 catch(error){
        res.status(500).json({message:'error in home page'})
    }
}

    



// GET: استرجاع جميع المستخدمين
exports.getAllUsers = async (req, res) => {
    try {
      const users = await User.find({});
      res.status(200).json({
        message: "تم استرجاع المستخدمين بنجاح",
        users
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };
  





  exports.updateUser = async (req, res) => {
    const userId = req.user; // يأتي من veryfyjwt
    const { username, email, password } = req.body;
  
    try {
      // التحقق من وجود المستخدم
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: 'المستخدم غير موجود' });
      }
  
      // إذا أرسل المستخدم اسم جديد، نحدّثه
      if (username) {
        user.username = username;
      }
  
      // إذا أرسل المستخدم بريد إلكتروني جديد، نتحقق أولاً أن البريد غير مستخدم مسبقاً
      if (email && email !== user.email) {
        const existingEmail = await User.findOne({ email });
        if (existingEmail) {
          return res.status(400).json({ message: 'هذا البريد مسجل لمستخدم آخر' });
        }
        user.email = email;
      }
  
      // إذا أرسل المستخدم كلمة مرور جديدة، نشفّرها ثم نحدّثها
      if (password) {
        const hashed = await bcrypt.hash(password, 10);
        user.password = hashed;
      }
  
      // حفظ التعديلات في قاعدة البيانات
      const updatedUser = await user.save();
  
      // نرجع البيانات مع استثناء الحقل password من الاستجابة
      const { password: _, ...userWithoutPassword } = updatedUser.toObject();
      res.status(200).json({
        message: 'تم تحديث بيانات المستخدم بنجاح',
        user: userWithoutPassword
      });
    } catch (error) {
      console.error('Error in updateUser:', error);
      res.status(500).json({ message: error.message });
    }
  };


  exports.deleteUser = async (req, res) => {
    const userId = req.user; // يأتي من veryfyjwt
  
    try {
      // نحاول إيجاد المستخدم وحذفه
      const deleted = await User.findByIdAndDelete(userId);
  
      if (!deleted) {
        return res.status(404).json({ message: 'المستخدم غير موجود أو تم حذفه مسبقًا' });
      }
  
      // إذا أردت حذف بيانات مرتبطة بالمستخدم (مثل الميزانية)، يمكنك فعل ذلك هنا.
      // مثال: await Budget.deleteOne({ userId });
  
      return res.status(200).json({ message: 'تم حذف الحساب بنجاح' });
    } catch (error) {
      console.error('Error in deleteUser:', error);
      return res.status(500).json({ message: error.message });
    }
  };

  // Admin function to update any user by ID
  exports.updateUserByAdmin = async (req, res) => {
    const adminUserId = req.user; // يأتي من veryfyjwt
    const targetUserId = req.params.userId; // المستخدم المراد تعديله
    const { username, email, password } = req.body;
  
    try {
      // التحقق من أن المستخدم الحالي هو admin
      const adminUser = await User.findById(adminUserId);
      if (!adminUser || adminUser.roul !== 'admin') {
        return res.status(403).json({ message: 'غير مسموح - يجب أن تكون admin' });
      }
  
      // التحقق من وجود المستخدم المراد تعديله
      const targetUser = await User.findById(targetUserId);
      if (!targetUser) {
        return res.status(404).json({ message: 'المستخدم المراد تعديله غير موجود' });
      }
  
      // إذا أرسل المستخدم اسم جديد، نحدّثه
      if (username) {
        targetUser.username = username;
      }
  
      // إذا أرسل المستخدم بريد إلكتروني جديد، نتحقق أولاً أن البريد غير مستخدم مسبقاً
      if (email && email !== targetUser.email) {
        const existingEmail = await User.findOne({ email });
        if (existingEmail && existingEmail._id.toString() !== targetUserId) {
          return res.status(400).json({ message: 'هذا البريد مسجل لمستخدم آخر' });
        }
        targetUser.email = email;
      }
  
      // إذا أرسل المستخدم كلمة مرور جديدة، نشفّرها ثم نحدّثها
      if (password) {
        const hashed = await bcrypt.hash(password, 10);
        targetUser.password = hashed;
      }
  
      // حفظ التعديلات في قاعدة البيانات
      const updatedUser = await targetUser.save();
  
      // نرجع البيانات مع استثناء الحقل password من الاستجابة
      const { password: _, ...userWithoutPassword } = updatedUser.toObject();
      res.status(200).json({
        message: 'تم تحديث بيانات المستخدم بنجاح بواسطة الادمن',
        user: userWithoutPassword
      });
    } catch (error) {
      console.error('Error in updateUserByAdmin:', error);
      res.status(500).json({ message: error.message });
    }
  };

  // Admin function to delete any user by ID
  exports.deleteUserByAdmin = async (req, res) => {
    const adminUserId = req.user; // يأتي من veryfyjwt
    const targetUserId = req.params.userId; // المستخدم المراد حذفه
  
    try {
      // التحقق من أن المستخدم الحالي هو admin
      const adminUser = await User.findById(adminUserId);
      if (!adminUser || adminUser.roul !== 'admin') {
        return res.status(403).json({ message: 'غير مسموح - يجب أن تكون admin' });
      }
  
      // منع الادمن من حذف نفسه
      if (adminUserId === targetUserId) {
        return res.status(400).json({ message: 'لا يمكن للادمن حذف نفسه' });
      }
  
      // نحاول إيجاد المستخدم وحذفه
      const deleted = await User.findByIdAndDelete(targetUserId);
  
      if (!deleted) {
        return res.status(404).json({ message: 'المستخدم غير موجود أو تم حذفه مسبقًا' });
      }
  
      // إذا أردت حذف بيانات مرتبطة بالمستخدم (مثل الميزانية)، يمكنك فعل ذلك هنا.
      // مثال: await Budget.deleteOne({ userId: targetUserId });
  
      return res.status(200).json({ message: 'تم حذف المستخدم بنجاح بواسطة الادمن' });
    } catch (error) {
      console.error('Error in deleteUserByAdmin:', error);
      return res.status(500).json({ message: error.message });
    }
  };

