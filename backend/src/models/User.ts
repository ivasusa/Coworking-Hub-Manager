import mongoose, { Schema } from 'mongoose';

const UserSchema = new Schema(
  {
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    profileImage: { type: String, default: 'uploads/profiles/default.png' },
    role: { type: String, enum: ['member', 'manager', 'admin'], required: true },
    status: { type: String, enum: ['pending', 'active', 'rejected', 'blocked'], default: 'pending' },
    companyId: { type: Schema.Types.ObjectId, ref: 'Company' },
  },
  { timestamps: true }
);

export default mongoose.model('User', UserSchema);
