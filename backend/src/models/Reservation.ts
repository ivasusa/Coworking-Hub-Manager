import mongoose, { Schema } from 'mongoose';

const ReservationSchema = new Schema(
  {
    memberId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    spaceId: { type: Schema.Types.ObjectId, ref: 'Space', required: true },
    elementId: { type: Schema.Types.ObjectId, ref: 'SpaceElement', required: true },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    status: {
      type: String,
      enum: ['active', 'cancelled', 'confirmed', 'no_show'],
      default: 'active',
    },
  },
  { timestamps: true }
);

export default mongoose.model('Reservation', ReservationSchema);
