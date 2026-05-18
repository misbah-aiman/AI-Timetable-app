import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import { sendOtpEmail } from '../utils/email';
import { AuthRequest } from '../middleware/auth';

const JWT_EXPIRES_IN = '7d';
const OTP_EXPIRY_MS = 10 * 60 * 1000;     // 10 minutes
const OTP_COOLDOWN_MS = 60 * 1000;         // 60 seconds between sends

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const signToken = (userId: string) =>
  jwt.sign({ userId }, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: JWT_EXPIRES_IN });

const generateOtp = () => String(Math.floor(100000 + Math.random() * 900000));

const nameFromEmail = (email: string) =>
  email
    .split('@')[0]
    .replace(/[._-]+/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
    .trim() || 'User';

// POST /api/auth/send-otp
export const sendOTP = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email || !EMAIL_REGEX.test(email)) {
      res.status(400).json({ message: 'A valid email address is required' });
      return;
    }

    const normalizedEmail = email.toLowerCase().trim();
    let user = await User.findOne({ email: normalizedEmail });

    // Enforce cooldown
    if (user?.otp?.lastSentAt) {
      const elapsed = Date.now() - new Date(user.otp.lastSentAt).getTime();
      if (elapsed < OTP_COOLDOWN_MS) {
        const remaining = Math.ceil((OTP_COOLDOWN_MS - elapsed) / 1000);
        res.status(429).json({ message: `Please wait ${remaining}s before requesting a new code`, remaining });
        return;
      }
    }

    const otp = generateOtp();
    const hashedOtp = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MS);
    const lastSentAt = new Date();

    if (user) {
      user.otp = { code: hashedOtp, expiresAt, lastSentAt };
      await user.save();
    } else {
      user = await User.create({
        name: nameFromEmail(normalizedEmail),
        email: normalizedEmail,
        otp: { code: hashedOtp, expiresAt, lastSentAt },
      });
    }

    // Always log OTP in development so you can test without a verified domain
    if (process.env.NODE_ENV !== 'production') {
      console.log(`\n🔑 OTP for ${normalizedEmail}: ${otp}\n`);
    }

    try {
      await sendOtpEmail(normalizedEmail, otp);
    } catch (emailError) {
      const detail = (emailError as Error).message;
      console.error('❌ Email send failed for', normalizedEmail, '—', detail);
      res.status(500).json({ message: 'Failed to send verification code.', detail });
      return;
    }

    res.json({ message: 'Verification code sent', isNewUser: !user.onboarding?.completed });
  } catch (error) {
    const detail = (error as Error).message;
    console.error('Send OTP error:', detail);
    res.status(500).json({ message: 'Failed to send verification code. Please try again.', detail });
  }
};

// POST /api/auth/verify-otp
export const verifyOTP = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      res.status(400).json({ message: 'Email and verification code are required' });
      return;
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user || !user.otp?.code || !user.otp?.expiresAt) {
      res.status(400).json({ message: 'No verification code found. Please request a new one.' });
      return;
    }

    if (new Date(user.otp.expiresAt) < new Date()) {
      res.status(400).json({ message: 'Verification code has expired. Please request a new one.' });
      return;
    }

    const isValid = await bcrypt.compare(String(otp).trim(), user.otp.code);
    if (!isValid) {
      res.status(400).json({ message: 'Invalid verification code. Please check and try again.' });
      return;
    }

    // Consume the OTP
    user.otp.code = null;
    user.otp.expiresAt = null;
    await user.save();

    const token = signToken(user._id.toString());

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        onboardingCompleted: user.onboarding.completed,
      },
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ message: 'Verification failed. Please try again.' });
  }
};

// GET /api/auth/me
export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.userId).select('-password -otp');
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        onboarding: user.onboarding,
        onboardingCompleted: user.onboarding.completed,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
