import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Sparkles, ArrowRight, Layers, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const authSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type AuthFormData = z.infer<typeof authSchema>;

export const AuthPage: React.FC<{ defaultMode?: 'signin' | 'signup' }> = ({ defaultMode = 'signin' }) => {
  const [isSignUp, setIsSignUp] = useState(defaultMode === 'signup');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const { signIn, signUp, signInAsDemo } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AuthFormData>({
    resolver: zodResolver(authSchema),
  });

  const onSubmit = async (data: AuthFormData) => {
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      if (isSignUp) {
        signUp(data.email);
        setSuccessMessage('Account created! Navigating to your dashboard...');
      } else {
        signIn(data.email);
        setSuccessMessage('Signed in successfully!');
      }
      setTimeout(() => {
        navigate('/dashboard');
      }, 700);
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication failed. Please verify your details.');
    }
  };

  const handleDemoLogin = () => {
    signInAsDemo();
    navigate('/events/evt_demo_aws_workshop');
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        {/* Brand header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center mx-auto shadow-lg shadow-brand-500/20">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            {isSignUp ? 'Create your EventMate account' : 'Welcome back to EventMate'}
          </h2>
          <p className="text-xs text-slate-400">
            {isSignUp
              ? 'Start planning student & community events with your AI co-organiser'
              : 'Sign in to access your event checklists, budgets, and Plan Rescue'}
          </p>
        </div>

        {/* Quick Demo Organiser button for challenge evaluators */}
        <div className="p-3.5 rounded-xl bg-slate-900/90 border border-brand-500/30 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-white flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              Evaluating the challenge?
            </p>
            <p className="text-[11px] text-slate-400">
              Instant access without registration
            </p>
          </div>
          <button
            type="button"
            onClick={handleDemoLogin}
            className="px-3.5 py-1.5 text-xs font-semibold text-brand-300 bg-brand-500/10 hover:bg-brand-500/20 border border-brand-500/30 rounded-lg transition-colors flex items-center gap-1"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Launch Demo</span>
          </button>
        </div>

        {/* Auth Card */}
        <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-slate-800 space-y-5">
          {errorMessage && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-sm">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Email Address
              </label>
              <input
                type="email"
                {...register('email')}
                placeholder="organiser@university.edu"
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition-colors"
              />
              {errors.email && (
                <p className="text-xs text-rose-400 mt-1">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Password
              </label>
              <input
                type="password"
                {...register('password')}
                placeholder="At least 8 characters"
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition-colors"
              />
              {errors.password && (
                <p className="text-xs text-rose-400 mt-1">{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 shadow-lg shadow-brand-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span>{isSignUp ? 'Create Account' : 'Sign In'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="pt-3 border-t border-slate-800 text-center">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setErrorMessage(null);
              }}
              className="text-xs text-slate-400 hover:text-brand-400 transition-colors"
            >
              {isSignUp
                ? 'Already have an account? Sign in here'
                : "Don't have an account yet? Create one"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
