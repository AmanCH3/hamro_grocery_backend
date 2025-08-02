import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import path from 'path';
import { fileURLToPath } from 'url';
import { connectDB } from "./config/db.js";
import userRoutes from './Routes/userRoutes.js';
import adminUserRoutes from './Routes/admin/adminUserRoutes.js';
import categoryRoutes from './Routes/categoryRoutes.js';
import productRoutes from './Routes/productRoutes.js';
import orderRoutes from './Routes/orderRoutes.js';
import dashboardRoutes from './Routes/dashboardRoutes.js';
import khaltiRoutes from "./Routes/khaltiRoutes.js";
import paymentRoutes from './Routes/paymentRoutes.js';
import notificationRoutes from './Routes/notificationRoutes.js';
import errorHandler from './middleware/errorHandler.js';
import chatRoutes from "./Routes/chatbotRoutes.js" ;

const app = express();
connectDB();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const corsOptions = {
  origin: "*", 
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  credentials: true,
  allowedHeaders: "Content-Type, Authorization",
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/images', express.static(path.join(__dirname, 'public/images')));

app.use("/api/auth", userRoutes);
app.use('/api/admin/users', adminUserRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/khalti', khaltiRoutes);
app.use('/api/notifications', notificationRoutes);
app.use("/api/chat" , chatRoutes) ;

app.get("/", (req, res) => {
    res.status(200).send("Welcome to the hamrogrocery-backend API!");
});

app.use(errorHandler);

const PORT = process.env.PORT || 8081;

app.listen(PORT,  () => {
    console.log(`Server running and listening on all interfaces at port ${PORT}`);
});