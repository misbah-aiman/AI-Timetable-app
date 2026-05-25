import { Response } from 'express';
import User from '../models/User';
import Timetable from '../models/Timetable';
import Session from '../models/Session';
import WeeklyAnalytics from '../models/Analytics';
import { AuthRequest } from '../middleware/auth';

// POST /api/user/onboarding
export const saveOnboarding = async (req: AuthRequest, res: Response): Promise<void> => {
  console.log('[saveOnboarding] userId:', req.userId, 'body keys:', Object.keys(req.body));
  try {
    const {
      sleepTime, wakeTime, sleepHours, studyGoalHours,
      subjects, hobbies, screenTimeLimitHours, classes,
      chronotype, studyStyle,
      exerciseEnabled, exerciseTime, exerciseDuration,
      workEnabled, workDays, workStartTime, workEndTime,
    } = req.body;

    const user = await User.findByIdAndUpdate(
      req.userId,
      {
        'onboarding.sleepTime': sleepTime,
        'onboarding.wakeTime': wakeTime,
        'onboarding.sleepHours': sleepHours,
        'onboarding.studyGoalHours': studyGoalHours,
        'onboarding.subjects': subjects,
        'onboarding.hobbies': hobbies,
        'onboarding.screenTimeLimitHours': screenTimeLimitHours,
        'onboarding.classes': classes || [],
        'onboarding.chronotype': chronotype || 'morning',
        'onboarding.studyStyle': studyStyle || 'medium',
        'onboarding.exerciseEnabled': exerciseEnabled ?? false,
        'onboarding.exerciseTime': exerciseTime || 'morning',
        'onboarding.exerciseDuration': exerciseDuration || 30,
        'onboarding.workEnabled': workEnabled ?? false,
        'onboarding.workDays': workDays || [],
        'onboarding.workStartTime': workStartTime || '09:00',
        'onboarding.workEndTime': workEndTime || '17:00',
        'onboarding.completed': true,
      },
      { new: true }
    ).select('-password');

    if (!user) {
      console.log('[saveOnboarding] user not found for id:', req.userId);
      res.status(404).json({ message: 'User not found' });
      return;
    }

    console.log('[saveOnboarding] success, completed:', user.onboarding.completed);
    res.json({ message: 'Onboarding saved', onboarding: user.onboarding });
  } catch (error) {
    console.error('[saveOnboarding] error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// PUT /api/user/settings - update routine settings
export const updateSettings = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      name, sleepTime, wakeTime, sleepHours, studyGoalHours,
      screenTimeLimitHours, subjects, hobbies, classes,
      chronotype, studyStyle,
      exerciseEnabled, exerciseTime, exerciseDuration,
      workEnabled, workDays, workStartTime, workEndTime,
    } = req.body;

    const updateData: Record<string, unknown> = {};
    if (name)                              updateData.name = name;
    if (sleepTime)                         updateData['onboarding.sleepTime'] = sleepTime;
    if (wakeTime)                          updateData['onboarding.wakeTime'] = wakeTime;
    if (sleepHours !== undefined)          updateData['onboarding.sleepHours'] = sleepHours;
    if (studyGoalHours !== undefined)      updateData['onboarding.studyGoalHours'] = studyGoalHours;
    if (screenTimeLimitHours !== undefined) updateData['onboarding.screenTimeLimitHours'] = screenTimeLimitHours;
    if (subjects)                          updateData['onboarding.subjects'] = subjects;
    if (hobbies !== undefined)             updateData['onboarding.hobbies'] = hobbies;
    if (classes !== undefined)             updateData['onboarding.classes'] = classes;
    if (chronotype)                        updateData['onboarding.chronotype'] = chronotype;
    if (studyStyle)                        updateData['onboarding.studyStyle'] = studyStyle;
    if (exerciseEnabled !== undefined)     updateData['onboarding.exerciseEnabled'] = exerciseEnabled;
    if (exerciseTime)                      updateData['onboarding.exerciseTime'] = exerciseTime;
    if (exerciseDuration !== undefined)    updateData['onboarding.exerciseDuration'] = exerciseDuration;
    if (workEnabled !== undefined)         updateData['onboarding.workEnabled'] = workEnabled;
    if (workDays !== undefined)            updateData['onboarding.workDays'] = workDays;
    if (workStartTime)                     updateData['onboarding.workStartTime'] = workStartTime;
    if (workEndTime)                       updateData['onboarding.workEndTime'] = workEndTime;

    const user = await User.findByIdAndUpdate(req.userId, updateData, { new: true }).select('-password');

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    res.json({ message: 'Settings updated', user: { name: user.name, onboarding: user.onboarding } });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// DELETE /api/user/account
export const deleteAccount = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await Promise.all([
      User.findByIdAndDelete(req.userId),
      Timetable.deleteMany({ userId: req.userId }),
      Session.deleteMany({ userId: req.userId }),
      WeeklyAnalytics.deleteMany({ userId: req.userId }),
    ]);

    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
