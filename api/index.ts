import 'dotenv/config';
import type { IncomingMessage, ServerResponse } from 'http';
import mongoose from 'mongoose';

// Log missing env vars immediately — visible in Vercel Function logs on cold start
const REQUIRED_ENV = ['MONGODB_URI', 'JWT_SECRET', 'GMAIL_USER', 'GMAIL_APP_PASSWORD'];
for (const key of REQUIRED_ENV) {
  if (!process.env[key]) console.error(`❌ Missing env var: ${key}`);
}

// Import app AFTER env check so startup logs appear before any module-level side effects
import app from '../backend/src/app';

let isConnected = false;

async function connectDB(): Promise<void> {
  if (isConnected) return;
  await mongoose.connect(process.env.MONGODB_URI!);
  mongoose.connection.on('error', err => console.error('MongoDB error:', err));
  isConnected = true;
  console.log('✅ MongoDB connected');
}

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  try {
    await connectDB();
  } catch (err) {
    console.error('❌ DB connection failed:', (err as Error).message);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: 'Database connection failed' }));
    return;
  }
  app(req as Parameters<typeof app>[0], res as Parameters<typeof app>[1]);
}
