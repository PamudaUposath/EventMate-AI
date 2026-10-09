import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import {
  Sparkles,
  LifeBuoy,
  CheckCircle2,
  Clock,
  Calendar,
  MapPin,
  Users,
  DollarSign,
  Plus,
  Search,
  Filter,
  Check,
  Trash2,
  Edit2,
  Send,
  Bot,
  User as UserIcon,
  ChevronRight,
  TrendingUp,
  AlertCircle,
  HelpCircle,
  Layers,
  ArrowRight,
} from 'lucide-react';
import {
  EventItem,
  TaskItem,
  ConversationMessage,
  EventProgress,
  TaskPriority,
  TaskStatus,
} from '../types';
import { api } from '../services/api';
import { ProgressBar } from '../components/ProgressBar';
import { TaskModal } from '../components/TaskModal';
import { PlanRescueModal } from '../components/PlanRescueModal';
import { ConfirmModal } from '../components/ConfirmModal';
import { ChatMessageContent } from '../components/ChatMessageContent';

type WorkspaceTab = 'overview' | 'tasks' | 'timeline' | 'budget' | 'assistant';

export const EventWorkspacePage: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const [searchParams] = useSearchParams();

  const [event, setEvent] = useState<EventItem | null>(null);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [progress, setProgress] = useState<EventProgress | null>(null);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('overview');

  // Filters & Search
  const [taskFilterStatus, setTaskFilterStatus] = useState<string>('all');
  const [taskFilterPriority, setTaskFilterPriority] = useState<string>('all');
  const [taskSearchQuery, setTaskSearchQuery] = useState<string>('');

  // Modals state
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);
  const [isRescueModalOpen, setIsRescueModalOpen] = useState(false);
  const [rescueProblemPreload, setRescueProblemPreload] = useState('');
  const [taskToDelete, setTaskToDelete] = useState<TaskItem | null>(null);

  // Chat state
  const [chatInput, setChatInput] = useState('');
  const [isSendingChat, setIsSendingChat] = useState(false);

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (eventId) {
      loadWorkspace();
    }
  }, [eventId]);

  useEffect(() => {
    // Open rescue modal if query param ?rescue=true is set
    if (searchParams.get('rescue') === 'true') {
      setIsRescueModalOpen(true);
    }
  }, [searchParams]);

  const loadWorkspace = async () => {
    if (!eventId) return;
    setIsLoading(true);
    try {
      const [fetchedEvent, fetchedTasks, fetchedProgress, fetchedMessages] = await Promise.all([
        api.getEvent(eventId),
        api.listTasks(eventId),
        api.getEventProgress(eventId),
        api.getMessages(eventId),
      ]);
      setEvent(fetchedEvent);
      setTasks(fetchedTasks);
      setProgress(fetchedProgress);
      setMessages(fetchedMessages);
    } catch (err) {
      console.error('Failed to load event workspace:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleTaskStatus = async (task: TaskItem) => {
    if (!eventId) return;
    const nextStatus: TaskStatus =
      task.status === 'completed'
        ? 'not_started'
        : task.status === 'not_started'
        ? 'in_progress'
        : 'completed';

    try {
      // Optimistic update
      const updatedList = tasks.map((t) =>
        t.taskId === task.taskId ? { ...t, status: nextStatus } : t
      );
      setTasks(updatedList);

      await api.updateTask(eventId, task.taskId, { status: nextStatus });
      const newProgress = await api.getEventProgress(eventId);
      setProgress(newProgress);
    } catch (err) {
      console.error('Error updating task status:', err);
      loadWorkspace(); // revert on failure
    }
  };

  const handleSaveTask = async (data: any) => {
    if (!eventId) return;
    try {
      if (editingTask) {
        await api.updateTask(eventId, editingTask.taskId, data);
      } else {
        await api.createTask(eventId, data);
      }
      setIsTaskModalOpen(false);
      setEditingTask(null);
      await loadWorkspace();
    } catch (err) {
      console.error('Error saving task:', err);
    }
  };

  const handleDeleteTaskConfirm = async () => {
    if (!eventId || !taskToDelete) return;
    try {
      await api.deleteTask(eventId, taskToDelete.taskId);
      setTaskToDelete(null);
      await loadWorkspace();
    } catch (err) {
      console.error('Error deleting task:', err);
    }
  };

  const handleSendChat = async (promptToSend?: string) => {
    const message = promptToSend || chatInput;
    if (!message.trim() || !eventId || isSendingChat) return;

    setChatInput('');
    setIsSendingChat(true);

    // If prompt is crisis-related, also suggest Plan Rescue
    if (message.toLowerCase().includes('speaker') && message.toLowerCase().includes('cancel')) {
      setRescueProblemPreload(message);
    }

    try {
      // Optimistic append user message
      const tempUserMsg: ConversationMessage = {
        role: 'user',
        content: message,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, tempUserMsg]);

      const res = await api.sendChatMessage(eventId, message);

      const assistantMsg: ConversationMessage = {
        role: 'assistant',
        content: res.reply,
        timestamp: new Date().toISOString(),
        toolExecutions: res.toolExecutions,
      };
      setMessages((prev) => [...prev, assistantMsg]);

      // Refresh task and progress in case tools were executed
      if (res.toolExecutions && res.toolExecutions.length > 0) {
        const [updatedTasks, updatedProgress] = await Promise.all([
          api.listTasks(eventId),
          api.getEventProgress(eventId),
        ]);
        setTasks(updatedTasks);
        setProgress(updatedProgress);
      }
    } catch (err) {
      console.error('Error sending message:', err);
    } finally {
      setIsSendingChat(false);
    }
  };

  const handleRescueApplied = (newTasks: TaskItem[]) => {
    setTasks(newTasks);
    if (eventId) {
      api.getEventProgress(eventId).then((p) => setProgress(p));
    }
  };

  // Filter tasks
  const filteredTasks = tasks.filter((t) => {
    if (taskFilterStatus !== 'all' && t.status !== taskFilterStatus) return false;
    if (taskFilterPriority !== 'all' && t.priority !== taskFilterPriority) return false;
    if (
      taskSearchQuery &&
      !t.title.toLowerCase().includes(taskSearchQuery.toLowerCase()) &&
      !t.description?.toLowerCase().includes(taskSearchQuery.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  if (isLoading || !event) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-3">
        <div className="w-10 h-10 border-3 border-brand-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-slate-400">Loading event workspace...</p>
      </div>
    );
  }

  // Budget category estimates
  const budgetVenue = Math.round(event.budget * 0.25);
  const budgetCatering = Math.round(event.budget * 0.40);
  const budgetTechCloud = Math.round(event.budget * 0.20);
  const budgetMarketing = Math.round(event.budget * 0.10);
  const budgetContingency = Math.round(event.budget * 0.05);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* HEADER: Title, Details, Rescue Button, and Readiness */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-brand-500/15 text-brand-300 border border-brand-500/30">
                {event.type}
              </span>
              <span className="text-[10px] uppercase font-semibold text-slate-400 px-2 py-0.5 rounded bg-slate-800">
                {event.format}
              </span>
              <span className="text-[10px] uppercase font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                {event.status}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {event.title}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-brand-400" />
                {event.date} ({event.duration})
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-rose-400" />
                {event.location}
              </span>
              <span className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-indigo-400" />
                {event.participants} Attendees
              </span>
              <span className="flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                Budget: {event.currency} {event.budget.toLocaleString()}
              </span>
            </div>
          </div>

          {/* SIGNATURE FEATURE: PLAN RESCUE BUTTON */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => {
                setRescueProblemPreload('Our main speaker just cancelled, and the workshop is tomorrow.');
                setIsRescueModalOpen(true);
              }}
              className="px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-rose-600 via-rose-500 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 shadow-xl shadow-rose-600/30 transition-all flex items-center gap-2 rescue-glow group"
            >
              <LifeBuoy className="w-5 h-5 group-hover:rotate-45 transition-transform" />
              <span>Plan Rescue</span>
            </button>
          </div>
        </div>

        {/* Readiness Score Progress */}
        {progress && (
          <div className="pt-2 border-t border-slate-800/80">
            <ProgressBar
              percentage={progress.percentage}
              readinessLevel={progress.readinessLevel}
              size="md"
            />
          </div>
        )}
      </div>

      {/* WORKSPACE NAVIGATION TABS */}
      <div className="flex border-b border-slate-800 space-x-1 sm:space-x-4 overflow-x-auto text-xs sm:text-sm">
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'tasks', label: `Tasks (${tasks.length})` },
          { id: 'timeline', label: 'Timeline' },
          { id: 'budget', label: 'Budget Allocations' },
          { id: 'assistant', label: 'AI Co-Organiser Chat' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as WorkspaceTab)}
            className={`pb-3 px-3 font-semibold transition-colors relative whitespace-nowrap ${
              activeTab === tab.id ? 'text-brand-400' : 'text-slate-400 hover:text-white'
            }`}
          >
            {tab.label}
            {activeTab === tab.id && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-500 rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fadeIn">
          {/* Readiness Details & Recommendations */}
          <div className="lg:col-span-8 space-y-6">
            <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-brand-400" />
                <span>AI Co-Organiser Recommendation</span>
              </h2>

              <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-500/20 text-xs text-slate-200 leading-relaxed space-y-2">
                <p>
                  For an in-person <strong>{event.type}</strong> with {event.participants} attendees, your highest priority is securing speaker confirmations and verifying lab PC configurations.
                </p>
                <p className="text-indigo-300 font-semibold">
                  Recommended Next Action: Ensure attendees have AWS Builder ID accounts registered ahead of time so the hands-on lab runs without authentication hiccups.
                </p>
              </div>

              {/* Progress Summary Cards */}
              {progress && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-[11px] text-slate-400 block">Total Tasks</span>
                    <span className="text-lg font-bold text-white">{progress.totalTasks}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-[11px] text-emerald-400 block">Completed</span>
                    <span className="text-lg font-bold text-emerald-400">{progress.completedTasks}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-[11px] text-amber-400 block">In Progress</span>
                    <span className="text-lg font-bold text-amber-400">{progress.inProgressTasks}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-[11px] text-rose-400 block">High Priority</span>
                    <span className="text-lg font-bold text-rose-400">{progress.highPriorityPendingTasks}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Top 3 Priority Tasks */}
            <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white">Upcoming Urgent Tasks</h3>
                <button
                  onClick={() => setActiveTab('tasks')}
                  className="text-xs text-brand-400 hover:text-brand-300 font-medium"
                >
                  View All Tasks →
                </button>
              </div>

              <div className="space-y-2.5">
                {tasks
                  .filter((t) => t.status !== 'completed')
                  .slice(0, 3)
                  .map((task) => (
                    <div
                      key={task.taskId}
                      className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleToggleTaskStatus(task)}
                          className="w-5 h-5 rounded border border-slate-600 hover:border-brand-400 flex items-center justify-center transition-colors"
                        >
                          {task.status === 'completed' && <Check className="w-3.5 h-3.5 text-brand-400" />}
                        </button>
                        <div>
                          <p className="font-semibold text-slate-200">{task.title}</p>
                          <p className="text-[11px] text-slate-500">Due: {task.deadline}</p>
                        </div>
                      </div>
                      <span
                        className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                          task.priority === 'high'
                            ? 'bg-rose-500/20 text-rose-300'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {task.priority}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          </div>

          {/* Sidebar Info */}
          <div className="lg:col-span-4 space-y-6">
            <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4 text-xs">
              <h3 className="text-sm font-bold text-white">Event Information</h3>
              <div className="space-y-2.5 text-slate-300">
                <div className="flex justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-500">Date</span>
                  <span>{event.date}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-500">Duration</span>
                  <span>{event.duration}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-500">Expected Size</span>
                  <span>{event.participants} people</span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-500">Total Budget</span>
                  <span>{event.currency} {event.budget.toLocaleString()}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-500">Location</span>
                  <span className="text-right max-w-[150px] truncate">{event.location}</span>
                </div>
              </div>

              {event.additionalRequirements && (
                <div className="pt-2">
                  <span className="text-slate-500 block mb-1">Notes:</span>
                  <p className="text-slate-300 italic">{event.additionalRequirements}</p>
                </div>
              )}
            </div>

            {/* Quick Rescue Box */}
            <div className="p-5 rounded-3xl bg-rose-950/20 border border-rose-500/30 space-y-2">
              <div className="flex items-center gap-2 text-rose-400 font-bold text-xs uppercase tracking-wider">
                <LifeBuoy className="w-4 h-4" />
                <span>Last-Minute Issue?</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                If a speaker cancels, venue shifts, or budget changes, use Plan Rescue to generate calm adaptive solutions.
              </p>
              <button
                onClick={() => {
                  setRescueProblemPreload('');
                  setIsRescueModalOpen(true);
                }}
                className="w-full mt-2 py-2 text-xs font-semibold text-rose-300 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 rounded-xl transition-colors"
              >
                Launch Plan Rescue →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: TASKS */}
      {activeTab === 'tasks' && (
        <div className="space-y-4 animate-fadeIn">
          {/* Task Filters & Add Task Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {/* Search */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search tasks..."
                  value={taskSearchQuery}
                  onChange={(e) => setTaskSearchQuery(e.target.value)}
                  className="bg-slate-900 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
                />
              </div>

              {/* Status Filter */}
              <select
                value={taskFilterStatus}
                onChange={(e) => setTaskFilterStatus(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-white focus:outline-none"
              >
                <option value="all">All Statuses</option>
                <option value="not_started">Not Started</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>

              {/* Priority Filter */}
              <select
                value={taskFilterPriority}
                onChange={(e) => setTaskFilterPriority(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-white focus:outline-none"
              >
                <option value="all">All Priorities</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            <button
              onClick={() => {
                setEditingTask(null);
                setIsTaskModalOpen(true);
              }}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-brand-600 hover:bg-brand-500 shadow-md shadow-brand-600/20 transition-all flex items-center gap-1.5 shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add New Task</span>
            </button>
          </div>

          {/* Task Items List */}
          <div className="glass-panel rounded-3xl border border-slate-800 overflow-hidden">
            {filteredTasks.length === 0 ? (
              <div className="py-16 text-center text-xs text-slate-400 space-y-2">
                <CheckCircle2 className="w-8 h-8 text-slate-600 mx-auto" />
                <p>No tasks match your selected filter.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-800/80">
                {filteredTasks.map((task) => (
                  <div
                    key={task.taskId}
                    className="p-4 hover:bg-slate-900/50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-start gap-3 flex-1">
                      <button
                        onClick={() => handleToggleTaskStatus(task)}
                        title="Click to toggle status"
                        className={`w-5 h-5 rounded border mt-0.5 flex items-center justify-center transition-colors shrink-0 ${
                          task.status === 'completed'
                            ? 'bg-emerald-600 border-emerald-500 text-white'
                            : task.status === 'in_progress'
                            ? 'border-amber-400 bg-amber-400/20 text-amber-300'
                            : 'border-slate-600 hover:border-brand-400'
                        }`}
                      >
                        {task.status === 'completed' ? (
                          <Check className="w-3.5 h-3.5" />
                        ) : task.status === 'in_progress' ? (
                          <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                        ) : null}
                      </button>

                      <div className="space-y-1 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`font-semibold ${
                              task.status === 'completed'
                                ? 'line-through text-slate-400'
                                : 'text-slate-100'
                            }`}
                          >
                            {task.title}
                          </span>
                          <span
                            className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                              task.priority === 'high'
                                ? 'bg-rose-500/20 text-rose-300'
                                : task.priority === 'medium'
                                ? 'bg-amber-500/20 text-amber-300'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {task.priority}
                          </span>
                          <span className="text-[10px] text-slate-500 capitalize">
                            • {task.category.replace('_', ' ')}
                          </span>
                        </div>

                        {task.description && (
                          <p className="text-[11px] text-slate-400 leading-relaxed">
                            {task.description}
                          </p>
                        )}

                        <div className="flex items-center gap-3 text-[11px] text-slate-500 pt-0.5">
                          <span>Deadline: {task.deadline}</span>
                          {task.assignedTo && <span>Assigned: {task.assignedTo}</span>}
                        </div>
                      </div>
                    </div>

                    {/* Actions: Edit / Delete */}
                    <div className="flex items-center space-x-2 shrink-0 sm:self-center pl-8 sm:pl-0">
                      <button
                        onClick={() => {
                          setEditingTask(task);
                          setIsTaskModalOpen(true);
                        }}
                        className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                        title="Edit task"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setTaskToDelete(task)}
                        className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                        title="Delete task"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: TIMELINE */}
      {activeTab === 'timeline' && (
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-6 animate-fadeIn">
          <div>
            <h2 className="text-base font-bold text-white">Event Preparation Timeline</h2>
            <p className="text-xs text-slate-400">
              Chronological milestones leading up to {event.date}.
            </p>
          </div>

          <div className="space-y-6 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-slate-800">
            {tasks
              .sort((a, b) => a.deadline.localeCompare(b.deadline))
              .map((t, idx) => (
                <div key={t.taskId} className="relative flex items-start gap-4 pl-8 text-xs">
                  <div
                    className={`absolute left-2 top-1 w-3.5 h-3.5 rounded-full border-2 ${
                      t.status === 'completed'
                        ? 'bg-emerald-500 border-emerald-400'
                        : 'bg-slate-900 border-brand-500'
                    }`}
                  />
                  <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-xl flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-white">{t.title}</span>
                      <span className="text-[11px] text-brand-400 font-mono">{t.deadline}</span>
                    </div>
                    {t.description && <p className="text-[11px] text-slate-400">{t.description}</p>}
                    <span className="text-[10px] text-slate-500 uppercase block">
                      Status: {t.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* TAB 4: BUDGET */}
      {activeTab === 'budget' && (
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-6 animate-fadeIn">
          <div>
            <h2 className="text-base font-bold text-white">Budget Allocations</h2>
            <p className="text-xs text-slate-400">
              Suggested category allocations based on your event scale ({event.participants} attendees).
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
              <span className="text-xs text-slate-400 block mb-1">Total Available Budget</span>
              <span className="text-2xl font-bold text-white">
                {event.currency} {event.budget.toLocaleString()}
              </span>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
              <span className="text-xs text-slate-400 block mb-1">Cost Per Attendee</span>
              <span className="text-2xl font-bold text-brand-400">
                {event.currency} {Math.round(event.budget / event.participants).toLocaleString()}
              </span>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
              <span className="text-xs text-slate-400 block mb-1">Contingency Reserve</span>
              <span className="text-2xl font-bold text-emerald-400">
                {event.currency} {budgetContingency.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Allocation Categories Breakdown */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Category Estimations:
            </h4>

            {[
              { label: 'Catering & Refreshments (40%)', amount: budgetCatering, desc: 'Snacks, tea, coffee, and water bottles' },
              { label: 'Venue & Facilities (25%)', amount: budgetVenue, desc: 'Hall reservation or audio/visual room support' },
              { label: 'Technical Infrastructure & Labs (20%)', amount: budgetTechCloud, desc: 'Cloud credits, projector cables, Wi-Fi adapters' },
              { label: 'Marketing, Badges & Printing (10%)', amount: budgetMarketing, desc: 'Posters, badges, feedback incentives' },
              { label: 'Emergency Contingency (5%)', amount: budgetContingency, desc: 'Unplanned expenses and backup supplies' },
            ].map((cat, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between text-xs"
              >
                <div>
                  <p className="font-semibold text-slate-200">{cat.label}</p>
                  <p className="text-[11px] text-slate-500">{cat.desc}</p>
                </div>
                <span className="font-mono font-bold text-white">
                  {event.currency} {cat.amount.toLocaleString()}
                </span>
              </div>
            ))}
          </div>

          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-slate-500 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-slate-400" />
            <span>
              Disclaimer: These are suggested planning allocations based on your event scale. They do not represent recorded or audited actual expenses.
            </span>
          </div>
        </div>
      )}

      {/* TAB 5: AI CO-ORGANISER CONVERSATIONAL INTERFACE */}
      {activeTab === 'assistant' && (
        <div className="glass-panel rounded-3xl border border-slate-800 overflow-hidden flex flex-col h-[650px] animate-fadeIn">
          {/* Chat Header */}
          <div className="p-4 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center text-white">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  EventMate AI Co-Organiser
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    Bedrock Nova Lite
                  </span>
                </h3>
                <p className="text-[11px] text-slate-400">
                  Tool-connected co-organiser referencing your live database records
                </p>
              </div>
            </div>
          </div>

          {/* Chat Messages Log */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 text-xs">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0 mt-0.5">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-2xl p-3.5 space-y-2 leading-relaxed shadow-sm ${
                    msg.role === 'user'
                      ? 'bg-brand-600 text-white rounded-tr-none'
                      : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none'
                  }`}
                >
                  <ChatMessageContent content={msg.content} role={msg.role} />

                  {/* Tool Executions Badges */}
                  {msg.toolExecutions && msg.toolExecutions.length > 0 && (
                    <div className="pt-2 border-t border-slate-800 flex flex-wrap gap-1.5">
                      {msg.toolExecutions.map((t, tIdx) => (
                        <span
                          key={tIdx}
                          className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-indigo-300 border border-indigo-500/20 flex items-center gap-1"
                        >
                          <span className="text-amber-400">⚡</span>
                          <span>Tool: {t.toolName}</span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {msg.role === 'user' && (
                  <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 shrink-0 mt-0.5">
                    <UserIcon className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
            ))}

            {isSendingChat && (
              <div className="flex items-center gap-2 text-slate-400 text-xs">
                <div className="w-4 h-4 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                <span>EventMate is consulting your checklist...</span>
              </div>
            )}
          </div>

          {/* Quick Prompt Chips */}
          <div className="px-4 py-2 border-t border-slate-800/80 bg-slate-900/40 flex flex-wrap gap-2 text-[11px]">
            {[
              'What are my three most important tasks right now?',
              'How ready is my event?',
              'The speaker has cancelled. What should I do?',
            ].map((chip, idx) => (
              <button
                key={idx}
                onClick={() => handleSendChat(chip)}
                className="px-2.5 py-1 rounded-full bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 text-slate-300 hover:text-white transition-colors"
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Chat Input Bar */}
          <div className="p-3 bg-slate-900 border-t border-slate-800">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendChat();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                placeholder="Ask EventMate or instruct: 'Mark speaker confirmation completed'..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
              />
              <button
                type="submit"
                disabled={isSendingChat || !chatInput.trim()}
                className="p-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl shadow-md transition-colors disabled:opacity-40"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Task Edit/Create Modal */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onSubmit={handleSaveTask}
        initialTask={editingTask}
        defaultDeadline={event.date}
      />

      {/* Signature Plan Rescue Modal */}
      <PlanRescueModal
        isOpen={isRescueModalOpen}
        onClose={() => setIsRescueModalOpen(false)}
        eventId={event.eventId}
        onPlanApplied={handleRescueApplied}
        initialProblem={rescueProblemPreload}
      />

      {/* Task Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!taskToDelete}
        title="Delete Preparation Task"
        message={`Are you sure you want to delete "${taskToDelete?.title}"? This cannot be undone.`}
        confirmLabel="Delete Task"
        isDestructive={true}
        onConfirm={handleDeleteTaskConfirm}
        onCancel={() => setTaskToDelete(null)}
      />
    </div>
  );
};
