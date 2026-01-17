import express from "express";
import {
  createUser,
  updateUserRole,
  getUser,
  getAllUsers,
  sendPassword,
  removeUser,
} from "../controllers/userController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/createuser", authMiddleware, createUser);
router.put("/updateuser/:id", authMiddleware, updateUserRole);
router.get("/allusers", authMiddleware, getAllUsers);
router.get("/:id", authMiddleware, getUser);
router.post("/sendpassword/:userId", authMiddleware, sendPassword);
router.delete("/removeuser/:id", authMiddleware, removeUser);

export default router;
