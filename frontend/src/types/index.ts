export type EventStatus = 'draft' | 'planning' | 'ready' | 'completed' | 'cancelled';
export type EventFormat = 'in-person' | 'online' | 'hybrid';

export interface EventItem {
  eventId: string;
  ownerId: string;
  title: string;
  type: string;
  description?: string;
  date: string;
  timezone?: string;
  location: string;
  format: EventFormat;
  participants: number;
  budget: number;
  currency: string;
  duration: string;
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
  deadline: string;
  assignedTo?: string;
  createdAt: string;
  updatedAt: string;
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

export interface ProposedTaskChange {
  changeType: 'add' | 'update' | 'keep' | 'remove';
  taskId?: string;
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

export interface UserProfile {
  userId: string;
  email: string;
  name: string;
  isDemo?: boolean;
}
