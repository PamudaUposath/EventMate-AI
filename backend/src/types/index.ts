export type EventStatus = 'draft' | 'planning' | 'ready' | 'completed' | 'cancelled';
export type EventFormat = 'in-person' | 'online' | 'hybrid';

export interface EventItem {
  eventId: string;
  ownerId: string;
  title: string;
  type: string; // e.g., 'technical-workshop', 'hackathon', 'networking', 'seminar'
  description?: string;
  date: string; // ISO date string e.g. '2026-11-20'
  timezone?: string;
  location: string;
  format: EventFormat;
  participants: number;
  budget: number;
  currency: string; // e.g. 'LKR', 'USD'
  duration: string; // e.g. '4 hours'
  additionalRequirements?: string;
  status: EventStatus;
  createdAt: string;
  updatedAt: string;
}

export type TaskPriority = 'high' | 'medium' | 'low';
export type TaskStatus = 'not_started' | 'in_progress' | 'completed';
export type TaskCategory = 
  | 'speakers'
  | 'venue_tech'
  | 'content_labs'
  | 'logistics_catering'
  | 'marketing_registration'
  | 'budget_admin'
  | 'team_coordination';

export interface TaskItem {
  taskId: string;
  eventId: string;
  ownerId: string;
  title: string;
  description: string;
  category: TaskCategory;
  priority: TaskPriority;
  status: TaskStatus;
  deadline: string; // ISO date string
  assignedTo?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MessageContent {
  text?: string;
  toolUse?: {
    toolUseId: string;
    name: string;
    input: Record<string, any>;
  };
  toolResult?: {
    toolUseId: string;
    content: string;
    status: 'success' | 'error';
  };
}

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  toolExecutions?: Array<{
    toolName: string;
    toolInput: Record<string, any>;
    toolOutput: Record<string, any>;
  }>;
}

export interface ConversationRecord {
  conversationId: string;
  eventId: string;
  ownerId: string;
  messages: ConversationMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface ProposedTaskChange {
  changeType: 'add' | 'update' | 'keep' | 'remove';
  taskId?: string; // existing taskId if update/keep/remove
  title: string;
  description?: string;
  category: TaskCategory;
  priority: TaskPriority;
  status?: TaskStatus;
  deadline?: string;
  reason?: string;
}

export interface RescueOption {
  optionId: string;
  title: string;
  description: string;
  isRecommended: boolean;
  recommendationReason?: string;
  tradeoffs?: string;
}

export interface RescueProposal {
  proposalId: string;
  eventId: string;
  ownerId: string;
  problemSummary: string;
  selectedOptionTitle: string;
  recommendedSolution: string;
  options: RescueOption[];
  proposedTaskChanges: ProposedTaskChange[];
  explanation: string;
  immediateNextActions: string[];
  approvalStatus: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  appliedAt?: string;
  expiresAt: string;
}

export interface EventProgress {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  pendingTasks: number;
  highPriorityPendingTasks: number;
  percentage: number;
  readinessLevel: 'Low' | 'Moderate' | 'Good' | 'Ready';
}
