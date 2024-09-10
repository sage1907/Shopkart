import asyncHandler from "express-async-handler";
import dotenv from "dotenv";
dotenv.config();

import Order from "../models/Order.js";
import Product from "../models/Product.js";
import User from "../models/User.js";
import Coupon from "../models/Coupon.js";

//@desc create orders
//@route POST /api/v1/orders
//@access private
export const createOrderCtrl = asyncHandler(async (req, res) => {
  // Get the payload (orderItems, shippingAddress, totalPrice)
  const { orderItems, shippingAddress, totalPrice } = req.body;
  console.log(req.body);
  
  // Find the user
  const user = await User.findById(req.userAuthId);

  // Check if user has a shipping address
  if (!user?.hasShippingAddress) {
    throw new Error("Please provide a shipping address");
  }

  // Check if order is not empty
  if (orderItems?.length <= 0) {
    throw new Error("No Order Items");
  }

  // Create the order and save it into the DB
  const order = await Order.create({
    user: user?._id,
    orderItems,
    shippingAddress,
    totalPrice,
  });

  // Update product quantities
  const products = await Product.find({ _id: { $in: orderItems.map(item => item._id) } });

  orderItems?.forEach(async (orderItem) => {
    const product = products?.find(product => product?._id?.toString() === orderItem?._id?.toString());
    if (product) {
      product.totalSold += orderItem.qty;
      await product.save();
    }
  });

  // Push the order into the user's orders list
  user.orders.push(order?._id);
  await user.save();

  res.status(201).json({ success: true, message: "Order created", order });
});

//@desc get all orders
//@route GET /api/v1/orders
//@access private
export const getAllordersCtrl = asyncHandler(async (req, res) => {
  // Find all orders
  const orders = await Order.find().populate("user");
  res.json({
    success: true,
    message: "All orders retrieved",
    orders,
  });
});

//@desc get single order
//@route GET /api/v1/orders/:id
//@access private/admin
export const getSingleOrderCtrl = asyncHandler(async (req, res) => {
  // Get the order ID from params
  const { id } = req.params;

  // Find the order
  const order = await Order.findById(id);

  if (!order) {
    return res.status(404).json({ success: false, message: "Order not found" });
  }

  res.status(200).json({
    success: true,
    message: "Single order retrieved",
    order,
  });
});

//@desc update order to delivered
//@route PUT /api/v1/orders/update/:id
//@access private/admin
export const updateOrderCtrl = asyncHandler(async (req, res) => {
  // Get the order ID from params
  const { id } = req.params;

  // Update the order status
  const updatedOrder = await Order.findByIdAndUpdate(
    id,
    {
      status: req.body.status,
    },
    {
      new: true,
    }
  );

  if (!updatedOrder) {
    return res.status(404).json({ success: false, message: "Order not found" });
  }

  res.status(200).json({
    success: true,
    message: "Order updated",
    updatedOrder,
  });
});

//@desc get sales sum of orders
//@route GET /api/v1/orders/sales/sum
//@access private/admin
export const getOrderStatsCtrl = asyncHandler(async (req, res) => {
  // Get the overall order stats
  const orders = await Order.aggregate([
    {
      $group: {
        _id: null,
        minimumSale: { $min: "$totalPrice" },
        totalSales: { $sum: "$totalPrice" },
        maxSale: { $max: "$totalPrice" },
        avgSale: { $avg: "$totalPrice" },
      },
    },
  ]);

  // Get the sales for today
  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  const saleToday = await Order.aggregate([
    {
      $match: {
        createdAt: { $gte: startOfDay },
      },
    },
    {
      $group: {
        _id: null,
        totalSales: { $sum: "$totalPrice" },
      },
    },
  ]);

  res.status(200).json({
    success: true,
    message: "Order statistics retrieved",
    orders,
    saleToday,
  });
});
