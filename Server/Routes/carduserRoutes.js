const express = require("express");
const routes = express.Router();
const { veryfyjwt } = require("../Controllers/userControllers");
const { addCardUser, getCardUser } = require("../Controllers/carduserController");

routes.post("/addCardUser", veryfyjwt, addCardUser);

routes.get("/getCardUser", veryfyjwt, getCardUser);
module.exports = routes;
