import { z } from 'zod';

export const CreateEventSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(120),
  type: z.string().min(2, 'Event type is required').max(60),
  description: z.string().max(1000).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  timezone: z.string().max(50).optional().default('UTC'),
  location: z.string().min(2, 'Location is required').max(150),
  format: z.enum(['in-person', 'online', 'hybrid']),
  participants: z.number().int().positive('Participants must be greater than 0').max(100000),
  budget: z.number().nonnegative('Budget cannot be negative'),
  currency: z.string().min(2).max(10).default('LKR'),
  duration: z.string().min(1).max(50),
  additionalRequirements: z.string().max(2000).optional(),
});

export const UpdateEventSchema = CreateEventSchema.partial().extend({
  status: z.enum(['draft', 'planning', 'ready', 'completed', 'cancelled']).optional(),
});

export const CreateTaskSchema = z.object({
  title: z.string().min(2, 'Task title is required').max(150),
  description: z.string().max(1000).default(''),
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
  status: z.enum(['not_started', 'in_progress', 'completed']).default('not_started'),
  deadline: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Deadline must be YYYY-MM-DD'),
  assignedTo: z.string().max(100).optional(),
});

export const UpdateTaskSchema = CreateTaskSchema.partial();

export const AgentChatSchema = z.object({
  eventId: z.string().min(1, 'Event ID is required'),
  message: z.string().min(1, 'Message cannot be empty').max(3000),
});

export const ProposeRescueSchema = z.object({
  problemDescription: z.string().min(5, 'Please provide a clear description of the issue').max(2000),
  preferredOptionIndex: z.number().int().min(0).max(5).optional(),
});

export const ApplyRescueSchema = z.object({
  proposalId: z.string().min(1, 'Proposal ID is required'),
});

// Tool Argument Schemas
export const ToolCreateEventPlanSchema = z.object({
  eventName: z.string().min(2),
  eventType: z.string(),
  date: z.string(),
  location: z.string(),
  participants: z.number().optional().default(50),
  budget: z.number().optional().default(0),
  currency: z.string().optional().default('LKR'),
  duration: z.string().optional().default('Half-day'),
  additionalRequirements: z.string().optional(),
});

export const ToolGetEventDetailsSchema = z.object({
  eventId: z.string().min(1),
});

export const ToolListEventTasksSchema = z.object({
  eventId: z.string().min(1),
  status: z.enum(['not_started', 'in_progress', 'completed']).optional(),
  priority: z.enum(['high', 'medium', 'low']).optional(),
});

export const ToolAddEventTaskSchema = z.object({
  eventId: z.string().min(1),
  task: CreateTaskSchema,
});

export const ToolUpdateEventTaskSchema = z.object({
  eventId: z.string().min(1),
  taskId: z.string().min(1),
  updates: UpdateTaskSchema,
});

export const ToolGetEventProgressSchema = z.object({
  eventId: z.string().min(1),
});

export const ToolProposeRescuePlanSchema = z.object({
  eventId: z.string().min(1),
  problemDescription: z.string().min(3),
});

export const ToolApplyRescuePlanSchema = z.object({
  eventId: z.string().min(1),
  proposalId: z.string().min(1),
});
