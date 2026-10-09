import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Sparkles, Menu, X, LogOut, PlusCircle, ShieldAlert, Layers } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export const Navbar: React.FC = () => {
  const { user, isDemo, signOut, signInAsDemo } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleDemoClick = () => {
    signInAsDemo();
    navigate('/events/evt_demo_aws_workshop');
  };

  const handleSectionClick = (sectionId: string) => {
    setMobileMenuOpen(false);
    if (location.pathname === '/') {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
        window.history.replaceState(null, '', `/#${sectionId}`);
      }
    } else {
      navigate(`/#${sectionId}`);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-navy-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center space-x-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 via-indigo-600 to-accent-purple flex items-center justify-center shadow-lg shadow-brand-500/20 group-hover:scale-105 transition-transform">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-lg font-bold text-white tracking-tight flex items-center gap-1.5">
              EventMate <span className="text-brand-400 font-extrabold text-sm uppercase px-1.5 py-0.5 rounded bg-brand-500/10 border border-brand-500/20">AI</span>
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-6 text-sm">
          {user && (
            <>
              <Link
                to="/dashboard"
                className={`transition-colors font-medium ${
                  location.pathname === '/dashboard' ? 'text-brand-400' : 'text-slate-300 hover:text-white'
                }`}
              >
                Dashboard
              </Link>
              <Link
                to="/events/new"
                className={`flex items-center gap-1.5 transition-colors font-medium ${
                  location.pathname === '/events/new' ? 'text-brand-400' : 'text-slate-300 hover:text-white'
                }`}
              >
                <PlusCircle className="w-4 h-4 text-brand-400" />
                New Event
              </Link>
            </>
          )}

          <a
            href="/#features"
            onClick={(e) => {
              e.preventDefault();
              handleSectionClick('features');
            }}
            className="text-slate-300 hover:text-white transition-colors"
          >
            Features
          </a>
          <a
            href="/#plan-rescue"
            onClick={(e) => {
              e.preventDefault();
              handleSectionClick('plan-rescue');
            }}
            className="text-slate-300 hover:text-white transition-colors flex items-center gap-1"
          >
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
            Plan Rescue
          </a>
          <a
            href="/#how-it-works"
            onClick={(e) => {
              e.preventDefault();
              handleSectionClick('how-it-works');
            }}
            className="text-slate-300 hover:text-white transition-colors"
          >
            How It Works
          </a>
        </nav>

        {/* Right Action Buttons */}
        <div className="hidden md:flex items-center space-x-3">
          {isDemo && (
            <div className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping"></span>
              Demo Mode Active
            </div>
          )}

          {user ? (
            <div className="flex items-center space-x-3">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-medium text-white">{user.name}</p>
                <p className="text-[11px] text-slate-400">{user.email}</p>
              </div>
              <button
                onClick={signOut}
                title="Sign out"
                className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800/60 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <>
              <button
                onClick={handleDemoClick}
                className="px-3.5 py-1.5 text-sm font-medium text-slate-300 hover:text-white border border-slate-700/80 hover:border-slate-600 rounded-lg bg-slate-900/40 hover:bg-slate-800/60 transition-all flex items-center gap-1.5"
              >
                <Layers className="w-4 h-4 text-brand-400" />
                Explore Demo
              </button>
              <Link
                to="/signin"
                className="px-4 py-1.5 text-sm font-medium text-white bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 rounded-lg shadow-md shadow-brand-600/20 transition-all"
              >
                Sign In
              </Link>
            </>
          )}
        </div>

        {/* Mobile menu trigger */}
        <div className="md:hidden flex items-center">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-slate-400 hover:text-white"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-800 bg-navy-900/95 px-4 pt-3 pb-5 space-y-3">
          {user ? (
            <>
              <div className="pb-2 border-b border-slate-800">
                <p className="text-sm font-semibold text-white">{user.name}</p>
                <p className="text-xs text-slate-400">{user.email}</p>
              </div>
              <Link
                to="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-slate-200 hover:text-brand-400 py-1"
              >
                Dashboard
              </Link>
              <Link
                to="/events/new"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-slate-200 hover:text-brand-400 py-1"
              >
                Create New Event
              </Link>
            </>
          ) : (
            <>
              <button
                onClick={() => {
                  handleDemoClick();
                  setMobileMenuOpen(false);
                }}
                className="block w-full text-left text-slate-200 hover:text-brand-400 py-1"
              >
                Explore Demo
              </button>
              <Link
                to="/signin"
                onClick={() => setMobileMenuOpen(false)}
                className="block w-full text-center py-2 text-sm font-medium text-white bg-brand-600 rounded-lg"
              >
                Sign In
              </Link>
            </>
          )}

          {/* Common sections */}
          <div className="pt-2 border-t border-slate-800/80 space-y-2">
            <a
              href="/#features"
              onClick={(e) => {
                e.preventDefault();
                handleSectionClick('features');
              }}
              className="block text-slate-300 hover:text-brand-400 py-1"
            >
              Features
            </a>
            <a
              href="/#plan-rescue"
              onClick={(e) => {
                e.preventDefault();
                handleSectionClick('plan-rescue');
              }}
              className="block text-slate-300 hover:text-rose-400 py-1 flex items-center gap-2"
            >
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
              Plan Rescue
            </a>
            <a
              href="/#how-it-works"
              onClick={(e) => {
                e.preventDefault();
                handleSectionClick('how-it-works');
              }}
              className="block text-slate-300 hover:text-brand-400 py-1"
            >
              How It Works
            </a>
          </div>

          {user && (
            <div className="pt-2 border-t border-slate-800">
              <button
                onClick={() => {
                  signOut();
                  setMobileMenuOpen(false);
                }}
                className="block w-full text-left text-rose-400 py-1"
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
