// const express = require('express');
// const cors = require('cors');
// const bodyParser = require('body-parser');
// const dotenv = require('dotenv');
// const connectDB = require('./config/db');
// const userRoutes = require('./Routes/userRoutes');
// const categoryRoutes = require('./Routes/categoryRoutes');
// const PersonalBudgetRoutes= require('./Routes/PersonalBudgetRoutes');
// const fedbackRoutes= require('./Routes/fedbackRoutes');
// const carduserRoutes= require('./Routes/carduserRoutes');

// const path = require('path');


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
const bodyParser = require("body-parser"); // Keep this if you use it
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const userRoutes = require("./Routes/userRoutes");
const categoryRoutes = require("./Routes/categoryRoutes");
const PersonalBudgetRoutes = require("./Routes/PersonalBudgetRoutes");
const fedbackRoutes = require("./Routes/fedbackRoutes");
const carduserRoutes = require("./Routes/carduserRoutes");
const path = require("path");

dotenv.config();
const app = express();
connectDB();

// ▼▼▼ قم بتعديل هذه الأسطر ▼▼▼
// زيادة حد حجم الطلب (مثلاً إلى 50 ميجابايت)
// استخدم express المدمج إذا كان إصدارك حديثًا:
app.use(express.json({ limit: "50mb" })); 
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// أو إذا كنت لا تزال تستخدم مكتبة bodyParser المنفصلة:
// app.use(bodyParser.json({ limit: "50mb" }));
// app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));
// ▲▲▲ قم بتعديل هذه الأسطر ▲▲▲

app.use(cors()); // تأكد أن هذا يأتي بعد إعدادات حجم الطلب

app.use("/api", userRoutes);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// المسارات الأخرى
app.use("/api", categoryRoutes);
app.use("/api", PersonalBudgetRoutes);
app.use("/api", fedbackRoutes);
app.use("/api", carduserRoutes);

module.exports = app;
