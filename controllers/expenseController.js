import mongoose from "mongoose";
import Expense from "../models/Expense.js";
import Company from "../models/Company.js";
import User from "../models/User.js";
//import ApprovalRule from "../models/ApprovalRule.js";
import axios from "axios";

export const getExpenses = async (req, res) => {
  try {
    const expenses = await Expense.find({ company: req.user.company }).populate(
      "employee category approvalSequence",
    );
    res.status(200).json(expenses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createExpense = async (req, res) => {
  try {
    const {
      category,
      description,
      amountOriginal,
      currencyOriginal,
      receiptUrl,
      dateIncurred,
    } = req.body;

    // Get company's base currency
    const company = await Company.findById(req.user.company);
    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    const baseCurrency = company.baseCurrency;

    // Convert currency if needed
    let amountConverted = amountOriginal;
    if (currencyOriginal !== baseCurrency) {
      try {
        const response = await axios.get(
          `https://api.exchangerate-api.com/v4/latest/${currencyOriginal}`,
        );
        const rate = response.data.rates[baseCurrency];
        amountConverted = amountOriginal * rate;
      } catch (conversionError) {
        console.error("Currency conversion error:", conversionError.message);
        // Fallback to original amount if conversion fails
        amountConverted = amountOriginal;
      }
    }
    if (category !== "other" && !mongoose.Types.ObjectId.isValid(category)) {
      return res.status(400).json({ message: "Invalid category" });
    }
    const expense = new Expense({
      employee: req.user.id,
      company: req.user.company,
      category,
      description,
      amountOriginal,
      currencyOriginal,
      amountConverted,
      receiptUrl,
      dateIncurred,
      status: "draft",
      currentApprovalStep: 0,
    });

    await expense.save();
    res.status(201).json(expense);
  } catch (error) {
    console.error("Create Expense Error:", error.message);
    res.status(500).json({ message: error.message });
  }
};

export const getEmployeeExpenses = async (req, res) => {
  try {
    const expenses = await Expense.find({ employee: req.user.id }).populate(
      "employee category approvalSequence",
    );
    res.status(200).json(expenses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getManagerExpenses = async (req, res) => {
  try {
    console.log("getManagerExpenses: user", req.user?.id, req.user?.role);
    const statusFilter = req.query.status; // optional: pending, approved, rejected, all

    // Managers can filter by pending, approved, rejected, all
    if (
      statusFilter &&
      !["pending", "approved", "rejected", "all"].includes(statusFilter)
    ) {
      return res
        .status(400)
        .json({ message: "Invalid filter for manager role" });
    }

    // For all: return all expenses in company (excluding draft)
    if (!statusFilter || statusFilter === "all") {
      const expenses = await Expense.find({
        company: req.user.company,
        status: { $ne: "draft" },
      })
        .sort({ createdAt: -1 })
        .populate({ path: "employee", populate: { path: "manager" } })
        .populate("category")
        .populate("approvalSequence");

      console.log("getManagerExpenses: returning all count=", expenses.length);
      return res.status(200).json(expenses);
    }

    // For specific status: return all expenses in company with that status
    const expenses = await Expense.find({
      company: req.user.company,
      status: statusFilter,
    })
      .sort({ createdAt: -1 })
      .populate({ path: "employee", populate: { path: "manager" } })
      .populate("category")
      .populate("approvalSequence");

    console.log(
      "getManagerExpenses: returning",
      statusFilter,
      "count=",
      expenses.length,
    );
    return res.status(200).json(expenses);
  } catch (error) {
    console.error("getManagerExpenses Error:", error.message);
    res.status(500).json({ message: error.message });
  }
};

export const getAdminExpenses = async (req, res) => {
  try {
    // Only admins should access this endpoint
    if (req.user.role !== "admin")
      return res.status(403).json({ message: "Access denied" });

    const statusFilter = req.query.status; // optional: pending, approved, payment_proceed, declined, all

    // Admins can filter by approved, payment_proceed, declined, all
    if (
      statusFilter &&
      !["approved", "payment_proceed", "declined", "all"].includes(statusFilter)
    ) {
      return res.status(400).json({ message: "Invalid filter for admin role" });
    }

    // For all: return approved, payment_proceed, declined expenses in company
    if (!statusFilter || statusFilter === "all") {
      const expenses = await Expense.find({
        company: req.user.company,
        status: { $in: ["approved", "payment_proceed", "declined"] },
      })
        .sort({ createdAt: -1 })
        .populate({ path: "employee", populate: { path: "manager" } })
        .populate("category")
        .populate("approvalSequence");

      return res.status(200).json(expenses);
    }

    // For specific status: return all expenses in company with that status
    const expenses = await Expense.find({
      company: req.user.company,
      status: statusFilter,
    })
      .sort({ createdAt: -1 })
      .populate({ path: "employee", populate: { path: "manager" } })
      .populate("category")
      .populate("approvalSequence");

    return res.status(200).json(expenses);
  } catch (error) {
    console.error("getAdminExpenses Error:", error.message);
    res.status(500).json({ message: error.message });
  }
};

export const updateExpense = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);

    if (!expense) return res.status(404).json({ message: "Expense not found" });

    // Only allow editing draft expenses
    if (expense.status !== "draft") {
      return res
        .status(400)
        .json({ message: "Only draft expenses can be edited" });
    }

    // Only employee who created the expense can edit it
    if (expense.employee.toString() !== req.user.id) {
      return res
        .status(403)
        .json({ message: "You can only edit your own expenses" });
    }

    const {
      category,
      description,
      amountOriginal,
      currencyOriginal,
      dateIncurred,
      paidBy,
    } = req.body;

    // Get company's base currency for conversion
    const company = await Company.findById(req.user.company);
    const baseCurrency = company.baseCurrency;

    // Convert currency if needed
    let amountConverted = amountOriginal;
    if (currencyOriginal !== baseCurrency) {
      try {
        const response = await axios.get(
          `https://api.exchangerate-api.com/v4/latest/${currencyOriginal}`,
        );
        const rate = response.data.rates[baseCurrency];
        amountConverted = amountOriginal * rate;
      } catch (conversionError) {
        console.error("Currency conversion error:", conversionError.message);
        amountConverted = amountOriginal;
      }
    }

    if (category !== "other" && !mongoose.Types.ObjectId.isValid(category)) {
      return res.status(400).json({ message: "Invalid category" });
    }

    // Update the expense
    expense.category = category;
    expense.description = description;
    expense.amountOriginal = amountOriginal;
    expense.currencyOriginal = currencyOriginal;
    expense.amountConverted = amountConverted;
    expense.dateIncurred = dateIncurred;
    expense.paidBy = paidBy;

    await expense.save();

    const updatedExpense = await Expense.findById(expense._id).populate(
      "employee category approvalSequence",
    );

    res.status(200).json(updatedExpense);
  } catch (error) {
    console.error("Update Expense Error:", error.message);
    res.status(500).json({ message: error.message });
  }
};

export const deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);

    if (!expense) return res.status(404).json({ message: "Expense not found" });

    // Only allow deleting draft expenses
    if (expense.status !== "draft") {
      return res
        .status(400)
        .json({ message: "Only draft expenses can be deleted" });
    }

    // Only employee who created the expense can delete it
    if (expense.employee.toString() !== req.user.id) {
      return res
        .status(403)
        .json({ message: "You can only delete your own expenses" });
    }

    await Expense.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Expense deleted successfully" });
  } catch (error) {
    console.error("Delete Expense Error:", error.message);
    res.status(500).json({ message: error.message });
  }
};

export const updateExpenseStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const expense = await Expense.findById(req.params.id)
      .populate("category employee")
      .populate("approvalSequence");

    if (!expense) return res.status(404).json({ message: "Expense not found" });

    const userId = req.user.id;

    // Submit expense (employee action): build approval sequence then set to pending
    if (status === "pending") {
      if (expense.status !== "draft")
        return res
          .status(400)
          .json({ message: "Only draft expenses can be submitted" });

      // Simplified sequence: employee's manager then company admin
      const employee = await User.findById(expense.employee).populate(
        "manager",
      );
      const companyAdmin = await User.findOne({
        company: expense.company,
        role: "admin",
      });

      let seq = [];
      if (employee?.manager) seq.push(employee.manager._id);
      if (companyAdmin) seq.push(companyAdmin._id);

      // remove duplicates and falsy values
      seq = [...new Set(seq.filter((s) => !!s))];

      // Log sequence for debugging
      console.log("Expense submit: seq=", seq, "expenseId=", expense._id);

      if (seq.length === 0) {
        // No approvers available -> auto-approve
        expense.status = "approved";
        expense.approvalSequence = [];
        expense.currentApprovalStep = 0;
      } else {
        expense.approvalSequence = seq;
        expense.status = "pending";
        expense.currentApprovalStep = 0;
      }

      await expense.save();
      const reloaded = await Expense.findById(expense._id).populate(
        "employee category approvalSequence",
      );
      return res.status(200).json(reloaded);
    }

    // Approve or reject (approver action) including admin payment actions
    if (
      status === "approved" ||
      status === "rejected" ||
      status === "payment_proceed" ||
      status === "declined"
    ) {
      const seq = expense.approvalSequence || [];
      const idx =
        typeof expense.currentApprovalStep === "number"
          ? expense.currentApprovalStep
          : 0;
      const currentApprover = seq[idx];

      console.log(
        "updateExpenseStatus ACTION:",
        status,
        "expenseId:",
        expense._id,
        "userId:",
        userId,
      );
      console.log(
        "Before approve: seq=",
        seq,
        "idx=",
        idx,
        "currentApprover=",
        currentApprover,
        "expense.status=",
        expense.status,
      );

      // Determine authorization: allow if current approver matches user,
      // or user is employee's manager (when at first step or no sequence exists)
      let allowed = false;

      // If currentApprover matches request user, allow
      if (currentApprover && currentApprover.toString() === userId.toString()) {
        allowed = true;
        console.log("updateExpenseStatus: user is current approver", userId);
      }

      if (!allowed) {
        // Check if user is employee manager
        const emp = await User.findById(expense.employee).populate("manager");
        const empManagerId = emp?.manager?._id
          ? emp.manager._id.toString()
          : emp?.manager
            ? emp.manager.toString()
            : null;

        if (empManagerId === userId && (seq.length === 0 || idx === 0)) {
          allowed = true;
          console.log(
            "updateExpenseStatus: user is employee manager and allowed",
            userId,
          );

          // If there was no sequence, ensure manager is first approver for consistent progression
          if (!seq || seq.length === 0) {
            if (emp.manager && emp.manager._id) {
              expense.approvalSequence = [emp.manager._id];
            } else if (emp.manager) {
              expense.approvalSequence = [emp.manager];
            }
            expense.currentApprovalStep = 0;
          }
        }
      }

      // For payment_proceed or declined, allow any admin
      if (
        !allowed &&
        (status === "payment_proceed" || status === "declined") &&
        req.user.role === "admin"
      ) {
        allowed = true;
        console.log(
          "updateExpenseStatus: admin proceeding payment or declining",
          userId,
        );
      }

      if (!allowed) {
        return res
          .status(403)
          .json({ message: "You are not the current approver" });
      }

      // Handle declines (admin-specific decline) mapping to 'declined'
      if (status === "rejected" || status === "declined") {
        console.log(
          "Expense declined/rejected by user:",
          userId,
          "expenseId:",
          expense._id,
        );
        expense.status = status === "declined" ? "declined" : "rejected";
        await expense.save();
        const reloaded = await Expense.findById(expense._id).populate(
          "employee category approvalSequence",
        );
        return res.status(200).json(reloaded);
      }

      // status === 'approved' or 'payment_proceed'
      // Re-evaluate sequence in case we changed it
      const refreshedSeq = expense.approvalSequence || [];
      const refreshedIdx =
        typeof expense.currentApprovalStep === "number"
          ? expense.currentApprovalStep
          : 0;

      // If this action is 'payment_proceed', treat as admin finalization
      if (status === "payment_proceed") {
        expense.status = "payment_proceed";
        expense.currentApprovalStep = refreshedIdx + 1;
      } else if (status === "approved") {
        // If current approver is the last in sequence, final approval
        if (refreshedIdx >= refreshedSeq.length - 1) {
          expense.status = "approved";
          expense.currentApprovalStep = refreshedIdx + 1; // mark completed
        } else {
          // Move to next approver and keep pending
          expense.currentApprovalStep = refreshedIdx + 1;
          expense.status = "approved";
        }
      }

      console.log(
        "After approve-like action: status=",
        expense.status,
        "currentApprovalStep=",
        expense.currentApprovalStep,
        "expenseId=",
        expense._id,
      );

      await expense.save();
      const reloaded = await Expense.findById(expense._id).populate(
        "employee category approvalSequence",
      );
      return res.status(200).json(reloaded);
    }

    return res.status(400).json({ message: "Invalid status action" });
  } catch (error) {
    console.error("Update Expense Error:", error.message);
    res.status(500).json({ message: error.message });
  }
};

import fetch from "node-fetch";
import {
  extractReceiptText,
  receiptResponseSchema,
  formatGroqResponse,
} from "../utils/extract.js";
const parseDDMMYYYY = (dateStr) => {
  if (!dateStr) return null;

  const parts = dateStr.split("/");
  if (parts.length !== 3) return null;

  const [dd, mm, yyyy] = parts;
  return new Date(`${yyyy}-${mm}-${dd}`);
};

export const uploadReceipt = async (req, res) => {
  try {
    const receiptText = await extractReceiptText(req.file);
    console.log("Receipt Text:", receiptText);

    const prompt = `
You will be given RAW TEXT extracted from a receipt.

Your task is to FORMAT and DERIVE the information into the JSON structure below.

Rules:
- Return ONLY valid JSON (no markdown, no explanation).
- If a field is missing or unclear, use null.
- For "description":
  - If an explicit description is present, use it.
  - Otherwise, GENERATE a short description (5–12 words)
    using merchant name and main purchased item or purpose.

JSON FORMAT:
${JSON.stringify(receiptResponseSchema, null, 2)}

RAW RECEIPT TEXT:
${receiptText}
`;

    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [{ role: "user", content: prompt }],
          temperature: 0,
          max_tokens: 2048,
        }),
      },
    );

    if (!response.ok) {
      throw new Error(`Groq API failed: ${response.status}`);
    }

    const data = await response.json();

    const formattedData = formatGroqResponse(data, receiptResponseSchema);

    console.log("Formatted Receipt Data:", formattedData);

    const parsedDate = formattedData.dateIncurred
      ? parseDDMMYYYY(formattedData.dateIncurred)
      : new Date();

    if (!parsedDate || isNaN(parsedDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid date format in receipt",
      });
    }

    const expense = new Expense({
      employee: req.user.id,
      company: req.user.company,

      category: formattedData.category || "Other",
      description: formattedData.description || "",

      amountOriginal: Number(formattedData.amountOriginal),
      currencyOriginal: formattedData.currencyOriginal,

      amountConverted: Number(
        formattedData.amountConverted ?? formattedData.amountOriginal,
      ),

      receiptUrl: null,
      dateIncurred: parsedDate,

      status: "draft",
      currentApprovalStep: 0,
    });

    await expense.save();

    res.status(200).json({
      success: true,
      provider: "groq",
      data: formattedData,
    });
  } catch (error) {
    console.error("Receipt Upload Error:", error.message);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to process receipt",
    });
  }
};
