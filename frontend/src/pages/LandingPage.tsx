import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Sparkles,
  ArrowRight,
  LifeBuoy,
  Layers,
  Cpu,
  CalendarCheck,
  CheckCircle2,
  Clock,
  Shield,
  Zap,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { DEMO_EVENT } from '../services/demoData';

export const LandingPage: React.FC = () => {
  const { signInAsDemo } = useAuth();
  const navigate = useNavigate();

  const handleExploreDemo = () => {
    signInAsDemo();
    navigate(`/events/${DEMO_EVENT.eventId}`);
  };

  return (
    <div className="space-y-24 pb-20">
      {/* HERO SECTION */}
      <section className="relative pt-20 pb-16 overflow-hidden">
        {/* Glow ambient background circles */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-brand-600/15 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute top-1/3 right-1/4 w-[350px] h-[300px] bg-accent-purple/15 blur-[100px] rounded-full pointer-events-none" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 space-y-6">
          <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight leading-[1.15]">
            Plan Better Events. <br />
            <span className="bg-gradient-to-r from-brand-400 via-indigo-300 to-accent-purple bg-clip-text text-transparent">
              Stress Less.
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-300 font-normal leading-relaxed">
            Meet your AI co-organiser. Turn event ideas into actionable plans, manage preparation tasks, and handle unexpected changes with confidence.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-4">
            <Link
              to="/signup"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-semibold text-white bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 shadow-xl shadow-brand-600/25 hover:shadow-brand-600/40 transition-all flex items-center justify-center gap-2 group"
            >
              <span>Plan Your First Event</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>

            <button
              onClick={handleExploreDemo}
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl font-semibold text-slate-200 hover:text-white bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 hover:border-slate-600 backdrop-blur-md transition-all flex items-center justify-center gap-2"
            >
              <Layers className="w-4 h-4 text-brand-400" />
              <span>Explore Demo</span>
              <span className="text-[11px] px-2 py-0.5 rounded-md bg-brand-500/20 text-brand-300 border border-brand-500/30">
                Live Sample
              </span>
            </button>
          </div>

          {/* Value Badges */}
          <div className="pt-8 flex flex-wrap justify-center items-center gap-6 text-xs text-slate-400">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>No complex setup</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Real Amazon Bedrock Nova Lite tools</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Signature Plan Rescue workflow</span>
            </div>
          </div>
        </div>
      </section>

      {/* SIGNATURE FEATURE SPOTLIGHT: PLAN RESCUE */}
      <section id="plan-rescue" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl overflow-hidden border border-rose-500/30 bg-gradient-to-br from-navy-900 via-navy-950 to-rose-950/30 p-8 sm:p-12 shadow-2xl">
          <div className="absolute top-0 right-0 w-80 h-80 bg-rose-500/10 blur-[100px] pointer-events-none" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold">
                <LifeBuoy className="w-3.5 h-3.5" />
                <span>Signature Feature</span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                Plan Rescue: When the Unexpected Strikes, Stay Calm.
              </h2>

              <p className="text-slate-300 text-sm leading-relaxed">
                A speaker cancels the night before? Venue suddenly double-booked? Budget slashed mid-planning? 
                Instead of scrambling or rebuilding from scratch, EventMate AI analyzes your event dependencies and produces calm, practical pivot options.
              </p>

              <div className="space-y-2.5 pt-2">
                <div className="flex items-start gap-2.5 text-xs text-slate-300">
                  <div className="w-5 h-5 rounded-md bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0 mt-0.5 font-bold">1</div>
                  <span><strong>Instant Dependency Triage:</strong> Identifies which preparation tasks are directly affected.</span>
                </div>
                <div className="flex items-start gap-2.5 text-xs text-slate-300">
                  <div className="w-5 h-5 rounded-md bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0 mt-0.5 font-bold">2</div>
                  <span><strong>3 Calm Approaches:</strong> Practical solutions with explicit tradeoffs tailored to your deadline.</span>
                </div>
                <div className="flex items-start gap-2.5 text-xs text-slate-300">
                  <div className="w-5 h-5 rounded-md bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0 mt-0.5 font-bold">3</div>
                  <span><strong>Visual Change Preview:</strong> See added, updated, and unchanged tasks before you confirm.</span>
                </div>
              </div>

              <div className="pt-3">
                <button
                  onClick={handleExploreDemo}
                  className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 transition-colors flex items-center gap-2 shadow-lg shadow-rose-600/20"
                >
                  <LifeBuoy className="w-4 h-4" />
                  <span>Try Plan Rescue in Demo</span>
                </button>
              </div>
            </div>

            {/* Visual simulation card */}
            <div className="lg:col-span-5 bg-navy-950/80 border border-slate-700/80 rounded-2xl p-5 shadow-xl space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 text-xs">
                <span className="text-slate-400 font-mono">Rescue Proposal Preview</span>
                <span className="text-emerald-400 font-medium">Pending Approval</span>
              </div>

              <div className="p-3 rounded-lg bg-rose-950/30 border border-rose-500/20 text-xs text-rose-200">
                <p className="font-semibold mb-1">Speaker Cancelled 24h Before Workshop</p>
                <p className="text-[11px] text-slate-300">Pivot: Convert keynote into a guided practical lab with student leads.</p>
              </div>

              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between p-2 rounded bg-emerald-950/20 border border-emerald-500/20 text-emerald-300">
                  <span>+ Prepare Step-by-Step Lab Guides</span>
                  <span className="text-[10px] uppercase font-bold text-emerald-400">Added</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-amber-950/20 border border-amber-500/20 text-amber-300">
                  <span>↻ Assign Internal Lab Mentors</span>
                  <span className="text-[10px] uppercase font-bold text-amber-400">Updated</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-slate-900 border border-slate-800 text-slate-400">
                  <span>• Reserve Lab Facility (100 PCs)</span>
                  <span className="text-[10px] uppercase text-slate-500">Unchanged</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CORE CAPABILITIES */}
      <section id="features" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Built For Organisers Who Want Real Results
          </h2>
          <p className="text-sm text-slate-400 max-w-xl mx-auto">
            Not a toy chatbot. EventMate AI utilizes genuine AWS Bedrock Converse tools to update and manage your actual DynamoDB checklist.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-panel-hover p-6 rounded-2xl space-y-3">
            <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/30 flex items-center justify-center text-brand-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Natural Language Planning</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Describe your event in one sentence. EventMate understands participants, budget, duration, and generates customized milestone checklists.
            </p>
          </div>

          <div className="glass-panel-hover p-6 rounded-2xl space-y-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <CalendarCheck className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Live DynamoDB Task Board</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Real tasks with categories, priorities, deadlines, and ownership checks. Inline updates instantly recalculate your true preparation readiness score.
            </p>
          </div>

          <div className="glass-panel-hover p-6 rounded-2xl space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Cpu className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Amazon Bedrock Converse Tools</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Powered by Amazon Nova Lite model (<code className="text-emerald-300">amazon.nova-lite-v1:0</code>). The agent retrieves live state and executes actual backend tools.
            </p>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            How EventMate AI Works
          </h2>
          <p className="text-sm text-slate-400">
            From initial idea to successful event day in three simple steps.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
            <span className="text-2xl font-extrabold text-brand-400 font-mono">01</span>
            <h3 className="text-base font-bold text-white">Tell EventMate Your Idea</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Share your event name, expected attendees, budget, and date. EventMate structures your initial assumptions without exhausting questions.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
            <span className="text-2xl font-extrabold text-indigo-400 font-mono">02</span>
            <h3 className="text-base font-bold text-white">Co-Organise Your Checklist</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Track deadlines, assign leads, and ask your AI assistant: "What should I work on next?" for high-priority task triage.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
            <span className="text-2xl font-extrabold text-rose-400 font-mono">03</span>
            <h3 className="text-base font-bold text-white">Rescue Any Disruption</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              When life happens, trigger Plan Rescue. Preview adjustments and apply changes safely with full co-organiser confidence.
            </p>
          </div>
        </div>
      </section>

      {/* BOTTOM CTA */}
      <section className="max-w-4xl mx-auto px-4 text-center space-y-6 pt-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
          Ready to experience stress-free event planning?
        </h2>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/signup"
            className="w-full sm:w-auto px-8 py-3 rounded-xl font-semibold text-white bg-brand-600 hover:bg-brand-500 shadow-lg shadow-brand-600/25 transition-all"
          >
            Create Your Account
          </Link>
          <button
            onClick={handleExploreDemo}
            className="w-full sm:w-auto px-7 py-3 rounded-xl font-semibold text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 transition-all"
          >
            Open Interactive Demo
          </button>
        </div>
      </section>
    </div>
  );
};
