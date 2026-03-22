import mongoose, { Schema } from 'mongoose';

const CompanySchema = new Schema({
  name: { type: String, required: true },
  address: { type: String, required: true },
  registrationNumber: { type: String, required: true, unique: true, match: /^\d{8}$/ },
  taxId: { type: String, required: true, unique: true, match: /^[1-9]\d{8}$/ },
  managerCount: { type: Number, default: 0 },
});

export default mongoose.model('Company', CompanySchema);
