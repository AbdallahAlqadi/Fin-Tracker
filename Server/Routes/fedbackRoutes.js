
const express=require('express')
const cors=require('cors');
const routes=express.Router();
require('dotenv').config();

const {creatFedback}=require('../Controllers/fedbackControllers'); 


routes.post('/fedback',creatFedback);




module.exports=routes;