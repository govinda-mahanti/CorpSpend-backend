/* import mongoose from "mongoose";
const ApprovalActionSchema = new mongoose.Schema({
  expense: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Expense",
    required: true,
  },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  stepOrder: { type: Number },
  status: {
    type: String,
    enum: ["approved", "rejected", "pending"],
    required: true,
  },
  comment: { type: String },
  actionedAt: { type: Date, default: Date.now },
});

export default mongoose.model("ApprovalAction", ApprovalActionSchema);
 */
