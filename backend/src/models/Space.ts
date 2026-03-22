import mongoose, { Schema } from 'mongoose';

const SpaceSchema = new Schema(
  {
    name: { type: String, required: true },
    city: { type: String, required: true },
    address: { type: String, required: true },
    description: { type: String, default: '' },
    companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
    managerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    pricePerHour: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ['pending', 'active', 'inactive'], default: 'pending' },
    mainImage: { type: String, default: '' },
    images: [{ type: String }],
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    maxPenalties: { type: Number, required: true, min: 1 },
    totalLikes: { type: Number, default: 0 },
    totalDislikes: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model('Space', SpaceSchema);
