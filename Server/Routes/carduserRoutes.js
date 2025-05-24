const express = require("express");
const routes = express.Router();
const { veryfyjwt } = require("../Controllers/userControllers"); // Assuming this middleware is in the correct path relative to this routes file
const { addUserCategory, getUserCategories } = require("../Controllers/carduserController");

// Route to add a new user-specific category (protected by JWT verification)
// Removed multer middleware (upload.single("image")) to accept JSON payload with Base64 image
routes.post("/addUserCategory", veryfyjwt, addUserCategory);

// Route to get all categories specific to the logged-in user (protected by JWT verification)
routes.get("/getUserCategories", veryfyjwt, getUserCategories);

module.exports = routes;

