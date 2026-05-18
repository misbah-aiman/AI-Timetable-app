import 'dotenv/config';
import type { IncomingMessage, ServerResponse } from 'http';
import app from '../backend/src/app';
import { connectDB } from '../backend/src/db';

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
