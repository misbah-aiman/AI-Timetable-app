import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Sparkles, AlertTriangle, Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { authApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { OtpInput } from '../components/auth/OtpInput';

type Step = 'email' | 'otp' | 'success';
type Mode = 'signin' | 'signup';

const RESEND_COOLDOWN = 60;

export const Login = () => {
  const [mode, setMode] = useState<Mode>('signin');
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionExpired = searchParams.get('reason') === 'session_expired';
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const switchMode = (m: Mode) => {
    setMode(m);
    setStep('email');
    setEmail('');
    setOtp('');
    setError('');
  };

  const startCountdown = () => {
    setCountdown(RESEND_COOLDOWN);
    timerRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) { clearInterval(timerRef.current!); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSendOtp = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError('Please enter a valid email address');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await authApi.sendOtp(trimmed);
      setOtp('');
      setStep('otp');
      startCountdown();
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { message?: string; detail?: string; remaining?: number } } };
      const remaining = apiErr?.response?.data?.remaining;
      if (remaining) setCountdown(remaining);
      const detail = apiErr?.response?.data?.detail;
      const msg = apiErr?.response?.data?.message || 'Failed to send code. Please try again.';
      setError(detail ? `${msg} (${detail})` : msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    setError('');
    setLoading(true);
    try {
      await authApi.sendOtp(email.trim().toLowerCase());
      setOtp('');
      startCountdown();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to resend code';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (otp.length < 6) { setError('Please enter the complete 6-digit code'); return; }
    setError('');
    setLoading(true);
    try {
      const res = await authApi.verifyOtp({ email: email.trim().toLowerCase(), otp });
      setStep('success');
      setTimeout(() => {
        login(res.data.token, res.data.user);
        navigate(res.data.user.onboardingCompleted ? '/dashboard' : '/onboarding');
      }, 800);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Invalid code. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (step === 'otp' && otp.length === 6 && !loading) handleVerifyOtp();
  }, [otp]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-indigo-100 dark:from-gray-950 dark:to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-primary-600 rounded-2xl mb-4 shadow-lg">
            <Sparkles className="text-white" size={28} />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">AI Timetable</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">
            {step === 'otp' ? 'Check your inbox' : step === 'success' ? 'Signing you in…' : 'Your AI-powered daily planner'}
          </p>
        </div>

        {/* Session expired banner */}
        {sessionExpired && step === 'email' && (
          <div className="mb-4 flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
            <AlertTriangle size={18} className="text-amber-500 shrink-0 mt-0.5" />
            <p className="text-sm text-amber-700 dark:text-amber-300">Your session expired. Sign in again.</p>
          </div>
        )}

        <Card>
          {/* ── Step 1: Email ── */}
          {step === 'email' && (
            <>
              {/* Mode tabs */}
              <div className="flex bg-gray-100 dark:bg-gray-800 rounded-xl p-1 mb-6">
                {(['signin', 'signup'] as Mode[]).map(m => (
                  <button
                    key={m}
                    onClick={() => switchMode(m)}
                    className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                      mode === m
                        ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                    }`}
                  >
                    {m === 'signin' ? 'Sign In' : 'Create Account'}
                  </button>
                ))}
              </div>

              <form onSubmit={handleSendOtp} className="space-y-4">
                <Input
                  label="Email address"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setError(''); }}
                  autoFocus
                  required
                />

                {error && (
                  <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">{error}</p>
                )}

                <Button type="submit" className="w-full" loading={loading} size="lg">
                  {mode === 'signin' ? 'Sign In' : 'Create Account'}
                </Button>

                <p className="text-center text-xs text-gray-400 dark:text-gray-500">
                  {mode === 'signin'
                    ? "We'll email you a sign-in code — no password needed."
                    : 'Enter your email and we\'ll send a verification code to get started.'}
                </p>
              </form>
            </>
          )}

          {/* ── Step 2: OTP ── */}
          {step === 'otp' && (
            <form onSubmit={handleVerifyOtp} className="space-y-6">
              <div>
                <button
                  type="button"
                  onClick={() => { setStep('email'); setError(''); setOtp(''); }}
                  className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 mb-4 transition-colors"
                >
                  <ArrowLeft size={15} /> Change email
                </button>

                <div className="flex items-center gap-3 p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-100 dark:border-indigo-800 mb-4">
                  <Mail size={18} className="text-primary-500 shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Code sent to</p>
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{email}</p>
                  </div>
                </div>

                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Enter the 6-digit code from your email:</p>
                <OtpInput value={otp} onChange={v => { setOtp(v); setError(''); }} disabled={loading} />
              </div>

              {error && (
                <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg text-center">{error}</p>
              )}

              <Button type="submit" className="w-full" loading={loading} size="lg" disabled={otp.length < 6}>
                Verify Code
              </Button>

              <p className="text-center text-sm text-gray-500 dark:text-gray-400">
                Didn't receive it?{' '}
                {countdown > 0 ? (
                  <span className="text-gray-400">Resend in {countdown}s</span>
                ) : (
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={loading}
                    className="text-primary-600 hover:underline font-medium disabled:opacity-50"
                  >
                    Resend code
                  </button>
                )}
              </p>
            </form>
          )}

          {/* ── Step 3: Success ── */}
          {step === 'success' && (
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <CheckCircle size={36} className="text-green-500" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-gray-900 dark:text-white text-lg">You're in!</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Redirecting…</p>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
