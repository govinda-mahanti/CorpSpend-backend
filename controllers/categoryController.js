import Category from "../models/Category.js";

export const getCategories = async (req, res) => {
  try {
    const categories = await Category.find({ company: req.user.company });
    res.status(200).json(categories);
  } catch (error) {
    console.error("Get Categories Error:", error.message);
    res.status(500).json({ message: error.message });
  }
};

export const createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;
    const category = new Category({
      name,
      description,
      company: req.user.company,
    });
    await category.save();
    res.status(201).json(category);
    console.log("Category Created:", category);
  } catch (error) {
    console.error("Create Category Error:", error.message);
    res.status(500).json({ message: error.message });
  }
};

export const updateCategory = async (req, res) => {
  try {
    const { name, description, active } = req.body;
    const category = await Category.findByIdAndUpdate(
      req.params.id,
      { name, description, active },
      { new: true },
    );
    if (!category)
      return res.status(404).json({ message: "Category not found" });
    res.status(200).json(category);
  } catch (error) {
    console.error("Update Category Error:", error.message);
    res.status(500).json({ message: error.message });
  }
};

export const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category)
      return res.status(404).json({ message: "Category not found" });
    res.status(200).json({ message: "Category deleted successfully" });
  } catch (error) {
    console.error("Delete Category Error:", error.message);
    res.status(500).json({ message: error.message });
  }
};
