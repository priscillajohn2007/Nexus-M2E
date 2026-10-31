import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { 
  Lock, 
  Mail, 
  User, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  RefreshCw, 
  KeyRound, 
  Sparkles,
  ExternalLink,
  ChevronLeft
} from 'lucide-react';
import { api } from '../../services/api.js';

type AuthView = 'login' | 'register' | 'check_inbox' | 'forgot_password' | 'reset_password';

export const AuthScreen: React.FC = () => {
  const { 
    login, 
    register, 
    verifyToken,
    resendVerification, 
    pendingVerificationEmail, 
    setPendingVerificationEmail,
    resetTokenParam,
    setResetTokenParam 
  } = useAuth();

  const [view, setView] = useState<AuthView>(() => {
    if (resetTokenParam) return 'reset_password';
    if (pendingVerificationEmail) return 'check_inbox';
    return 'login';
  });

  // Form states
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState(pendingVerificationEmail || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Reset password states
  const [resetToken, setResetToken] = useState(resetTokenParam || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [resetGeneratedLink, setResetGeneratedLink] = useState<string | null>(null);

  // Verification state & cooldown
  const [lastGeneratedVerifyLink, setLastGeneratedVerifyLink] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  // UI status
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Keep email in sync if pending email changes
  useEffect(() => {
    if (pendingVerificationEmail) {
      setEmail(pendingVerificationEmail);
      if (view !== 'reset_password') {
        setView('check_inbox');
      }
    }
  }, [pendingVerificationEmail]);

  useEffect(() => {
    if (resetTokenParam) {
      setResetToken(resetTokenParam);
      setView('reset_password');
    }
  }, [resetTokenParam]);

  // Cooldown countdown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  // Password strength calculator
  const calculatePasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: 'None', color: 'bg-slate-200' };
    let score = 0;
    if (pass.length >= 8) score += 1;
    if (pass.length >= 12) score += 1;
    if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score += 1;
    if (/\d/.test(pass)) score += 1;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(pass)) score += 1;

    if (score <= 1) return { score: 1, label: 'Weak', color: 'bg-red-500', text: 'text-red-600' };
    if (score === 2) return { score: 2, label: 'Fair', color: 'bg-amber-500', text: 'text-amber-600' };
    if (score === 3 || score === 4) return { score: 3, label: 'Good', color: 'bg-blue-500', text: 'text-blue-600' };
    return { score: 4, label: 'Strong', color: 'bg-emerald-500', text: 'text-emerald-600' };
  };

  const strength = calculatePasswordStrength(view === 'reset_password' ? newPassword : password);

  // Handlers
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    if (!email || !password) {
      setError('Please provide your email address and password.');
      return;
    }

    setLoading(true);
    try {
      await login(email.trim().toLowerCase(), password);
    } catch (err: any) {
      const msg = err.message || 'Login failed';
      setError(msg);
      // If unverified, guide user to verification screen
      if (msg.toLowerCase().includes('verify your email')) {
        setPendingVerificationEmail(email.trim().toLowerCase());
        setView('check_inbox');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }

    setLoading(true);
    try {
      const res = await register(fullName.trim(), email.trim().toLowerCase(), password);
      setLastGeneratedVerifyLink(res.verificationLink);
      setResendCooldown(60);
      setView('check_inbox');
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (resendCooldown > 0) return;
    setError(null);
    setLoading(true);
    try {
      const res = await resendVerification(email.trim().toLowerCase());
      setLastGeneratedVerifyLink(res.verificationLink);
      setResendCooldown(res.cooldownSeconds || 60);
      setSuccessMessage('A fresh verification email has been dispatched.');
    } catch (err: any) {
      setError(err.message || 'Failed to resend verification email.');
    } finally {
      setLoading(false);
    }
  };

  const handleDirectVerifyClick = async (linkOrToken?: string) => {
    setError(null);
    setLoading(true);
    try {
      let tokenToUse = linkOrToken;
      if (linkOrToken && linkOrToken.includes('token=')) {
        const url = new URL(linkOrToken);
        tokenToUse = url.searchParams.get('token') || '';
      }
      if (!tokenToUse && lastGeneratedVerifyLink) {
        const url = new URL(lastGeneratedVerifyLink);
        tokenToUse = url.searchParams.get('token') || '';
      }
      if (!tokenToUse) {
        throw new Error('Verification token not found. Please click resend.');
      }
      await verifyToken(tokenToUse);
    } catch (err: any) {
      setError(err.message || 'Verification failed. Link may be expired.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    if (!email) {
      setError('Please enter your account email.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.forgotPassword(email.trim().toLowerCase());
      setResetGeneratedLink(res.resetLink);
      setSuccessMessage('Password reset link generated. Check your inbox or click below to proceed.');
    } catch (err: any) {
      setError(err.message || 'Failed to initiate password reset.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setError('New passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await api.resetPassword(resetToken, newPassword);
      setSuccessMessage('Password successfully changed! You may now log in with your new password.');
      setResetTokenParam(null);
      setPassword('');
      setTimeout(() => {
        setView('login');
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to reset password. The token may be expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F7FD] flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200/80 p-8 relative overflow-hidden">
        {/* Brand Accent Bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500" />

        {/* Logo & Subtitle */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 mb-2">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold shadow-md shadow-blue-500/20 text-lg">
              N
            </div>
            <span className="font-extrabold text-2xl tracking-tight text-[#1B2A4A]">Nexus-M2E</span>
          </div>
          <p className="text-xs text-slate-500 font-medium">Voice-first, Privacy-safe Meeting-to-Execution</p>
        </div>

        {/* Global Error Notice */}
        {error && (
          <div className="mb-4 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2 animate-fadeIn">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{error}</span>
          </div>
        )}

        {/* Global Success Notice */}
        {successMessage && (
          <div className="mb-4 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
            <span className="leading-relaxed">{successMessage}</span>
          </div>
        )}

        {/* VIEW 1: CHECK YOUR INBOX SCREEN */}
        {view === 'check_inbox' && (
          <div className="space-y-5 text-center">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 mx-auto flex items-center justify-center shadow-inner">
              <Mail className="w-8 h-8" />
            </div>

            <div>
              <h2 className="text-xl font-bold text-[#1B2A4A]">Check your inbox</h2>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                We sent a verification link to <br />
                <span className="font-semibold text-blue-700 text-sm">{email || 'your email'}</span>
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs text-left flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-semibold">Email verification is required</span>
                <p className="text-[11px] text-amber-800">
                  Unverified users are blocked from workspace data to ensure role-based privacy and secure team attribution.
                </p>
              </div>
            </div>

            {/* Test Inspector / One-tap verification button for preview environment */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-left space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  Applet Verification Link
                </span>
                <span className="text-[10px] text-emerald-600 bg-emerald-50 font-semibold px-2 py-0.5 rounded border border-emerald-200">
                  Valid 24h
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                In this preview container, click below to verify immediately and sign in:
              </p>
              <button
                type="button"
                onClick={() => handleDirectVerifyClick()}
                disabled={loading}
                className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 shadow-sm cursor-pointer disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Verify & Complete Onboarding</span>
              </button>
            </div>

            {/* Resend button with visible cooldown */}
            <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
              <button
                type="button"
                onClick={handleResendVerification}
                disabled={loading || resendCooldown > 0}
                className="w-full py-2.5 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                {resendCooldown > 0 ? (
                  <span>Resend verification email ({resendCooldown}s)</span>
                ) : (
                  <span>Resend verification email</span>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setPendingVerificationEmail(null);
                  setView('login');
                }}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium py-1"
              >
                Back to Login
              </button>
            </div>
          </div>
        )}

        {/* VIEW 2: LOGIN */}
        {view === 'login' && (
          <div>
            <div className="flex border-b border-slate-200 mb-6">
              <button
                className="flex-1 pb-3 font-semibold text-sm border-b-2 border-blue-600 text-blue-600 text-center"
              >
                Sign In
              </button>
              <button
                onClick={() => {
                  setError(null);
                  setView('register');
                }}
                className="flex-1 pb-3 font-medium text-sm border-b-2 border-transparent text-slate-400 hover:text-slate-600 text-center cursor-pointer"
              >
                Create Account
              </button>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="alex@nexus.corp"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-700">Password</label>
                  <button
                    type="button"
                    onClick={() => {
                      setError(null);
                      setView('forgot_password');
                    }}
                    className="text-[11px] text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 bg-[#2563EB] hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Authenticating...
                  </span>
                ) : (
                  <>
                    <span>Sign In to Workspace</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* VIEW 3: REGISTER */}
        {view === 'register' && (
          <div>
            <div className="flex border-b border-slate-200 mb-6">
              <button
                onClick={() => {
                  setError(null);
                  setView('login');
                }}
                className="flex-1 pb-3 font-medium text-sm border-b-2 border-transparent text-slate-400 hover:text-slate-600 text-center cursor-pointer"
              >
                Sign In
              </button>
              <button
                className="flex-1 pb-3 font-semibold text-sm border-b-2 border-blue-600 text-blue-600 text-center"
              >
                Create Account
              </button>
            </div>

            <form onSubmit={handleRegister} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Alex Rivera"
                    className="w-full pl-10 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Work Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="alex@nexus.corp"
                    className="w-full pl-10 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Password (Min 8 chars)</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create a strong password"
                    className="w-full pl-10 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Password Strength Indicator */}
                {password.length > 0 && (
                  <div className="mt-2 space-y-1">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-slate-500">Password strength:</span>
                      <span className={`font-semibold ${strength.text}`}>{strength.label}</span>
                    </div>
                    <div className="grid grid-cols-4 gap-1.5 h-1.5 w-full">
                      {[1, 2, 3, 4].map((step) => (
                        <div
                          key={step}
                          className={`rounded-full h-full transition-all ${
                            strength.score >= step ? strength.color : 'bg-slate-200'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Confirm Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat your password"
                    className="w-full pl-10 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 bg-[#2563EB] hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Creating account...
                  </span>
                ) : (
                  <>
                    <span>Sign Up & Verify Email</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* VIEW 4: FORGOT PASSWORD */}
        {view === 'forgot_password' && (
          <div className="space-y-4">
            <button
              onClick={() => {
                setError(null);
                setView('login');
              }}
              className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800"
            >
              <ChevronLeft className="w-4 h-4" />
              Back to Login
            </button>

            <div>
              <h2 className="text-lg font-bold text-[#1B2A4A]">Reset Password</h2>
              <p className="text-xs text-slate-500 mt-1">
                Enter your account email and we'll send a secure password reset link.
              </p>
            </div>

            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="alex@nexus.corp"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-[#2563EB] hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {loading ? 'Sending...' : 'Send Reset Instructions'}
              </button>
            </form>

            {resetGeneratedLink && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs space-y-2">
                <span className="font-semibold text-blue-900">Reset Link Ready (Preview Simulator):</span>
                <button
                  type="button"
                  onClick={() => {
                    const url = new URL(resetGeneratedLink);
                    setResetToken(url.searchParams.get('token') || '');
                    setView('reset_password');
                  }}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium flex items-center justify-center gap-1.5"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Open Password Reset Form</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* VIEW 5: RESET PASSWORD */}
        {view === 'reset_password' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-bold text-[#1B2A4A]">Set New Password</h2>
              <p className="text-xs text-slate-500 mt-1">
                Enter your reset token and your new secure password.
              </p>
            </div>

            <form onSubmit={handleResetPassword} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Reset Token</label>
                <input
                  type="text"
                  required
                  value={resetToken}
                  onChange={(e) => setResetToken(e.target.value)}
                  placeholder="Paste token or link token"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">New Password (Min 8 chars)</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="New strong password"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Confirm New Password</label>
                <input
                  type="password"
                  required
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  placeholder="Repeat new password"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {loading ? 'Updating Password...' : 'Save New Password & Continue'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
