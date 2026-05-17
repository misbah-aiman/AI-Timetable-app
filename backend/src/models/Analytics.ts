import mongoose, { Document, Schema } from 'mongoose';

export interface IDailyStats {
  date: string;           // "YYYY-MM-DD"
  studyMinutes: number;
  sleepMinutes: number;
  screenMinutes: number;
  exerciseMinutes: number;
  hobbyMinutes: number;
  tasksCompleted: number;
}

export interface IWeeklyAnalytics extends Document {
  userId: mongoose.Types.ObjectId;
  weekStartDate: string;  // "YYYY-MM-DD" Monday
  weekEndDate: string;    // "YYYY-MM-DD" Sunday
  dailyStats: IDailyStats[];
  totalStudyMinutes: number;
  totalSleepMinutes: number;
  totalScreenMinutes: number;
  avgProductivityScore: number;  // 0-100
  goals: {
    studyGoalMet: boolean;
    sleepGoalMet: boolean;
    screenLimitMet: boolean;
  };
  generatedAt: Date;
}

const DailyStatsSchema = new Schema<IDailyStats>({
  date: { type: String, required: true },
  studyMinutes: { type: Number, default: 0 },
  sleepMinutes: { type: Number, default: 0 },
  screenMinutes: { type: Number, default: 0 },
  exerciseMinutes: { type: Number, default: 0 },
  hobbyMinutes: { type: Number, default: 0 },
  tasksCompleted: { type: Number, default: 0 },
});

const WeeklyAnalyticsSchema = new Schema<IWeeklyAnalytics>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    weekStartDate: { type: String, required: true },
    weekEndDate: { type: String, required: true },
    dailyStats: [DailyStatsSchema],
    totalStudyMinutes: { type: Number, default: 0 },
    totalSleepMinutes: { type: Number, default: 0 },
    totalScreenMinutes: { type: Number, default: 0 },
    avgProductivityScore: { type: Number, default: 0 },
    goals: {
      studyGoalMet: { type: Boolean, default: false },
      sleepGoalMet: { type: Boolean, default: false },
      screenLimitMet: { type: Boolean, default: false },
    },
    generatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.model<IWeeklyAnalytics>('WeeklyAnalytics', WeeklyAnalyticsSchema);
