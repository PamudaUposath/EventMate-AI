import React from 'react';

interface ProgressBarProps {
  percentage: number;
  readinessLevel?: string;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  percentage,
  readinessLevel,
  showLabel = true,
  size = 'md',
}) => {
  const clamped = Math.max(0, Math.min(100, Math.round(percentage)));

  const getColor = () => {
    if (clamped >= 80) return 'from-emerald-500 to-teal-400';
    if (clamped >= 50) return 'from-brand-500 to-indigo-500';
    if (clamped >= 25) return 'from-amber-500 to-orange-400';
    return 'from-rose-500 to-pink-500';
  };

  const getHeight = () => {
    if (size === 'sm') return 'h-1.5';
    if (size === 'lg') return 'h-3.5';
    return 'h-2.5';
  };

  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex justify-between items-center text-xs mb-1.5">
          <span className="text-slate-400 font-medium">
            {readinessLevel ? `Readiness: ${readinessLevel}` : 'Event Readiness'}
          </span>
          <span className="font-semibold text-white">{clamped}%</span>
        </div>
      )}
      <div className={`w-full bg-slate-800/80 rounded-full overflow-hidden ${getHeight()}`}>
        <div
          className={`h-full bg-gradient-to-r ${getColor()} rounded-full transition-all duration-500 ease-out`}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
};
