import "dotenv/config";
import express from "express";
import cors from "cors";
import prisma from "./prismaClient";
import authRoutes from "./routes/auth";
import { authMiddleware, AuthRequest } from "./middleware/authMiddleware";
import { requireRole } from "./middleware/roleMiddleware";

import customerRoutes from "./routes/customers";
import productRoutes from "./routes/products";

import challanRoutes from "./routes/challans";  

// Create the Express application
const app = express();

// Allow our frontend to call this API
app.use(cors());

// Allow Express to understand JSON
app.use(express.json());

app.use("/customers", customerRoutes);

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    message: "Server is running"
  });
});


app.use("/challans", challanRoutes);
// Database test
app.get("/db-test", async (req, res) => {
  try {
    const userCount = await prisma.user.count();

    res.json({
      status: "ok",
      userCount
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      status: "error",
      message: "Database connection failed"
    });
  }
});

app.use("/auth", authRoutes);

app.get("/protected", authMiddleware, (req, res) => {
  const authReq = req as AuthRequest;

  res.json({
    message: "You are authenticated!",
    user: authReq.user,
  });
});


app.use("/products", productRoutes);
app.get(
  "/admin-only",
  authMiddleware,
  requireRole("ADMIN"),
  (req, res) => {
    res.json({
      message: "Welcome Admin! You have access to this route.",
    });
  }
);
// Port
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});