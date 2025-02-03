
const express=require('express')
const cors=require('cors');
const routes=express.Router();
require('dotenv').config();

const {creatFedback,getFedback}=require('../Controllers/fedbackControllers'); 


routes.post('/fedback',creatFedback);

routes.get('/fedback',getFedback);



module.exports=routes;