const express = require("express");
const routes = express.Router();
app.use(cors(corsOptions));
// Assuming verifyjwt middleware is correctly placed relative to your app structure
// And that it correctly attaches the user's ObjectId to req.user
const { veryfyjwt } = require("../Controllers/userControllers"); 
const { addCardUser, getCardUser } = require("../Controllers/carduserController"); // Corrected path

// Route to add a new card for the logged-in user
routes.post("/addCardUser", veryfyjwt, addCardUser);

// Route to get all cards added by the logged-in user
routes.get("/getCardUser", veryfyjwt, getCardUser);

module.exports = routes;
