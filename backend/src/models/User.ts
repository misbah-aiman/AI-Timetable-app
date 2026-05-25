import mongoose, { Document, Schema } from 'mongoose';

export interface IOnboarding {
  sleepTime: string;
  wakeTime: string;
  sleepHours: number;
  studyGoalHours: number;
  subjects: string[];
  hobbies: string[];
  screenTimeLimitHours: number;
  classes: {
    name: string;
    day: string;
    startTime: string;
    endTime: string;
  }[];
  // Lifestyle additions
  chronotype: string;      // 'morning' | 'afternoon' | 'evening'
  studyStyle: string;      // 'pomodoro' | 'medium' | 'long'
  exerciseEnabled: boolean;
  exerciseTime: string;    // 'morning' | 'evening'
  exerciseDuration: number; // minutes
  workEnabled: boolean;
  workDays: string[];
  workStartTime: string;
  workEndTime: string;
  completed: boolean;
}

export interface IOtp {
  code: string | null;
  expiresAt: Date | null;
  lastSentAt: Date | null;
}

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  otp: IOtp;
  onboarding: IOnboarding;
  createdAt: Date;
  updatedAt: Date;
}

const ClassSchema = new Schema({
  name: { type: String, required: true },
  day: { type: String, required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
});

const OnboardingSchema = new Schema({
  sleepTime: { type: String, default: '22:00' },
  wakeTime: { type: String, default: '06:00' },
  sleepHours: { type: Number, default: 8 },
  studyGoalHours: { type: Number, default: 4 },
  subjects: [{ type: String }],
  hobbies: [{ type: String }],
  screenTimeLimitHours: { type: Number, default: 2 },
  classes: [ClassSchema],
  completed: { type: Boolean, default: false },
});

const OtpSchema = new Schema({
  code: { type: String, default: null },
  expiresAt: { type: Date, default: null },
  lastSentAt: { type: Date, default: null },
});

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, minlength: 6 },
    otp: { type: OtpSchema, default: () => ({ code: null, expiresAt: null, lastSentAt: null }) },
    onboarding: { type: OnboardingSchema, default: () => ({}) },
  },
  { timestamps: true }
);

export default mongoose.model<IUser>('User', UserSchema);
