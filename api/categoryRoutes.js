import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../controllers/categoryController.js";

const router = express.Router();

router.get("/getcategory", authMiddleware, getCategories);
router.post("/create", authMiddleware, createCategory);
router.put("/update/:id", authMiddleware, updateCategory);
router.delete("/delete/:id", authMiddleware, deleteCategory);

export default router;
