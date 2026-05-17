import mongoose, { Document, Schema } from 'mongoose';

export type SessionType = 'study' | 'sleep' | 'screen' | 'exercise' | 'hobby';

export interface ISession extends Document {
  userId: mongoose.Types.ObjectId;
  type: SessionType;
  label: string;          // e.g. "Study: Math", "Sleep"
  startTime: Date;
  endTime?: Date;
  durationMinutes?: number;
  date: string;           // "YYYY-MM-DD" for easy querying
  isActive: boolean;
}

const SessionSchema = new Schema<ISession>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      enum: ['study', 'sleep', 'screen', 'exercise', 'hobby'],
      required: true,
    },
    label: { type: String, required: true },
    startTime: { type: Date, required: true },
    endTime: { type: Date },
    durationMinutes: { type: Number },
    date: { type: String, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model<ISession>('Session', SessionSchema);
