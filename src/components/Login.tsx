import React, { useState } from 'react';
import { User, Lock, LogIn, AlertCircle, Info, Loader2 } from 'lucide-react';
import { AppSettings } from '../types';
import { signIn, signOutUser } from '../lib/dataClient';

interface LoginProps {
  settings: AppSettings;
  onLoginSuccess: (user: any) => void;
}

export default function Login({ settings, onLoginSuccess }: LoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const identifier = username.trim();
    if (!identifier) {
      setError('Username or Email is required. / ইউজারনেম বা ইমেল প্রয়োজন।');
      return;
    }
    if (!password.trim()) {
      setError('Password is required. / পাসওয়ার্ড প্রয়োজন।');
      return;
    }

    try {
      setLoading(true);
      // identifier can be an email or a username -- the backend resolves either
      const { user } = await signIn(identifier, password);

      if (user.status && user.status !== 'Active') {
        setError('This account is currently inactive. Please contact support. / এই অ্যাকাউন্টটি নিষ্ক্রিয় করা আছে। অনুগ্রহ করে এডমিনের সাথে যোগাযোগ করুন।');
        await signOutUser();
        return;
      }

      onLoginSuccess(user);
    } catch (err: any) {
      console.error("Auth login error:", err);
      let errMsg = 'Login failed. Please try again. / লগইন করতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।';
      if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        errMsg = 'Incorrect password or invalid credentials. / ভুল পাসওয়ার্ড বা তথ্য প্রদান করা হয়েছে। অনুগ্রহ করে পুনরায় পরীক্ষা করুন।';
      } else if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-email') {
        errMsg = 'No registered account found with this email or username. / এই তথ্য দিয়ে কোনো অ্যাকাউন্ট খুঁজে পাওয়া যায়নি।';
      } else if (err.code === 'auth/network-request-failed') {
        errMsg = 'Network error. Please check your internet connection. / নেটওয়ার্ক ত্রুটি। অনুগ্রহ করে আপনার ইন্টারনেট সংযোগটি পরীক্ষা করুন।';
      } else if (err.code === 'auth/user-disabled') {
        errMsg = 'This account is currently inactive. Please contact support. / এই অ্যাকাউন্টটি নিষ্ক্রিয়।';
      }
      setError(errMsg);
      alert(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="login-container" className="h-screen w-screen flex flex-col items-center justify-center bg-[#243042] text-slate-700 font-sans p-4 relative overflow-y-auto">
      <div id="login-card" className="bg-white rounded-2xl p-8 md:p-10 shadow-2xl w-full max-w-[420px] border border-slate-100 flex flex-col gap-6 relative z-10 my-auto">
        
        {/* Logo and Tagline matching screenshot */}
        <div id="login-logo-container" className="flex flex-col items-center justify-center text-center">
          <div className="flex items-center font-display tracking-wider text-[#334155] text-4xl font-extrabold select-none mb-1">
            <span className="font-light text-indigo-900">N</span>
            <span className="relative text-blue-600 font-black">
              E
              <span className="absolute top-[35%] left-[34%] text-indigo-500 text-[10px] select-none animate-pulse">✦</span>
            </span>
            <span className="font-extrabold tracking-tight text-[#334155]">XOVA</span>
          </div>
          <p id="login-tagline" className="text-[#3b82f6] text-xs font-semibold tracking-wider font-sans uppercase">
            Elevate your business logic.
          </p>
        </div>

        {/* Login form */}
        <form id="login-form" onSubmit={handleSubmit} className="flex flex-col gap-5">
          {error && (
            <div id="login-error-alert" className="flex items-center gap-2 bg-rose-50 border border-rose-200 text-rose-700 text-xs px-3.5 py-3 rounded-lg font-medium animate-shake">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
              <span className="leading-normal">{error}</span>
            </div>
          )}

          {/* Username or Email Input Field */}
          <div id="username-field-group" className="flex flex-col gap-1.5">
            <label id="username-label" className="text-xs font-bold text-slate-700 font-sans uppercase tracking-wide">
              Username or Email / ইউজারনেম বা ইমেইল
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <User className="h-4 w-4" />
              </div>
              <input
                id="username-input"
                type="text"
                disabled={loading}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username or email"
                className="w-full pl-10 pr-4 py-2.5 bg-white text-slate-800 text-sm border border-slate-200 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 outline-none transition-all placeholder:text-slate-400 font-medium disabled:opacity-60"
              />
            </div>
          </div>

          {/* Password Input Field */}
          <div id="password-field-group" className="flex flex-col gap-1.5">
            <label id="password-label" className="text-xs font-bold text-slate-700 font-sans uppercase tracking-wide">
              Password / পাসওয়ার্ড
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="h-4 w-4" />
              </div>
              <input
                id="password-input"
                type="password"
                disabled={loading}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full pl-10 pr-4 py-2.5 bg-white text-slate-800 text-sm border border-slate-200 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 outline-none transition-all placeholder:text-slate-400 font-medium disabled:opacity-60"
              />
            </div>
          </div>

          {/* Sign In button */}
          <button
            id="signin-submit-btn"
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-[#3b82f6] hover:bg-blue-600 active:bg-blue-700 text-white font-bold text-sm rounded-lg transition-colors cursor-pointer shadow-md shadow-blue-500/10 hover:shadow-lg focus:ring-2 focus:ring-blue-500/30 outline-none mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Signing In... / লগইন হচ্ছে...</span>
              </>
            ) : (
              <>
                <LogIn className="h-4 w-4" />
                <span>Sign In / লগইন করুন</span>
              </>
            )}
          </button>
        </form>

        {/* Copyright notice matching screenshot */}
        <p id="login-copyright" className="text-slate-400 text-[11px] font-medium text-center font-sans tracking-tight">
          © 2026 Nexova ERP Solution. All rights reserved.
        </p>
      </div>
    </div>
  );
}
