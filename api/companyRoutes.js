import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { getCompany, updateCompany } from "../controllers/companyController.js";

const router = express.Router();

router.get("/getcompany", authMiddleware, getCompany);
router.put("/update/:id", authMiddleware, updateCompany);

export default router;
