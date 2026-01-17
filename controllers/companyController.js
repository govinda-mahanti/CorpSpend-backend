import Company from "../models/Company.js";

export const getCompany = async (req, res) => {
  try {
    const company = await Company.findById(req.user.company);
    if (!company) return res.status(404).json({ message: "Company not found" });
    res.status(200).json(company);
  } catch (error) {
    console.error("Get Company Error:", error.message);

    res.status(500).json({ message: error.message });
  }
};

export const updateCompany = async (req, res) => {
  try {
    const { name, country, baseCurrency } = req.body;
    const company = await Company.findByIdAndUpdate(
      req.user.company,
      { name, country, baseCurrency },
      { new: true }
    );
    if (!company) return res.status(404).json({ message: "Company not found" });
    res.status(200).json(company);
  } catch (error) {
    console.log("Update Company Error:", error.message);
    res.status(500).json({ message: error.message });
  }
};
