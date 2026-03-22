import mongoose, { Schema } from 'mongoose';

const SpaceElementSchema = new Schema({
  spaceId: { type: Schema.Types.ObjectId, ref: 'Space', required: true },
  type: { type: String, enum: ['open', 'office', 'conference'], required: true },
  name: { type: String, required: true },
  deskCount: { type: Number },
  equipment: { type: String, maxlength: 300 },
});

export default mongoose.model('SpaceElement', SpaceElementSchema);
