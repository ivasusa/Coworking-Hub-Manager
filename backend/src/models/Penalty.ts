import mongoose, { Schema } from 'mongoose';

const PenaltySchema = new Schema({
  memberId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  spaceId: { type: Schema.Types.ObjectId, ref: 'Space', required: true },
  count: { type: Number, default: 0, min: 0 },
});

PenaltySchema.index({ memberId: 1, spaceId: 1 }, { unique: true });

export default mongoose.model('Penalty', PenaltySchema);
