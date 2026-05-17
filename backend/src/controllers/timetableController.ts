import { Response } from 'express';
import User from '../models/User';
import Timetable from '../models/Timetable';
import { generateTimetable, scanClassScheduleImage } from '../utils/openai';
import { AuthRequest } from '../middleware/auth';

// Get the Monday of the current week
const getWeekStart = (): Date => {
  const now = new Date();
  const day = now.getDay(); // 0=Sun, 1=Mon...
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday;
};

// POST /api/timetable/generate
export const generate = async (req: AuthRequest, res: Response): Promise<void> => {
  console.log('[generate] userId:', req.userId);
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      console.log('[generate] user not found');
      res.status(404).json({ message: 'User not found' });
      return;
    }

    console.log('[generate] onboarding.completed:', user.onboarding.completed);
    if (!user.onboarding.completed) {
      res.status(400).json({ message: 'Please complete onboarding first' });
      return;
    }

    // Call OpenAI to generate schedule
    const schedule = await generateTimetable(user.onboarding);

    const weekStartDate = getWeekStart();

    // Deactivate any existing timetable for this week
    await Timetable.updateMany(
      { userId: req.userId, weekStartDate },
      { isActive: false }
    );

    // Save new timetable
    const timetable = await Timetable.create({
      userId: req.userId,
      weekStartDate,
      schedule,
      isActive: true,
    });

    res.json({ message: 'Timetable generated!', timetable });
  } catch (error) {
    console.error('Timetable generation error:', error);
    res.status(500).json({ message: 'Failed to generate timetable. Check your OpenAI API key.' });
  }
};

// POST /api/timetable/scan-image — upload a schedule photo, AI extracts classes
export const scanImage = async (req: AuthRequest & { file?: Express.Multer.File }, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ message: 'No image uploaded' });
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(req.file.mimetype)) {
      res.status(400).json({ message: 'Only JPEG, PNG, WEBP, or GIF images are supported' });
      return;
    }

    const imageBase64 = req.file.buffer.toString('base64');
    const result = await scanClassScheduleImage(imageBase64, req.file.mimetype);

    if (result.error) {
      res.status(422).json({ message: result.error, classes: [] });
      return;
    }

    res.json({ classes: result.classes || [] });
  } catch (error) {
    console.error('Image scan error:', error);
    res.status(500).json({ message: 'Failed to scan image. Make sure your OpenAI account has GPT-4o access.' });
  }
};

// GET /api/timetable - get the active timetable
export const getTimetable = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const timetable = await Timetable.findOne(
      { userId: req.userId, isActive: true },
      null,
      { sort: { createdAt: -1 } }
    );

    if (!timetable) {
      res.status(404).json({ message: 'No timetable found. Please generate one.' });
      return;
    }

    res.json({ timetable });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/timetable/today - get today's schedule
export const getTodaySchedule = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const timetable = await Timetable.findOne(
      { userId: req.userId, isActive: true },
      null,
      { sort: { createdAt: -1 } }
    );

    if (!timetable) {
      res.status(404).json({ message: 'No timetable found' });
      return;
    }

    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const todayName = days[new Date().getDay()];
    const todaySchedule = timetable.schedule.find(d => d.day === todayName);

    res.json({ day: todayName, slots: todaySchedule?.slots || [] });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
