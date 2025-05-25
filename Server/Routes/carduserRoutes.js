const express=require('express')
const cors=require('cors');
const routes=express.Router();
require('dotenv').config();
const {veryfyjwt}= require('../Controllers/userControllers');
const {getUserCards,addCardToUser}= require('../Controllers/carduserController');


routes.get('/getUserCards',veryfyjwt,getUserCards);
routes.post('/addCardToUser',veryfyjwt,addCardToUser);

module.exports = routes;
