const express = require('express');
const routes = express.Router();
const { veryfyjwt } = require('../Controllers/userControllers');

const {
  getUserCard,
  addToCard,
  deleteFromCard
} = require('../Controllers/carduserController');

routes.get('/getUserCard', veryfyjwt, getUserCard);
routes.post('/addToCard', veryfyjwt, addToCard);
routes.delete('/deleteFromCard', veryfyjwt, deleteFromCard);

module.exports = routes;
