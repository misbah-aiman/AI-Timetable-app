import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Sparkles, AlertTriangle, Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { authApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { OtpInput } from '../components/auth/OtpInput';

type Step = 'email' | 'otp' | 'success';

const RESEND_COOLDOWN = 60;

export const Login = () => {
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

  const startCountdown = () => {
    setCountdown(RESEND_COOLDOWN);
    timerRef.current = setInterval(() => {
      setCountdown(prev => { if (prev <= 1) { clearInterval(timerRef.current!); return 0; } return prev - 1; });
    }, 1000);
  };

  const handleContinue = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError('Please enter a valid email address');
      return;
    }
    setError(''); setLoading(true);
    try {
      const { data } = await authApi.checkEmail(trimmed);
      if (!data.exists) {
        navigate(`/signup?email=${encodeURIComponent(trimmed)}`);
        return;
      }
      // Existing user — send OTP
      await authApi.sendOtp(trimmed);
      setOtp(''); setStep('otp'); startCountdown();
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { message?: string; detail?: string; remaining?: number } } };
      const remaining = apiErr?.response?.data?.remaining;
      if (remaining) setCountdown(remaining);
      const detail = apiErr?.response?.data?.detail;
      const msg = apiErr?.response?.data?.message || 'Something went wrong. Please try again.';
      setError(detail ? `${msg} (${detail})` : msg);
    } finally { setLoading(false); }
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    setError(''); setLoading(true);
    try {
      await authApi.sendOtp(email.trim().toLowerCase());
      setOtp(''); startCountdown();
    } catch (err: unknown) {
      setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to resend code');
    } finally { setLoading(false); }
  };

  const handleVerifyOtp = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (otp.length < 6) { setError('Please enter the complete 6-digit code'); return; }
    setError(''); setLoading(true);
    try {
      const res = await authApi.verifyOtp({ email: email.trim().toLowerCase(), otp });
      setStep('success');
      setTimeout(() => {
        login(res.data.token, res.data.user);
        navigate(res.data.user.onboardingCompleted ? '/dashboard' : '/onboarding');
      }, 800);
    } catch (err: unknown) {
      setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Invalid code. Please try again.');
    } finally { setLoading(false); }
  };

  useEffect(() => {
    if (step === 'otp' && otp.length === 6 && !loading) handleVerifyOtp();
  }, [otp]); // eslint-disable-line react-hooks/exhaustive-deps

  const formContent = (
    <div className="w-full">
      {/* Session expired banner */}
      {sessionExpired && step === 'email' && (
        <div className="mb-5 flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-3xl">
          <AlertTriangle size={18} className="text-amber-500 shrink-0 mt-0.5" />
          <p className="text-sm text-amber-700 dark:text-amber-300">Your session expired. Sign in again.</p>
        </div>
      )}

      {/* Step 1: Email */}
      {step === 'email' && (
        <>
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Welcome back</h2>
            <p className="text-sm text-gray-400 mt-1">Enter your email to continue</p>
          </div>
          <form onSubmit={handleContinue} className="space-y-4">
            <Input
              label="Email address"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => { setEmail(e.target.value); setError(''); }}
              autoFocus
              required
            />
            {error && <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 px-4 py-3 rounded-2xl">{error}</p>}
            <Button type="submit" className="w-full" loading={loading} size="lg">
              Continue
            </Button>
            <p className="text-center text-xs text-gray-400">
              New here?{' '}
              <button
                type="button"
                onClick={() => navigate(email ? `/signup?email=${encodeURIComponent(email.trim().toLowerCase())}` : '/signup')}
                className="text-primary-500 hover:underline font-semibold"
              >
                Create account
              </button>
            </p>
          </form>
        </>
      )}

      {/* Step 2: OTP */}
      {step === 'otp' && (
        <form onSubmit={handleVerifyOtp} className="space-y-6">
          <div>
            <button
              type="button"
              onClick={() => { setStep('email'); setError(''); setOtp(''); }}
              className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-primary-500 mb-5 transition-colors"
            >
              <ArrowLeft size={15} /> Change email
            </button>
            <div className="flex items-center gap-3 p-4 bg-primary-50 dark:bg-primary-900/20 rounded-3xl border border-primary-100 dark:border-primary-800/50 mb-5">
              <div className="w-9 h-9 rounded-2xl bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center shrink-0">
                <Mail size={16} className="text-primary-500" />
              </div>
              <div>
                <p className="text-xs text-gray-400">Code sent to</p>
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{email}</p>
              </div>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Enter the 6-digit code:</p>
            <OtpInput value={otp} onChange={v => { setOtp(v); setError(''); }} disabled={loading} />
          </div>
          {error && <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 px-4 py-3 rounded-2xl text-center">{error}</p>}
          <Button type="submit" className="w-full" loading={loading} size="lg" disabled={otp.length < 6}>
            Verify Code
          </Button>
          <p className="text-center text-sm text-gray-400">
            Didn't receive it?{' '}
            {countdown > 0
              ? <span className="text-gray-300">Resend in {countdown}s</span>
              : <button type="button" onClick={handleResend} disabled={loading} className="text-primary-500 hover:underline font-semibold disabled:opacity-50">Resend code</button>
            }
          </p>
        </form>
      )}

      {/* Step 3: Success */}
      {step === 'success' && (
        <div className="flex flex-col items-center gap-5 py-8">
          <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center shadow-soft">
            <CheckCircle size={40} className="text-green-500" />
          </div>
          <div className="text-center">
            <p className="font-bold text-gray-800 dark:text-white text-xl">You're in!</p>
            <p className="text-sm text-gray-400 mt-1">Redirecting…</p>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-[#1a0405] flex">

      {/* Desktop: left gradient panel */}
      <div className="hidden md:flex md:w-1/2 lg:w-2/5 bg-gradient-to-br from-primary-500 to-primary-700 flex-col items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-white" />
          <div className="absolute -bottom-20 -left-16 w-72 h-72 rounded-full bg-white" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-white opacity-5" />
        </div>
        <div className="relative text-center text-white">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur rounded-3xl mb-6 shadow-soft-lg">
            <Sparkles size={36} />
          </div>
          <h1 className="text-4xl font-bold mb-3">AI Timetable</h1>
          <p className="text-white/70 text-lg">Your smart schedule, built for you.</p>
        </div>
      </div>

      {/* Right / Mobile: form panel */}
      <div className="flex-1 flex flex-col md:justify-center">
        {/* Mobile-only gradient header */}
        <div className="md:hidden bg-gradient-to-b from-primary-500 to-primary-600 px-6 pt-14 pb-10 text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white" />
            <div className="absolute -bottom-10 -left-8 w-48 h-48 rounded-full bg-white" />
          </div>
          <div className="relative">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-white/20 backdrop-blur rounded-3xl mb-3 shadow-soft">
              <Sparkles className="text-white" size={26} />
            </div>
            <h1 className="text-2xl font-bold text-white">AI Timetable</h1>
          </div>
        </div>

        {/* Form area */}
        <div className="flex-1 md:flex-none px-6 py-8 md:px-12 lg:px-16 -mt-5 md:mt-0 rounded-t-[2rem] md:rounded-none bg-surface-50 dark:bg-[#1a0405]">
          <div className="max-w-sm mx-auto">
            {formContent}
          </div>
        </div>
      </div>
    </div>
  );
};
