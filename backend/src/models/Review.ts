import mongoose, { Schema } from 'mongoose';

const ReviewSchema = new Schema(
  {
    memberId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    spaceId: { type: Schema.Types.ObjectId, ref: 'Space', required: true },
    likeCount: { type: Number, default: 0, min: 0 },
    dislikeCount: { type: Number, default: 0, min: 0 },
    comments: [
      {
        text: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

ReviewSchema.index({ memberId: 1, spaceId: 1 }, { unique: true });

export default mongoose.model('Review', ReviewSchema);
