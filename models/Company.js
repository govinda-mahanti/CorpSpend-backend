import mongoose from "mongoose";
const CompanySchema = new mongoose.Schema({
  name: { type: String, required: true },
  country: { type: String, required: true },
  baseCurrency: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Company", CompanySchema);
