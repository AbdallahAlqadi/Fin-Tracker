// const express = require('express');
// const cors = require('cors');
// const bodyParser = require('body-parser');
// const dotenv = require('dotenv');
// const connectDB = require('./config/db');
// const userRoutes = require('./Routes/userRoutes');
// const categoryRoutes = require('./Routes/categoryRoutes');
// const PersonalBudgetRoutes= require('./Routes/PersonalBudgetRoutes');
// const fedbackRoutes= require('./Routes/fedbackRoutes');
// const path = require('path');
// const carduserRoutes= require('./Routes/carduserRoutes');


// dotenv.config();
// const app = express();
// connectDB();
// app.use(bodyParser.json());
// app.use(cors());
// app.use('/api', userRoutes);
// app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// app.use(express.urlencoded({ extended: true }));

// app.use('/api', categoryRoutes);
// app.use('/api', PersonalBudgetRoutes);
// app.use('/api', fedbackRoutes);

// app.use('/api', carduserRoutes);

// module.exports = app;



const express = require("express");
const cors = require("cors");
// const bodyParser = require('body-parser'); // Replaced with express.json()
const dotenv = require("dotenv");
const connectDB = require("./config/db"); // Assuming this file exists and works
const path = require("path");
const multer = require("multer"); // Required for error handling instance check

// Import Routes
const userRoutes = require("./Routes/userRoutes");
const categoryRoutes = require("./Routes/categoryRoutes");
const PersonalBudgetRoutes = require("./Routes/PersonalBudgetRoutes");
const fedbackRoutes = require("./Routes/fedbackRoutes");
const cardUserRoutes = require("./Routes/carduserRoutes"); // Corrected casing

// Load environment variables
dotenv.config();

// Create Express app
const app = express();

// Connect to Database (assuming connectDB handles this)
connectDB();

// --- Middleware ---

// Enable CORS
app.use(cors());

// Body Parsers
app.use(express.json()); // Use built-in JSON parser instead of body-parser
app.use(express.urlencoded({ extended: true }));

// Serve static files from 'uploads' directory
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// --- API Routes ---
// Mount all routes under /api
app.use("/api", userRoutes);
app.use("/api", categoryRoutes);
app.use("/api", PersonalBudgetRoutes);
app.use("/api", fedbackRoutes);
app.use("/api", cardUserRoutes); // Use the CardUser routes

// --- Error Handling ---

// Handle 404 Not Found errors for requests that didn't match any route
app.use((req, res, next) => {
    res.status(404).json({ success: false, message: "Resource not found" });
});

// General error handler middleware (must be defined last)
app.use((err, req, res, next) => {
    console.error("Unhandled error:", err);
    // Handle specific errors like multer errors
    if (err instanceof multer.MulterError) {
        return res.status(400).json({ success: false, message: `File upload error: ${err.message}` });
    } else if (err.message === "Not an image! Please upload only images.") { // Specific error from fileFilter in CardUserRoutes
        return res.status(400).json({ success: false, message: err.message });
    }
    // Default internal server error response
    res.status(500).json({ success: false, message: "Internal Server Error" });
});

module.exports = app;

// Note: This file exports the configured Express app.
// You still need a separate file (e.g., index.js or server.js)
// to import this app and start the server using app.listen(),
// potentially after confirming the database connection.

