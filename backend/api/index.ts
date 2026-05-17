import 'dotenv/config';
import type { IncomingMessage, ServerResponse } from 'http';
import mongoose from 'mongoose';
import app from '../src/app';

let isConnected = false;

async function connectDB(): Promise<void> {
  if (isConnected) return;
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI environment variable is not set');
  await mongoose.connect(process.env.MONGODB_URI);
  isConnected = true;
  console.log('✅ MongoDB connected (serverless)');
}

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  try {
    await connectDB();
  } catch (err) {
    console.error('❌ DB connection failed:', err);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: 'Database connection failed' }));
    return;
  }
  app(req as Parameters<typeof app>[0], res as Parameters<typeof app>[1]);
}
