
const express=require('express')
const cors=require('cors');
const routes=express.Router();
require('dotenv').config();

const {creatUser, userLogin,home,veryfyjwt,getAllUsers}=require('../Controllers/userControllers'); 


routes.post('/users',creatUser);
routes.post('/users/login',userLogin);
routes.get('/jwt',veryfyjwt);
routes.get('/home',veryfyjwt,home);
routes.get('/alluser',veryfyjwt,getAllUsers);



module.exports=routes;