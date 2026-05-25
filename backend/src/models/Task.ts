import mongoose, { Document, Schema } from 'mongoose';

export interface ITask extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  subject: string;
  dueDate: Date;
  estimatedHours: number;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'done';
  createdAt: Date;
  updatedAt: Date;
}

const TaskSchema = new Schema<ITask>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true },
    subject: { type: String, trim: true, default: '' },
    dueDate: { type: Date, required: true },
    estimatedHours: { type: Number, required: true, min: 0.5, max: 24 },
    priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    status: { type: String, enum: ['pending', 'done'], default: 'pending' },
  },
  { timestamps: true }
);

export default mongoose.model<ITask>('Task', TaskSchema);
