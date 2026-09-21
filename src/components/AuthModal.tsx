import React, { useState } from 'react';
import {
  X,
  Lock,
  Mail,
  User,
  Phone,
  ShieldCheck,
  ArrowRight,
  RefreshCw,
  Eye,
  EyeOff,
  Sparkles,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'signup' | 'otp';
  onSuccess?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'login',
  onSuccess,
}) => {
  const {
    login,
    signUp,
    sendOtp,
    verifyOtp,
    resendOtp,
    otpState,
    clearOtpState,
    error: authError,
  } = useAuth();

  const [mode, setMode] = useState<'login' | 'signup' | 'otp'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const validateEmail = (val: string) => /\S+@\S+\.\S+/.test(val);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (!email || !validateEmail(email)) {
      setLocalError('Please enter a valid email address.');
      return;
    }
    if (!password || password.length < 6) {
      setLocalError('Password must be at least 6 characters.');
      return;
    }

    try {
      setIsLoading(true);
      await login(email, password);
      setSuccessMessage('Welcome back to SkillSwap!');
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 1000);
    } catch (err: any) {
      setLocalError(err.message || 'Login failed. Please verify your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (!displayName.trim()) {
      setLocalError('Please enter your full name or nickname.');
      return;
    }
    if (!email || !validateEmail(email)) {
      setLocalError('Please enter a valid email address.');
      return;
    }
    if (!password || password.length < 6) {
      setLocalError('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setLocalError('Passwords do not match. Please verify.');
      return;
    }

    try {
      setIsLoading(true);
      await signUp(
        email,
        password,
        displayName,
        phone.trim() ? { bio: `SkillSwap Member | Mobile: ${phone.trim()}` } : {}
      );
      setSuccessMessage('Account created successfully! Welcome to SkillSwap.');
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 1200);
    } catch (err: any) {
      setLocalError(err.message || 'Failed to create account.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    setSuccessMessage(null);

    const code = otpCode.trim();

    if (!/^\d{6}$/.test(code)) {
      setLocalError('Please enter the 6-digit verification code.');
      return;
    }

    try {
      setIsLoading(true);

      const verified = await verifyOtp(code);

      if (!verified) {
        setLocalError('Invalid or expired OTP code.');
        return;
      }

      // OTP verification is currently fail-closed in AuthContext.
      // If a real Firebase phone-auth flow is enabled later,
      // verifyOtp() can return true and account creation can proceed.
      await signUp(email, password, displayName, {
        bio: `SkillSwap Member | Verified Mobile (${phone})`,
      });

      setSuccessMessage('Verification complete! Welcome to SkillSwap.');

      setTimeout(() => {
        clearOtpState();
        onSuccess?.();
        onClose();
      }, 1200);
    } catch (err: any) {
      setLocalError(
        err?.message || 'Invalid or expired OTP code.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      setLocalError(null);
      await resendOtp();
    } catch (err: any) {
      setLocalError(err.message || 'Failed to resend code.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden">
        
        {/* Modal Header */}
        <div className="relative bg-gradient-to-r from-indigo-600 to-teal-500 p-6 text-white">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 rounded-xl bg-white/20 backdrop-blur-md">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-100">
              SkillSwap 5.0 Authentication
            </span>
          </div>

          <h2 className="text-2xl font-black tracking-tight">
            {mode === 'login' && 'Welcome Back'}
            {mode === 'signup' && 'Join the Skill Exchange'}
            {mode === 'otp' && 'Verify Your Account'}
          </h2>
          <p className="text-xs text-indigo-100 mt-1">
            {mode === 'login' && 'Sign in to access your skills, swaps, and time credits.'}
            {mode === 'signup' && 'Create your profile to start teaching and learning skills.'}
            {mode === 'otp' && `Enter the 6-digit code sent to ${otpState.phoneNumberOrEmail || phone}`}
          </p>
        </div>

        {/* Tab Switcher (Login / Sign Up) */}
        {mode !== 'otp' && (
          <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
            <button
              onClick={() => {
                setMode('login');
                setLocalError(null);
              }}
              className={`flex-1 py-3 text-xs font-bold transition-all ${
                mode === 'login'
                  ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 bg-white dark:bg-slate-900'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => {
                setMode('signup');
                setLocalError(null);
              }}
              className={`flex-1 py-3 text-xs font-bold transition-all ${
                mode === 'signup'
                  ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 bg-white dark:bg-slate-900'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Create Account
            </button>
          </div>
        )}

        {/* Body Form */}
        <div className="p-6 space-y-4">
          
          {/* Error Banner */}
          {(localError || authError) && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-start gap-2 text-xs text-rose-600 dark:text-rose-400">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{localError || authError}</span>
            </div>
          )}

          {/* Success Banner */}
          {successMessage && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-start gap-2 text-xs text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* MODE: LOGIN */}
          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-gradient-to-r from-indigo-600 to-teal-600 hover:from-indigo-500 hover:to-teal-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-600/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>Sign In to Account</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* MODE: SIGN UP */}
          {mode === 'signup' && (
            <form onSubmit={handleSignUp} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="e.g. Alex Morgan"
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Phone (Optional for OTP 2FA)
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+254 7XX XXX XXX"
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Password
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min. 6 chars"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Confirm Password
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat password"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-3 bg-gradient-to-r from-indigo-600 to-teal-600 hover:from-indigo-500 hover:to-teal-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-600/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>Create Free Account</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* MODE: OTP VERIFICATION */}
          {mode === 'otp' && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="text-center py-2">
                <div className="inline-flex p-3 rounded-full bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 mb-2">
                  <ShieldCheck className="w-6 h-6 text-teal-600 dark:text-teal-400" />
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  We sent a 6-digit security code to{' '}
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {phone || email}
                  </span>
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 text-center">
                  Enter 6-Digit Verification Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="• • • • • •"
                  className="w-full text-center tracking-[0.5em] text-xl font-mono py-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all font-bold"
                  required
                />
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400">
                  {otpState.resendCountdown > 0
                    ? `Resend code in ${otpState.resendCountdown}s`
                    : "Didn't receive the code?"}
                </span>
                <button
                  type="button"
                  disabled={otpState.resendCountdown > 0 || isLoading}
                  onClick={handleResend}
                  className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline disabled:opacity-40"
                >
                  Resend OTP
                </button>
              </div>

              <button
                type="submit"
                disabled={isLoading || otpCode.length !== 6}
                className="w-full py-3 bg-teal-600 hover:bg-teal-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-teal-600/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>Verify & Continue</span>
                    <CheckCircle2 className="w-4 h-4" />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setMode('signup')}
                className="w-full text-center text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              >
                ← Back to registration
              </button>
            </form>
          )}

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 text-center">
            🔐 Secured by Firebase Authentication & Cloud Firestore
          </div>

        </div>

      </div>
    </div>
  );
};
