const express = require("express");
const routes = express.Router();
const { veryfyjwt } = require("../Controllers/userControllers"); // Assuming this middleware is in the correct path relative to this routes file
const { addUserCategory, getUserCategories } = require("../Controllers/carduserController.js");

// Middleware for handling image uploads (using multer, assuming it's configured elsewhere, e.g., in server.js or a dedicated middleware file)
// Example using multer (ensure multer is installed: npm install multer)
const multer = require("multer");
// Configure multer storage (example: save to uploads folder)
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/'); // Make sure 'uploads/' directory exists
    },
    filename: function (req, file, cb) {
        // Create a unique filename to avoid overwrites
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + '.' + file.originalname.split('.').pop());
    }
});
const upload = multer({ storage: storage });

// Route to add a new user-specific category (protected by JWT verification)
// The 'upload.single("image")' middleware handles the image file upload
// It expects the image file to be sent with the key "image" in the form-data
routes.post("/addUserCategory", veryfyjwt, upload.single("image"), addUserCategory);

// Route to get all categories specific to the logged-in user (protected by JWT verification)
routes.get("/getUserCategories", veryfyjwt, getUserCategories);

module.exports = routes;

