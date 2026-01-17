import mongoose from "mongoose";
const ExpenseSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Company",
    required: true,
  },
  category: {
    type: mongoose.Schema.Types.Mixed, // ObjectId or "other"
    required: true,
  },
  description: { type: String },
  amountOriginal: { type: Number, required: true },
  currencyOriginal: { type: String, required: true },
  amountConverted: { type: Number, required: true },
  receiptUrl: { type: String },
  dateIncurred: { type: Date, required: true },
  status: {
    type: String,
    enum: [
      "draft",
      "pending",
      "approved",
      "rejected",
      "payment_proceed",
      "declined",
    ],
    default: "draft",
  },
  currentApprovalStep: { type: Number, default: 0 },
  approvalSequence: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Expense", ExpenseSchema);
