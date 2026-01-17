/* import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import {
  getApprovalActions,
  createApprovalAction,
  approveExpense,
  rejectExpense,
  getApprovalSequence,
} from "../controllers/approvalActionController.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/:expenseId", getApprovalActions);
router.get("/sequence/:expenseId", getApprovalSequence);
router.post("/createapproval", createApprovalAction);
router.put("/approve/:id", approveExpense);
router.put("/reject/:id", rejectExpense);
export default router;
 */
