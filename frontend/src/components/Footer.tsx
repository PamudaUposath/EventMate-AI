import React from 'react';
import { Sparkles } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-slate-800/80 bg-navy-950/90 text-slate-400 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex flex-col items-center md:items-start space-y-2">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-lg bg-brand-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="text-white font-bold tracking-tight text-base">EventMate AI</span>
          </div>
          <p className="text-xs text-slate-500 text-center md:text-left">
            "Your AI Co-Organiser, From Idea to Event Day."
          </p>
        </div>

        <div className="text-xs text-slate-500 flex items-center gap-1">
          Crafted with care for student & community organisers
        </div>
      </div>
    </footer>
  );
};
