const express = require("express");
const routes = express.Router();
const { veryfyjwt } = require("../Controllers/userControllers");
const { addToCard, getUserCard } = require("../Controllers/carduserController");

// Middleware for handling image uploads (optional for now)
const multer = require("multer");

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + '.' + file.originalname.split('.').pop());
    }
});

const upload = multer({ storage: storage });

// إضافة فئة إلى بطاقة المستخدم
routes.post("/addToCard", veryfyjwt, upload.single("image"), addToCard);

// إرجاع فئات المستخدم
routes.get("/getUserCard", veryfyjwt, getUserCard);

module.exports = routes;
