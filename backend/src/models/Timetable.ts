import mongoose, { Document, Schema } from 'mongoose';

export interface ITimeSlot {
  startTime: string;   // "08:00"
  endTime: string;     // "09:00"
  activity: string;    // "Study: Mathematics"
  category: 'study' | 'sleep' | 'hobby' | 'class' | 'break' | 'exercise' | 'meal' | 'screen' | 'other';
  color?: string;
}

export interface IDaySchedule {
  day: string;         // "Monday"
  slots: ITimeSlot[];
}

export interface ITimetable extends Document {
  userId: mongoose.Types.ObjectId;
  weekStartDate: Date;
  schedule: IDaySchedule[];
  completedSlots: string[];
  generatedAt: Date;
  isActive: boolean;
}

const TimeSlotSchema = new Schema<ITimeSlot>({
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  activity: { type: String, required: true },
  category: {
    type: String,
    enum: ['study', 'sleep', 'hobby', 'class', 'break', 'exercise', 'meal', 'screen', 'other'],
    required: true,
  },
  color: { type: String },
});

const DayScheduleSchema = new Schema<IDaySchedule>({
  day: { type: String, required: true },
  slots: [TimeSlotSchema],
});

const TimetableSchema = new Schema<ITimetable>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    weekStartDate: { type: Date, required: true },
    schedule: [DayScheduleSchema],
    generatedAt: { type: Date, default: Date.now },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model<ITimetable>('Timetable', TimetableSchema);
