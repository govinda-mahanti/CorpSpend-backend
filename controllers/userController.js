import User from "../models/User.js";
import bcrypt from "bcryptjs";
import { sendPasswordEmail } from "../utils/emailService.js";

export const createUser = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      console.log(res.req.user.role);
      return res.status(403).json({ message: "Access denied" });
    }
    const { name, email, role, manager, password } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: "Email already in use" });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = new User({
      name,
      email,
      role,
      manager,
      passwordHash,
      company: req.user.company,
    });

    await user.save();
    console.log(user);
    res.status(201).json(user);
  } catch (error) {
    console.error("Create User Error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateUserRole = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      console.log(res.req.user.role);
      return res.status(403).json({ message: "Access denied" });
    }
    /*     const { role, manager } = req.body;
     */
    const allowedFields = ["name", "email", "status", "role", "manager"];
    const updates = {};

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    const user = await User.findByIdAndUpdate(
      req.params.id,
      /*       { role, manager },
       */ updates,
      { new: true },
    );
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (error) {
    console.error("Update User Role Error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

export const getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (error) {
    console.error("Get User Error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({ company: req.user.company }).select(
      "-passwordHash",
    );
    res.json(users);
  } catch (error) {
    console.error("Get All Users Error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

export const sendPassword = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }
    const { userId } = req.params;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Generate new password
    const newPassword = Math.random().toString(36).slice(-8);
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Update user password
    user.passwordHash = passwordHash;
    await user.save();

    // Send email
    await sendPasswordEmail(user.email, newPassword);

    res.json({ message: "Password sent successfully" });
  } catch (error) {
    console.error("Send Password Error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

export const removeUser = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ message: "User removed successfully" });
  } catch (error) {
    console.error("Remove User Error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};
