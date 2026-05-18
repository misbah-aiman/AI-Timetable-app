import 'dotenv/config';
import type { IncomingMessage, ServerResponse } from 'http';
import mongoose from 'mongoose';
import app from '../backend/src/app';

// Fail immediately if not connected — no 10s buffering wait
mongoose.set('bufferCommands', false);

async function connectDB(): Promise<void> {
  // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
  if (mongoose.connection.readyState === 1) return;

  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI env var is not set');

  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 5000,
    socketTimeoutMS: 5000,
  });
  console.log('✅ MongoDB connected');
}

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  try {
    await connectDB();
  } catch (err) {
    const detail = (err as Error).message;
    console.error('❌ DB connection failed:', detail);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: 'Database connection failed', detail }));
    return;
  }
  app(req as Parameters<typeof app>[0], res as Parameters<typeof app>[1]);
}
