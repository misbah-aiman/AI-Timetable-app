import { Response } from 'express';
import Session, { SessionType } from '../models/Session';
import { AuthRequest } from '../middleware/auth';

// POST /api/sessions/start
export const startSession = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { type, label } = req.body as { type: SessionType; label: string };

    if (!type || !label) {
      res.status(400).json({ message: 'type and label are required' });
      return;
    }

    // End any active sessions of same type first
    const activeSession = await Session.findOne({ userId: req.userId, type, isActive: true });
    if (activeSession) {
      const now = new Date();
      const durationMinutes = Math.round(
        (now.getTime() - activeSession.startTime.getTime()) / 60000
      );
      await Session.findByIdAndUpdate(activeSession._id, {
        endTime: now,
        durationMinutes,
        isActive: false,
      });
    }

    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];

    const session = await Session.create({
      userId: req.userId,
      type,
      label,
      startTime: now,
      date: dateStr,
      isActive: true,
    });

    res.status(201).json({ session });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// PUT /api/sessions/:id/stop
export const stopSession = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const session = await Session.findOne({ _id: req.params.id, userId: req.userId });

    if (!session) {
      res.status(404).json({ message: 'Session not found' });
      return;
    }

    if (!session.isActive) {
      res.status(400).json({ message: 'Session already stopped' });
      return;
    }

    const now = new Date();
    const durationMinutes = Math.round(
      (now.getTime() - session.startTime.getTime()) / 60000
    );

    const updated = await Session.findByIdAndUpdate(
      session._id,
      { endTime: now, durationMinutes, isActive: false },
      { new: true }
    );

    res.json({ session: updated });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/sessions/active - get all currently active sessions
export const getActiveSessions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const sessions = await Session.find({ userId: req.userId, isActive: true });
    res.json({ sessions });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/sessions/today
export const getTodaySessions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const sessions = await Session.find({ userId: req.userId, date: today }).sort({ startTime: 1 });
    res.json({ sessions });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
