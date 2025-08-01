// import dotenv from "dotenv";
// import express from "express";
// import cors from "cors";
// import path from 'path';
// import { fileURLToPath } from 'url';
// import { connectDB } from "./config/db.js";
// import userRoutes from "./routes/userRoutes.js";
// import adminUserRoutes from './routes/admin/adminUserRoutes.js';
// import categoryRoutes from './routes/categoryRoutes.js';
// import productRoutes from './routes/productRoutes.js';
// import orderRoutes from './routes/orderRoutes.js';
// import dashboardRoutes from './routes/dashboardRoutes.js';
// import paymentRoutes from './routes/paymentRoutes.js';
// import errorHandler from './middleware/errorHandler.js';

// dotenv.config();
// const app = express();
// connectDB();

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// const corsOptions = {
//   origin: "*", 
//   methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
//   credentials: true,
//   allowedHeaders: "Content-Type, Authorization",
// };

// app.use(cors(corsOptions));
// app.use(express.json());
// app.use(express.static(path.join(__dirname, 'public')));

// app.use("/api/auth", userRoutes);
// app.use('/api/admin/users', adminUserRoutes);
// app.use('/api/categories', categoryRoutes);
// app.use('/api/products', productRoutes);
// app.use('/api/orders', orderRoutes);
// app.use('/api/dashboard', dashboardRoutes);
// app.use('/api/payment', paymentRoutes);

// app.get("/", (req, res) => {
//     res.status(200).send("Welcome to the hamrogrocery-backend API!");
// });

// app.use(errorHandler);

// // Corrected Code
// const PORT = process.env.PORT || 8081;

// app.listen(PORT,  () => {
//     console.log(`Server running and listening on all interfaces at port ${PORT}`);
// });


import dotenv from "dotenv";
dotenv.config(); // Must be at the very top



// --- DEBUGGING LOGS: Check your terminal for this output on server start ---
console.log("--- Loading Environment Variables on Startup ---");
console.log("PORT:", process.env.PORT);
console.log("CLIENT_URL:", process.env.CLIENT_URL);
console.log("KHALTI_SECRET_KEY:", process.env.KHALTI_SECRET_KEY ? "Loaded" : "!!! NOT LOADED !!!");
console.log("KHALTI_PUBLIC_KEY:", process.env.KHALTI_PUBLIC_KEY ? "Loaded" : "!!! NOT LOADED !!!");
console.log("KHALTI_URL:", process.env.KHALTI_URL);
console.log("----------------------------------------------");


import express from "express";
import cors from "cors";
import path from 'path';
import { fileURLToPath } from 'url';
import { connectDB } from "./config/db.js";
import userRoutes from './Routes/userRoutes.js'
import adminUserRoutes from './Routes/admin/adminUserRoutes.js';
import categoryRoutes from './Routes/categoryRoutes.js';
import productRoutes from './Routes/productRoutes.js';
import orderRoutes from './Routes/orderRoutes.js';
import dashboardRoutes from './Routes/dashboardRoutes.js';
import khaltiRoutes from "./Routes/khaltiRoutes.js"
import paymentRoutes from './Routes/paymentRoutes.js';

import errorHandler from './middleware/errorHandler.js';

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

app.get("/", (req, res) => {
    res.status(200).send("Welcome to the hamrogrocery-backend API!");
});

app.use(errorHandler);

const PORT = process.env.PORT || 8081;

app.listen(PORT,  () => {
    console.log(`Server running and listening on all interfaces at port ${PORT}`);
});