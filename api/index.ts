import 'dotenv/config';
import type { IncomingMessage, ServerResponse } from 'http';
import mongoose from 'mongoose';
import app from '../backend/src/app';

let isConnected = false;

async function connectDB(): Promise<void> {
  if (isConnected) return;

  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI env var is not set in Vercel');

  await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
  isConnected = true;
  console.log('✅ MongoDB connected');
}

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  try {
    await connectDB();
  } catch (err) {
    const detail = (err as Error).message;
    console.error('❌ DB connection failed:', detail);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    // Expose detail so you can read the real error from the browser
    res.end(JSON.stringify({ message: 'Database connection failed', detail }));
    return;
  }
  app(req as Parameters<typeof app>[0], res as Parameters<typeof app>[1]);
}
