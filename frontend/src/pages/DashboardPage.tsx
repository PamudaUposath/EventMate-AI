import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Sparkles,
  PlusCircle,
  Calendar,
  MapPin,
  Users,
  AlertTriangle,
  ArrowRight,
  LifeBuoy,
  Layers,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { EventItem, TaskItem } from '../types';
import { api } from '../services/api';
import { ProgressBar } from '../components/ProgressBar';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      const fetchedEvents = await api.listEvents();
      setEvents(fetchedEvents);

      if (fetchedEvents.length > 0) {
        // Fetch tasks for the primary event to show priority triage
        const firstEventTasks = await api.listTasks(fetchedEvents[0].eventId);
        setTasks(firstEventTasks);
      }
    } catch (e) {
      console.error('Error fetching dashboard data:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const highPriorityTasks = tasks.filter(
    (t) => t.status !== 'completed' && t.priority === 'high'
  );
  const completedCount = tasks.filter((t) => t.status === 'completed').length;
  const inProgressCount = tasks.filter((t) => t.status === 'in_progress').length;
  const totalTasksCount = tasks.length;
  const overallPercentage =
    totalTasksCount > 0
      ? Math.round(((completedCount + inProgressCount * 0.5) / totalTasksCount) * 100)
      : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            Welcome back, {user?.name || 'Organiser'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Here is your event preparation overview and priority milestones.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/events/new"
            className="px-4 py-2.5 rounded-xl font-semibold text-xs sm:text-sm text-white bg-brand-600 hover:bg-brand-500 shadow-md shadow-brand-600/20 transition-all flex items-center gap-1.5"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create New Event</span>
          </Link>
        </div>
      </div>

      {isLoading ? (
        <div className="py-20 text-center space-y-3">
          <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-400">Loading your co-organiser workspace...</p>
        </div>
      ) : events.length === 0 ? (
        /* Empty State */
        <div className="text-center py-20 px-4 glass-panel rounded-3xl border border-slate-800 max-w-xl mx-auto space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-brand-600/10 border border-brand-500/20 flex items-center justify-center mx-auto text-brand-400">
            <Sparkles className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-bold text-white">No events yet</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
              Tell EventMate what you're planning, and we'll build your first complete preparation plan together.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              to="/events/new"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-xs text-white bg-brand-600 hover:bg-brand-500 transition-colors shadow-lg shadow-brand-600/20"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Plan Your First Event</span>
            </Link>
            <a
              href="/#plan-rescue"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl font-semibold text-xs text-rose-300 hover:text-white bg-rose-950/40 hover:bg-rose-900/50 border border-rose-500/30 transition-colors"
            >
              <LifeBuoy className="w-4 h-4 text-rose-400" />
              <span>Explore Plan Rescue</span>
            </a>
          </div>
        </div>
      ) : (
        <>
          {/* Top Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Active Events
              </span>
              <p className="text-2xl font-bold text-white">{events.length}</p>
              <p className="text-[11px] text-slate-500">Currently in planning</p>
            </div>

            <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Overall Readiness
              </span>
              <p className="text-2xl font-bold text-emerald-400">{overallPercentage}%</p>
              <ProgressBar percentage={overallPercentage} showLabel={false} size="sm" />
            </div>

            <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                High Priority Alerts
              </span>
              <p className="text-2xl font-bold text-rose-400">{highPriorityTasks.length}</p>
              <p className="text-[11px] text-rose-400/80">Require immediate action</p>
            </div>

            <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Tasks Completed
              </span>
              <p className="text-2xl font-bold text-brand-400">
                {completedCount} <span className="text-xs text-slate-500 font-normal">/ {totalTasksCount}</span>
              </p>
              <p className="text-[11px] text-slate-500">Milestones achieved</p>
            </div>
          </div>

          {/* Events Grid & Urgent Triage */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Events List */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <span>Your Upcoming Events</span>
                </h2>
                <span className="text-xs text-slate-500">{events.length} event(s)</span>
              </div>

              <div className="space-y-3">
                {events.map((evt) => (
                  <div
                    key={evt.eventId}
                    onClick={() => navigate(`/events/${evt.eventId}`)}
                    className="glass-panel-hover p-5 rounded-2xl border border-slate-800 cursor-pointer space-y-3 group"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-brand-500/15 text-brand-300 border border-brand-500/30">
                          {evt.type}
                        </span>
                        <h3 className="text-base font-bold text-white mt-1 group-hover:text-brand-300 transition-colors">
                          {evt.title}
                        </h3>
                      </div>
                      <span className="text-xs font-medium text-slate-400 uppercase px-2 py-0.5 rounded bg-slate-800">
                        {evt.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs text-slate-400 pt-1">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-brand-400 shrink-0" />
                        <span className="truncate">{evt.date}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                        <span className="truncate">{evt.location}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                        <span>{evt.participants} attendees</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                      <span className="text-slate-400">Budget: {evt.currency} {evt.budget.toLocaleString()}</span>
                      <span className="text-brand-400 font-semibold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                        Open Workspace <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* High Priority Tasks Triage */}
            <div className="lg:col-span-5 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                  <span>Immediate Action Triage</span>
                </h2>
                <span className="text-xs text-rose-400 font-medium">
                  {highPriorityTasks.length} urgent
                </span>
              </div>

              <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
                {highPriorityTasks.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400 space-y-2">
                    <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                    <p className="font-medium text-slate-300">All high priority tasks are clear!</p>
                    <p className="text-[11px] text-slate-500">Your core event deliverables are in good shape.</p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {highPriorityTasks.slice(0, 4).map((task) => (
                      <div
                        key={task.taskId}
                        className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-colors space-y-1.5"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-xs font-semibold text-slate-200 line-clamp-1">
                            {task.title}
                          </span>
                          <span className="text-[10px] uppercase font-bold text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded shrink-0">
                            High
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-slate-400">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-500" />
                            Due: {task.deadline}
                          </span>
                          <span className="capitalize text-slate-500">
                            {task.category.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {events[0] && (
                  <div className="pt-3 border-t border-slate-800">
                    <button
                      onClick={() => navigate(`/events/${events[0].eventId}?rescue=true`)}
                      className="w-full py-2.5 rounded-xl text-xs font-semibold text-rose-200 bg-rose-950/40 hover:bg-rose-900/50 border border-rose-500/30 transition-all flex items-center justify-center gap-2"
                    >
                      <LifeBuoy className="w-4 h-4 text-rose-400" />
                      <span>Need Help? Launch Plan Rescue</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
