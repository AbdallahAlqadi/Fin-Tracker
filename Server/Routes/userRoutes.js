
// const express=require('express')
// const cors=require('cors');
// const routes=express.Router();
// require('dotenv').config();

// const {creatUser, userLogin,home,veryfyjwt,getAllUsers,updateUser,deleteUser}=require('../Controllers/userControllers'); 


// routes.post('/users',creatUser);
// routes.post('/users/login',userLogin);
// routes.get('/jwt',veryfyjwt);
// routes.get('/home',veryfyjwt,home);
// routes.get('/alluser',veryfyjwt,getAllUsers);
// routes.put('/updateuser',veryfyjwt,updateUser);

// routes.delete('/deleteuser', veryfyjwt, deleteUser);


// module.exports=routes;


const express=require('express')
const cors=require('cors');
const routes=express.Router();
require('dotenv').config();

const {creatUser, userLogin,home,veryfyjwt,getAllUsers,updateUser,deleteUser,updateUserByAdmin,deleteUserByAdmin}=require('../Controllers/userControllers'); 


routes.post('/users',creatUser);
routes.post('/users/login',userLogin);
routes.get('/jwt',veryfyjwt);
routes.get('/home',veryfyjwt,home);
routes.get('/alluser',veryfyjwt,getAllUsers);
routes.put('/updateuser',veryfyjwt,updateUser);
routes.delete('/deleteuser', veryfyjwt, deleteUser);

// Admin routes for managing other users
routes.put('/admin/users/:userId',veryfyjwt,updateUserByAdmin);
routes.delete('/admin/users/:userId', veryfyjwt, deleteUserByAdmin);


module.exports=routes;

