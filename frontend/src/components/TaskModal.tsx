import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Check } from 'lucide-react';
import { TaskItem, TaskCategory, TaskPriority, TaskStatus } from '../types';

const taskFormSchema = z.object({
  title: z.string().min(2, 'Task title is required').max(150),
  description: z.string().max(1000).optional(),
  category: z.enum([
    'speakers',
    'venue_tech',
    'content_labs',
    'logistics_catering',
    'marketing_registration',
    'budget_admin',
    'team_coordination',
  ]),
  priority: z.enum(['high', 'medium', 'low']),
  status: z.enum(['not_started', 'in_progress', 'completed']),
  deadline: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Deadline must be YYYY-MM-DD'),
  assignedTo: z.string().max(100).optional(),
});

type TaskFormData = z.infer<typeof taskFormSchema>;

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: TaskFormData) => Promise<void>;
  initialTask?: TaskItem | null;
  defaultDeadline?: string;
}

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialTask,
  defaultDeadline = new Date().toISOString().split('T')[0],
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<TaskFormData>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: initialTask?.title || '',
      description: initialTask?.description || '',
      category: initialTask?.category || 'venue_tech',
      priority: initialTask?.priority || 'medium',
      status: initialTask?.status || 'not_started',
      deadline: initialTask?.deadline || defaultDeadline,
      assignedTo: initialTask?.assignedTo || '',
    },
  });

  React.useEffect(() => {
    if (initialTask) {
      reset({
        title: initialTask.title,
        description: initialTask.description,
        category: initialTask.category,
        priority: initialTask.priority,
        status: initialTask.status,
        deadline: initialTask.deadline,
        assignedTo: initialTask.assignedTo || '',
      });
    } else {
      reset({
        title: '',
        description: '',
        category: 'venue_tech',
        priority: 'medium',
        status: 'not_started',
        deadline: defaultDeadline,
        assignedTo: '',
      });
    }
  }, [initialTask, defaultDeadline, reset]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-navy-900 border border-slate-700/80 rounded-2xl w-full max-w-lg shadow-2xl p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-lg font-bold text-white mb-4">
          {initialTask ? 'Edit Preparation Task' : 'Add New Task'}
        </h3>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-sm">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Task Title *
            </label>
            <input
              {...register('title')}
              placeholder="e.g. Confirm Workshop Speaker"
              className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-3.5 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
            />
            {errors.title && (
              <p className="text-xs text-rose-400 mt-1">{errors.title.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Description
            </label>
            <textarea
              {...register('description')}
              rows={2}
              placeholder="Key details or instructions..."
              className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-3.5 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Category
              </label>
              <select
                {...register('category')}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-brand-500"
              >
                <option value="speakers">Speakers & Hosts</option>
                <option value="venue_tech">Venue & Technical</option>
                <option value="content_labs">Content & Labs</option>
                <option value="logistics_catering">Logistics & Catering</option>
                <option value="marketing_registration">Marketing & Registrations</option>
                <option value="budget_admin">Budget & Admin</option>
                <option value="team_coordination">Team Coordination</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Priority
              </label>
              <select
                {...register('priority')}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-brand-500"
              >
                <option value="high">High (Urgent)</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Deadline *
              </label>
              <input
                type="date"
                {...register('deadline')}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-brand-500"
              />
              {errors.deadline && (
                <p className="text-xs text-rose-400 mt-1">{errors.deadline.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Status
              </label>
              <select
                {...register('status')}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-brand-500"
              >
                <option value="not_started">Not Started</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Assigned Person (Optional)
            </label>
            <input
              {...register('assignedTo')}
              placeholder="e.g. Kavindu or Logistics Lead"
              className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-3.5 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
            />
          </div>

          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-slate-300 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-sm font-medium text-white bg-brand-600 hover:bg-brand-500 rounded-lg shadow-md transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              {isSubmitting ? 'Saving...' : initialTask ? 'Save Changes' : 'Add Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
