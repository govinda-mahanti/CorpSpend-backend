import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import { fileURLToPath } from "url";
import path from "path";
import connectDB from "../db/db.js";
dotenv.config();

import authRoutes from "../routes/authRoutes.js";
import userRoutes from "../routes/userRoutes.js";
import companyRoutes from "../routes/companyRoutes.js";
import expenseRoutes from "../routes/expenseRoutes.js";
import categoryRoutes from "../routes/categoryRoutes.js";
/*  import approvalActionRoutes from "./routes/approvalActionRoutes.js";*/
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(
  cors({
    origin: "*",
  })
);
app.use(express.json());
connectDB();

app.get("/", (req, res) => {
  res.send("Welcome to Expense Manager server");
});

app.use("/auth", authRoutes);
app.use("/company", companyRoutes);
app.use("/users", userRoutes);
app.use("/expenses", expenseRoutes);
app.use("/categories", categoryRoutes);
/*  app.use("/approvalactions", approvalActionRoutes); */

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
