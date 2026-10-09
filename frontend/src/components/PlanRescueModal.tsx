import React, { useState } from 'react';
import {
  LifeBuoy,
  X,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Plus,
  RefreshCw,
  Minus,
  Check,
} from 'lucide-react';
import { RescueProposal, TaskItem } from '../types';
import { api } from '../services/api';

interface PlanRescueModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
  onPlanApplied: (updatedTasks: TaskItem[]) => void;
  initialProblem?: string;
}

export const PlanRescueModal: React.FC<PlanRescueModalProps> = ({
  isOpen,
  onClose,
  eventId,
  onPlanApplied,
  initialProblem = '',
}) => {
  const [problemDescription, setProblemDescription] = useState(initialProblem);
  const [isGenerating, setIsGenerating] = useState(false);
  const [proposal, setProposal] = useState<RescueProposal | null>(null);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number>(0);
  const [isApplying, setIsApplying] = useState(false);
  const [appliedSuccessMsg, setAppliedSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  React.useEffect(() => {
    if (initialProblem) {
      setProblemDescription(initialProblem);
    }
  }, [initialProblem]);

  if (!isOpen) return null;

  const quickScenarios = [
    'Our main speaker just cancelled, and the workshop is tomorrow.',
    'The university venue hall is unavailable due to maintenance.',
    'Our budget was reduced by 30% from the sponsor.',
    'Expected participant registrations exceeded room capacity by 40.',
  ];

  const handleGenerateRescue = async (customProblem?: string) => {
    const textToSubmit = customProblem || problemDescription;
    if (!textToSubmit.trim()) return;

    setIsGenerating(true);
    setErrorMsg(null);
    setAppliedSuccessMsg(null);

    try {
      const generatedProposal = await api.proposeRescue(eventId, textToSubmit);
      setProposal(generatedProposal);
      // Auto-select recommended option
      const recIdx = generatedProposal.options.findIndex((o) => o.isRecommended);
      setSelectedOptionIndex(recIdx !== -1 ? recIdx : 0);
    } catch (err: any) {
      setErrorMsg(err.message || 'Unable to generate rescue proposal at this time.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApplyChanges = async () => {
    if (!proposal) return;
    setIsApplying(true);
    setErrorMsg(null);

    try {
      const result = await api.applyRescue(eventId, proposal.proposalId);
      setAppliedSuccessMsg(result.message);
      onPlanApplied(result.tasks);
      setTimeout(() => {
        onClose();
        setProposal(null);
        setAppliedSuccessMsg(null);
      }, 2200);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to apply rescue changes.');
    } finally {
      setIsApplying(false);
    }
  };

  const handleReset = () => {
    setProposal(null);
    setProblemDescription('');
    setAppliedSuccessMsg(null);
    setErrorMsg(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-navy-950/85 backdrop-blur-md overflow-y-auto">
      <div className="bg-navy-900 border border-slate-700/80 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden my-8 relative">
        {/* Header with Rescue Banner */}
        <div className="bg-gradient-to-r from-rose-950/70 via-navy-900 to-indigo-950/70 border-b border-rose-500/20 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 rescue-glow">
              <LifeBuoy className="w-5 h-5 text-rose-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Plan Rescue <span className="text-xs px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 font-medium">AI Crisis Resolution</span>
              </h2>
              <p className="text-xs text-slate-400">
                Calm, adaptive pivots for last-minute event disruptions
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {appliedSuccessMsg && (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm flex items-center gap-3 animate-fadeIn">
              <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
              <div>
                <p className="font-semibold text-emerald-200">{appliedSuccessMsg}</p>
                <p className="text-xs text-emerald-400/80 mt-0.5">
                  Your event plan and task checklist have been updated in the database.
                </p>
              </div>
            </div>
          )}

          {!proposal ? (
            /* STEP 1: Describe the unexpected problem */
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-200 mb-1.5">
                  What unexpected change or problem occurred?
                </label>
                <p className="text-xs text-slate-400 mb-2">
                  Describe what went wrong in plain English. EventMate AI will assess your current plan and recommend calm, practical solutions.
                </p>
                <textarea
                  value={problemDescription}
                  onChange={(e) => setProblemDescription(e.target.value)}
                  rows={3}
                  placeholder="e.g. Our main speaker just cancelled, and the workshop is tomorrow..."
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl p-3.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-rose-400 transition-colors resize-none"
                />
              </div>

              {/* Quick Prompt Presets */}
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                  Quick Scenarios
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {quickScenarios.map((sc, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setProblemDescription(sc);
                        handleGenerateRescue(sc);
                      }}
                      className="text-left text-xs p-2.5 rounded-lg bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-slate-600 text-slate-300 transition-colors flex items-center justify-between group"
                    >
                      <span className="line-clamp-2">{sc}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-rose-400 shrink-0 ml-1.5" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => handleGenerateRescue()}
                  disabled={isGenerating || !problemDescription.trim()}
                  className="px-6 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 rounded-xl shadow-lg shadow-rose-600/20 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Analyzing Affected Plan...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Generate Rescue Options
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            /* STEP 2: Review Options & Interactive Change Preview */
            <div className="space-y-6">
              {/* Calm AI Reassurance Banner */}
              <div className="p-4 rounded-xl bg-indigo-950/40 border border-indigo-500/20 flex items-start gap-3.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0 mt-0.5">
                  <ShieldCheck className="w-5 h-5 text-indigo-400" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-semibold text-indigo-200">
                    No panic. Let's work through this.
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {proposal.explanation}
                  </p>
                </div>
              </div>

              {/* Solution Options Selector */}
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">
                  Select A Resolution Strategy:
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {proposal.options.map((option, idx) => (
                    <div
                      key={option.optionId}
                      onClick={() => setSelectedOptionIndex(idx)}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                        selectedOptionIndex === idx
                          ? 'bg-rose-950/20 border-rose-500 shadow-md shadow-rose-500/10'
                          : 'bg-slate-800/40 border-slate-700/60 hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-bold text-white flex items-center gap-1.5">
                          {option.title}
                        </span>
                        {option.isRecommended && (
                          <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            Recommended
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed mb-2">
                        {option.description}
                      </p>
                      {option.recommendationReason && (
                        <p className="text-[11px] text-slate-400 italic">
                          Why: {option.recommendationReason}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Immediate Next Actions */}
              {proposal.immediateNextActions.length > 0 && (
                <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/60">
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2">
                    Immediate Co-Organiser Recommendations:
                  </span>
                  <ul className="space-y-1.5 text-xs text-slate-300">
                    {proposal.immediateNextActions.map((action, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 text-brand-400 shrink-0 mt-0.5" />
                        <span>{action}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* INTERACTIVE CHANGE PREVIEW */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Change Preview (Database Operations)
                  </h4>
                  <div className="flex items-center gap-2 text-[11px]">
                    <span className="flex items-center gap-1 text-emerald-400">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Added
                    </span>
                    <span className="flex items-center gap-1 text-amber-400">
                      <span className="w-2 h-2 rounded-full bg-amber-500"></span> Updated
                    </span>
                    <span className="flex items-center gap-1 text-slate-400">
                      <span className="w-2 h-2 rounded-full bg-slate-500"></span> Unchanged
                    </span>
                  </div>
                </div>

                <div className="space-y-2 border border-slate-800 rounded-xl p-3 bg-slate-900/60 max-h-56 overflow-y-auto">
                  {proposal.proposedTaskChanges.map((change, idx) => {
                    if (change.changeType === 'add') {
                      return (
                        <div
                          key={idx}
                          className="p-2.5 rounded-lg bg-emerald-950/20 border border-emerald-500/30 flex items-start gap-2.5 text-xs"
                        >
                          <div className="w-5 h-5 rounded bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
                            <Plus className="w-3 h-3" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-emerald-200">{change.title}</span>
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                                NEW TASK
                              </span>
                            </div>
                            {change.description && (
                              <p className="text-slate-300 text-[11px] mt-0.5">{change.description}</p>
                            )}
                            {change.reason && (
                              <p className="text-emerald-400/80 text-[10px] mt-0.5 italic">{change.reason}</p>
                            )}
                          </div>
                        </div>
                      );
                    }
                    if (change.changeType === 'update') {
                      return (
                        <div
                          key={idx}
                          className="p-2.5 rounded-lg bg-amber-950/20 border border-amber-500/30 flex items-start gap-2.5 text-xs"
                        >
                          <div className="w-5 h-5 rounded bg-amber-500/20 flex items-center justify-center text-amber-400 shrink-0 mt-0.5">
                            <RefreshCw className="w-3 h-3" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-amber-200">{change.title}</span>
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300">
                                UPDATING EXISTING
                              </span>
                            </div>
                            {change.description && (
                              <p className="text-slate-300 text-[11px] mt-0.5">{change.description}</p>
                            )}
                            {change.reason && (
                              <p className="text-amber-400/80 text-[10px] mt-0.5 italic">{change.reason}</p>
                            )}
                          </div>
                        </div>
                      );
                    }
                    return (
                      <div
                        key={idx}
                        className="p-2 rounded-lg bg-slate-800/30 border border-slate-800 flex items-center justify-between text-xs text-slate-400"
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-600"></span>
                          <span className="truncate max-w-md">{change.title}</span>
                        </div>
                        <span className="text-[10px] text-slate-500 uppercase">Unchanged</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white transition-colors"
                >
                  ← Modify Problem Description
                </button>
                <div className="flex items-center space-x-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-sm text-slate-300 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                  >
                    Keep Current Plan
                  </button>
                  <button
                    type="button"
                    onClick={handleApplyChanges}
                    disabled={isApplying || proposal.approvalStatus === 'approved'}
                    className="px-6 py-2 text-sm font-semibold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 rounded-xl shadow-lg shadow-emerald-600/20 transition-all flex items-center gap-2 disabled:opacity-50"
                  >
                    {isApplying ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Applying to Database...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        Apply Changes
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
