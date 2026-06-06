export interface User {
  id: string;
  name: string;
  email: string;
  onboardingCompleted: boolean;
  onboarding?: OnboardingData;
}

export interface OnboardingData {
  sleepTime: string;
  wakeTime: string;
  sleepHours: number;
  studyGoalHours: number;
  subjects: string[];
  hobbies: string[];
  screenTimeLimitHours: number;
  classes: ClassEntry[];
  chronotype?: string;
  studyStyle?: string;
  exerciseEnabled?: boolean;
  exerciseTime?: string;
  exerciseDuration?: number;
  workEnabled?: boolean;
  workDays?: string[];
  workStartTime?: string;
  workEndTime?: string;
  completed: boolean;
}

export interface ClassEntry {
  name: string;
  day: string;
  startTime: string;
  endTime: string;
}

export interface TimeSlot {
  startTime: string;
  endTime: string;
  activity: string;
  category: 'study' | 'sleep' | 'hobby' | 'class' | 'break' | 'exercise' | 'meal' | 'screen' | 'other';
  color?: string;
}

export interface DaySchedule {
  day: string;
  slots: TimeSlot[];
}

export interface Timetable {
  _id: string;
  userId: string;
  weekStartDate: string;
  schedule: DaySchedule[];
  completedSlots: string[];
  generatedAt: string;
}

export interface Session {
  _id: string;
  type: 'study' | 'sleep' | 'screen' | 'exercise' | 'hobby';
  label: string;
  startTime: string;
  endTime?: string;
  durationMinutes?: number;
  date: string;
  isActive: boolean;
}

export interface DailyStats {
  date: string;
  studyMinutes: number;
  sleepMinutes: number;
  screenMinutes: number;
  exerciseMinutes: number;
  hobbyMinutes: number;
  tasksCompleted: number;
}

export interface WeeklyAnalytics {
  weekStartDate: string;
  weekEndDate: string;
  dailyStats: DailyStats[];
  totalStudyMinutes: number;
  totalSleepMinutes: number;
  totalScreenMinutes: number;
  avgProductivityScore: number;
  goals: {
    studyGoalMet: boolean;
    sleepGoalMet: boolean;
    screenLimitMet: boolean;
  };
}

export interface Task {
  _id: string;
  title: string;
  subject: string;
  dueDate: string;
  estimatedHours: number;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'done';
  createdAt: string;
}

export interface DashboardStats {
  todayStudyMinutes: number;
  todaySleepMinutes: number;
  todayScreenMinutes: number;
  sessionsToday: number;
}
