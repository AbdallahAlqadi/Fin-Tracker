
const express=require('express')
const cors=require('cors');
const routes=express.Router();
require('dotenv').config();

const {creatUser, userLogin,home,veryfyjwt,updateUser}=require('../Controllers/userControllers'); 


routes.post('/users',creatUser);
routes.post('/users/login',userLogin);
routes.get('/jwt',veryfyjwt);
routes.get('/home',veryfyjwt,home);



module.exports=routes;