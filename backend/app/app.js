import dotenv from "dotenv";
import cors from "cors";
dotenv.config();
import express from "express";

import dbConnect from "../config/dbConnect.js";
import { globalErrhandler, notFound } from "../middlewares/globalErrHandler.js";
import brandsRouter from "../routes/brands.router.js";
import categoriesRouter from "../routes/categories.router.js";
import colorRouter from "../routes/color.router.js";
import orderRouter from "../routes/orders.router.js";
import productsRouter from "../routes/products.router.js";
import reviewRouter from "../routes/review.router.js";
import userRoutes from "../routes/users.router.js";
import couponsRouter from "../routes/coupons.router.js";


// Connect to the database
dbConnect();

const app = express();

// Enable CORS
app.use(cors());


// Parse incoming JSON and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// Serve static files
app.use(express.static("public"));

app.get("/", (req, res) => {
    res.send("Hello World!");
});

// Define routes
app.use("/api/v1/users/", userRoutes);
app.use("/api/v1/products/", productsRouter);
app.use("/api/v1/categories/", categoriesRouter);
app.use("/api/v1/brands/", brandsRouter);
app.use("/api/v1/colors/", colorRouter);
app.use("/api/v1/reviews/", reviewRouter);
app.use("/api/v1/orders/", orderRouter);
app.use("/api/v1/coupons/", couponsRouter);


// Error handling middlewares
app.use(notFound);
app.use(globalErrhandler);


export default app;