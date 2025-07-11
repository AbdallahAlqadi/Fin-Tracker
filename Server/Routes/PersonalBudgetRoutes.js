const express=require('express')
const cors=require('cors');
const routes=express.Router();
require('dotenv').config();
const {veryfyjwt}= require('../Controllers/userControllers');
const {addBudget,getUserBudget,updateBudget,deleteBudget,deleteAllBudget}= require('../Controllers/PersonalBudgetControllers');


routes.get('/getUserBudget',veryfyjwt,getUserBudget);
routes.post('/addBudget',veryfyjwt,addBudget);
routes.put('/updateBudget',veryfyjwt,updateBudget);
routes.delete('/deleteBudget',veryfyjwt,deleteBudget);
routes.delete('/deleteallBudget',veryfyjwt,deleteAllBudget);

module.exports = routes;
