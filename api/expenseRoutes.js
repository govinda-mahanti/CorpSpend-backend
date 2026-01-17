import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { singleUpload } from "../middleware/multer.js";

import {
  getExpenses,
  getEmployeeExpenses,
  getManagerExpenses,
  getAdminExpenses,
  createExpense,
  updateExpense,
  updateExpenseStatus,
  uploadReceipt,
  deleteExpense,
} from "../controllers/expenseController.js";

const router = express.Router();

router.get("/getallexpense", authMiddleware, getExpenses);
router.get("/employee", authMiddleware, getEmployeeExpenses);
router.get("/manager", authMiddleware, getManagerExpenses);
router.get("/admin", authMiddleware, getAdminExpenses);
router.post("/create", authMiddleware, createExpense);
router.put("/:id", authMiddleware, updateExpense);
router.patch("/:id/status", authMiddleware, updateExpenseStatus);
router.post("/upload-receipt", authMiddleware, singleUpload, uploadReceipt);
router.delete("/:id", authMiddleware, deleteExpense);

export default router;
