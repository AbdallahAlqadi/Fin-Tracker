const express = require("express");
const router = express.Router();
const cardUserController = require("../Controllers/carduserController");

// --- Optional: Configure Multer for image uploads --- 
// If you handle image uploads, you'll need middleware like multer.
// Make sure to install multer: npm install multer
const multer = require("multer");
const path = require("path");

// Configure storage for multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Ensure the uploads directory exists
        const uploadPath = path.join(__dirname, "../uploads"); // Adjust path as needed
        // You might need to create this directory if it doesn't exist
        // require('fs').mkdirSync(uploadPath, { recursive: true }); 
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        // Create a unique filename
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
    }
});

// File filter (optional: accept only images)
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
        cb(null, true);
    } else {
        cb(new Error("Not an image! Please upload only images."), false);
    }
};

const upload = multer({ storage: storage, fileFilter: fileFilter });
// --- End Multer Configuration ---

// Define routes for CardUser

// POST route to create a new card/category
// Uses multer middleware `upload.single('image')` to handle single file upload with field name 'image'
router.post("/cardusers", upload.single("image"), cardUserController.createCardUser);

// GET route to fetch all cards/categories
router.get("/cardusers", cardUserController.getAllCardUsers);

// Add other routes as needed (e.g., GET by ID, PUT, DELETE)
// router.get("/cardusers/:id", cardUserController.getCardUserById);
// router.put("/cardusers/:id", upload.single("image"), cardUserController.updateCardUser);
// router.delete("/cardusers/:id", cardUserController.deleteCardUser);

module.exports = router;

