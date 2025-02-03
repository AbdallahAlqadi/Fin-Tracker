const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const userRoutes = require('./Routes/userRoutes');
const categoryRoutes = require('./Routes/categoryRoutes');
const PersonalBudgetRoutes= require('./Routes/PersonalBudgetRoutes');
const fedbackRoutes= require('./Routes/fedbackRoutes');


dotenv.config();
const app = express();
connectDB();
app.use(bodyParser.json());
app.use(cors());
app.use('/api', userRoutes);
app.use('/uploads', express.static('uploads'));
app.use('/api', categoryRoutes);
app.use('/api', PersonalBudgetRoutes);
app.use('/api', fedbackRoutes);


module.exports = app;