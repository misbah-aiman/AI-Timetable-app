import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Sparkles, AlertTriangle, ArrowLeft, CheckCircle, Check } from 'lucide-react';
import { authApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { OtpInput } from '../components/auth/OtpInput';

type Step = 'email' | 'otp' | 'success';

const RESEND_COOLDOWN = 60;

const FEATURES = [
  'Personalised AI schedule',
  'Track study, sleep & screen time',
  'Smart task scheduling',
];

export const Login = () => {
  const [step, setStep]     = useState<Step>('email');
  const [email, setEmail]   = useState('');
  const [otp, setOtp]       = useState('');
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const { login }   = useAuth();
  const navigate    = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionExpired = searchParams.get('reason') === 'session_expired';
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

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
    setError(''); setLoading(true);
    try {
      await authApi.sendOtp(trimmed);
      setOtp(''); setStep('otp'); startCountdown();
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { message?: string; detail?: string; remaining?: number } } };
      const remaining = apiErr?.response?.data?.remaining;
      if (remaining) setCountdown(remaining);
      const detail = apiErr?.response?.data?.detail;
      const msg    = apiErr?.response?.data?.message || 'Something went wrong. Please try again.';
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
      setError(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        || 'Failed to resend code',
      );
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
      setError(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        || 'Invalid code. Please try again.',
      );
    } finally { setLoading(false); }
  };

  useEffect(() => {
    if (step === 'otp' && otp.length === 6 && !loading) handleVerifyOtp();
  }, [otp]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-[#011515] flex">

      {/* ── Desktop left panel ── */}
      <div className="hidden md:flex md:w-1/2 lg:w-2/5 bg-primary-700 flex-col justify-center p-12 relative overflow-hidden shrink-0">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(rgba(255,255,255,0.06) 1.5px, transparent 1.5px)',
            backgroundSize: '24px 24px',
          }}
        />
        <div className="relative text-white">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 bg-white/15 rounded-2xl flex items-center justify-center border border-white/20">
              <Sparkles size={18} />
            </div>
            <span className="font-bold text-[17px] tracking-tight">AI Timetable</span>
          </div>
          <h2 className="text-[38px] font-bold leading-[1.1] tracking-tight mb-4">
            Welcome<br />back.
          </h2>
          <p className="text-primary-200 text-[15px] leading-relaxed mb-10 max-w-[260px]">
            Your AI-powered schedule is waiting. Sign in to continue.
          </p>
          <div className="space-y-3">
            {FEATURES.map(f => (
              <div key={f} className="flex items-center gap-2.5 text-[14px] text-primary-100">
                <div className="w-[18px] h-[18px] rounded-full bg-white/15 border border-white/20 flex items-center justify-center shrink-0">
                  <Check size={10} strokeWidth={3} />
                </div>
                {f}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right / mobile panel ── */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Mobile header bar */}
        <div className="md:hidden bg-primary-700 px-6 pt-14 pb-8 flex items-center justify-center gap-2.5">
          <div className="w-9 h-9 bg-white/15 rounded-xl flex items-center justify-center border border-white/20">
            <Sparkles className="text-white" size={17} />
          </div>
          <span className="text-[18px] font-bold text-white tracking-tight">AI Timetable</span>
        </div>

        {/* Form area */}
        <div className="flex-1 flex flex-col justify-center px-6 py-8 md:px-12 lg:px-16">
          <div className="w-full max-w-sm mx-auto">

            {/* Session expired banner */}
            {sessionExpired && step === 'email' && (
              <div className="mb-5 flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-3xl">
                <AlertTriangle size={18} className="text-amber-500 shrink-0 mt-0.5" />
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  Your session expired. Sign in again.
                </p>
              </div>
            )}

            {/* Step titles */}
            {step === 'email' && (
              <div className="mb-7">
                <h2 className="text-[26px] font-bold text-gray-900 dark:text-white tracking-tight">
                  Sign in
                </h2>
                <p className="text-[14px] text-gray-400 mt-1 tracking-tight">
                  Enter your email to continue
                </p>
              </div>
            )}

            {step === 'otp' && (
              <div className="mb-7">
                <button
                  type="button"
                  onClick={() => { setStep('email'); setError(''); setOtp(''); }}
                  className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-primary-500 mb-5 transition-colors"
                >
                  <ArrowLeft size={15} /> Change email
                </button>
                <h2 className="text-[26px] font-bold text-gray-900 dark:text-white tracking-tight">
                  Enter the code
                </h2>
                <p className="text-[14px] text-gray-400 mt-1 tracking-tight">
                  We sent a 6-digit code to <span className="font-medium text-gray-600 dark:text-gray-300">{email}</span>
                </p>
              </div>
            )}

            {/* Email step */}
            {step === 'email' && (
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
                  <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 px-4 py-3 rounded-2xl">
                    {error}
                  </p>
                )}
                <Button type="submit" className="w-full" loading={loading} size="lg">
                  Continue
                </Button>
                <p className="text-center text-xs text-gray-400">
                  New here?{' '}
                  <button
                    type="button"
                    onClick={() => navigate('/signup')}
                    className="text-primary-500 hover:underline font-semibold"
                  >
                    Create an account
                  </button>
                </p>
              </form>
            )}

            {/* OTP step */}
            {step === 'otp' && (
              <form onSubmit={handleVerifyOtp} className="space-y-6">
                <OtpInput value={otp} onChange={v => { setOtp(v); setError(''); }} disabled={loading} />
                {error && (
                  <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 px-4 py-3 rounded-2xl text-center">
                    {error}
                  </p>
                )}
                <Button type="submit" className="w-full" loading={loading} size="lg" disabled={otp.length < 6}>
                  Verify Code
                </Button>
                <p className="text-center text-sm text-gray-400">
                  Didn't receive it?{' '}
                  {countdown > 0 ? (
                    <span className="text-gray-300 tabular-nums">Resend in {countdown}s</span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResend}
                      disabled={loading}
                      className="text-primary-500 hover:underline font-semibold disabled:opacity-50"
                    >
                      Resend code
                    </button>
                  )}
                </p>
              </form>
            )}

            {/* Success step */}
            {step === 'success' && (
              <div className="flex flex-col items-center gap-5 py-8 animate-scale-in">
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
        </div>
      </div>
    </div>
  );
};
