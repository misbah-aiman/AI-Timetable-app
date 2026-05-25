import { Response } from 'express';
import Task from '../models/Task';
import { AuthRequest } from '../middleware/auth';

// GET /api/tasks
export const getTasks = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const tasks = await Task.find({ userId: req.userId }).sort({ dueDate: 1, createdAt: -1 });
    res.json({ tasks });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/tasks
export const createTask = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, subject, dueDate, estimatedHours, priority } = req.body;
    if (!title?.trim() || !dueDate || !estimatedHours) {
      res.status(400).json({ message: 'Title, due date, and estimated hours are required' });
      return;
    }
    const task = await Task.create({
      userId: req.userId,
      title: title.trim(),
      subject: subject?.trim() || '',
      dueDate,
      estimatedHours: Number(estimatedHours),
      priority: priority || 'medium',
    });
    res.status(201).json({ task });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
};

// PUT /api/tasks/:id — update status, title, etc.
export const updateTask = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const allowed = ['title', 'subject', 'dueDate', 'estimatedHours', 'priority', 'status'];
    const updates: Record<string, unknown> = {};
    for (const key of allowed) {
      if (key in req.body) updates[key] = req.body[key];
    }
    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      updates,
      { new: true, runValidators: true }
    );
    if (!task) { res.status(404).json({ message: 'Task not found' }); return; }
    res.json({ task });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
};

// DELETE /api/tasks/:id
export const deleteTask = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const task = await Task.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!task) { res.status(404).json({ message: 'Task not found' }); return; }
    res.json({ message: 'Task deleted' });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
};
