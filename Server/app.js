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


const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const path = require('path');

// استيراد الاتصال بقاعدة البيانات
const connectDB = require('./config/db');

// استيراد الراوترات
const userRoutes = require('./Routes/userRoutes');
const categoryRoutes = require('./Routes/categoryRoutes');
const PersonalBudgetRoutes = require('./Routes/PersonalBudgetRoutes');
const fedbackRoutes = require('./Routes/fedbackRoutes');
const carduserRoutes = require('./Routes/carduserRoutes');

dotenv.config();

const app = express();

// الاتصال بقاعدة البيانات
connectDB();

// إعدادات CORS للسماح للواجهة الأمامية بالوصول
app.use(cors({
  origin: 'http://localhost:3000', // تأكد أنه نفس العنوان المستخدم في الواجهة
  credentials: true // يسمح بتمرير الكوكيز والتوكنات (Auth headers)
}));

// إعدادات بارسر للـ JSON و x-www-form-urlencoded
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));

// الوصول للصور أو الملفات المرفوعة
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// استخدام الراوترات
app.use('/api', userRoutes);
app.use('/api', categoryRoutes);
app.use('/api', PersonalBudgetRoutes);
app.use('/api', fedbackRoutes);
app.use('/api', carduserRoutes);

// تصدير التطبيق (في حال تستخدم ملف منفصل لتشغيل السيرفر)
module.exports = app;
