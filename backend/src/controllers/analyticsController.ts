import { Response } from 'express';
import Session from '../models/Session';
import WeeklyAnalytics from '../models/Analytics';
import User from '../models/User';
import { AuthRequest } from '../middleware/auth';

// Get ISO date string "YYYY-MM-DD"
const toDateStr = (d: Date): string => d.toISOString().split('T')[0];

// Get the Monday of a given date
const getWeekStart = (d: Date): Date => {
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d);
  monday.setDate(diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
};

// Generate the 7 dates of a week starting from Monday
const getWeekDates = (monday: Date): string[] => {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return toDateStr(d);
  });
};

// GET /api/analytics/weekly - compute or retrieve weekly analytics
export const getWeeklyAnalytics = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    const now = new Date();
    const weekStart = getWeekStart(now);
    const weekDates = getWeekDates(weekStart);
    const weekStartStr = weekDates[0];
    const weekEndStr = weekDates[6];

    // Fetch all sessions for this week
    const sessions = await Session.find({
      userId: req.userId,
      date: { $in: weekDates },
      isActive: false,
    });

    // Build daily stats
    const dailyStats = weekDates.map(date => {
      const daySessions = sessions.filter(s => s.date === date);
      return {
        date,
        studyMinutes: daySessions.filter(s => s.type === 'study').reduce((a, s) => a + (s.durationMinutes || 0), 0),
        sleepMinutes: daySessions.filter(s => s.type === 'sleep').reduce((a, s) => a + (s.durationMinutes || 0), 0),
        screenMinutes: daySessions.filter(s => s.type === 'screen').reduce((a, s) => a + (s.durationMinutes || 0), 0),
        exerciseMinutes: daySessions.filter(s => s.type === 'exercise').reduce((a, s) => a + (s.durationMinutes || 0), 0),
        hobbyMinutes: daySessions.filter(s => s.type === 'hobby').reduce((a, s) => a + (s.durationMinutes || 0), 0),
        tasksCompleted: daySessions.filter(s => s.type === 'study').length,
      };
    });

    const totalStudyMinutes = dailyStats.reduce((a, d) => a + d.studyMinutes, 0);
    const totalSleepMinutes = dailyStats.reduce((a, d) => a + d.sleepMinutes, 0);
    const totalScreenMinutes = dailyStats.reduce((a, d) => a + d.screenMinutes, 0);

    // Compute productivity score (0-100) based on goals met
    const studyGoalMinutes = user.onboarding.studyGoalHours * 60 * 7;
    const sleepGoalMinutes = user.onboarding.sleepHours * 60 * 7;
    const screenLimitMinutes = user.onboarding.screenTimeLimitHours * 60 * 7;

    const studyScore = Math.min((totalStudyMinutes / studyGoalMinutes) * 40, 40);
    const sleepScore = Math.min((totalSleepMinutes / sleepGoalMinutes) * 30, 30);
    const screenScore = totalScreenMinutes <= screenLimitMinutes ? 30 : Math.max(30 - ((totalScreenMinutes - screenLimitMinutes) / 60) * 5, 0);
    const avgProductivityScore = Math.round(studyScore + sleepScore + screenScore);

    const analytics = {
      weekStartDate: weekStartStr,
      weekEndDate: weekEndStr,
      dailyStats,
      totalStudyMinutes,
      totalSleepMinutes,
      totalScreenMinutes,
      avgProductivityScore,
      goals: {
        studyGoalMet: totalStudyMinutes >= studyGoalMinutes * 0.8,
        sleepGoalMet: totalSleepMinutes >= sleepGoalMinutes * 0.8,
        screenLimitMet: totalScreenMinutes <= screenLimitMinutes,
      },
    };

    res.json({ analytics });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/analytics/stats - quick stats for dashboard
export const getDashboardStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const today = toDateStr(new Date());

    const todaySessions = await Session.find({
      userId: req.userId,
      date: today,
      isActive: false,
    });

    const stats = {
      todayStudyMinutes: todaySessions.filter(s => s.type === 'study').reduce((a, s) => a + (s.durationMinutes || 0), 0),
      todaySleepMinutes: todaySessions.filter(s => s.type === 'sleep').reduce((a, s) => a + (s.durationMinutes || 0), 0),
      todayScreenMinutes: todaySessions.filter(s => s.type === 'screen').reduce((a, s) => a + (s.durationMinutes || 0), 0),
      sessionsToday: todaySessions.length,
    };

    res.json({ stats });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
