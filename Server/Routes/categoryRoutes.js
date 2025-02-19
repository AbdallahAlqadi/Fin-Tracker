const express = require('express');
const routes = express.Router();
const multer = require('multer');
const cors=require('cors');
require('dotenv').config();

const {createCategory, getCategories,Deletecategory,Updatecategory } = require('../Controllers/categoryControllers');



routes.post('/category',createCategory);
routes.get('/getcategories',getCategories);
routes.delete('/deletecategory/:id',Deletecategory);
routes.put('/updatecategory/:id',Updatecategory);


module.exports = routes;