import {
  EventItem,
  TaskItem,
  ConversationMessage,
  RescueProposal,
  EventProgress,
} from '../types';
import {
  DEMO_EVENT,
  DEMO_TASKS,
  DEMO_MESSAGES,
  DEMO_RESCUE_PROPOSAL,
} from './demoData';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

class ApiService {
  private token: string | null = null;
  private isDemoSession: boolean = false;

  // In-memory state for interactive demo mode
  private demoEventState: EventItem = { ...DEMO_EVENT };
  private demoTasksState: TaskItem[] = [...DEMO_TASKS];
  private demoMessagesState: ConversationMessage[] = [...DEMO_MESSAGES];
  private demoRescueState: RescueProposal = { ...DEMO_RESCUE_PROPOSAL };

  setToken(token: string | null) {
    this.token = token;
  }

  setDemoMode(enabled: boolean) {
    this.isDemoSession = enabled;
  }

  getIsDemoMode(): boolean {
    return this.isDemoSession;
  }

  private getHeaders(): HeadersInit {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    } else if (this.isDemoSession) {
      headers['Authorization'] = 'Bearer demo-token-123';
    }
    return headers;
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const url = `${BASE_URL}${path}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...(options.headers || {}),
      },
    });

    if (!response.ok) {
      let errorMsg = `Request failed: ${response.status}`;
      try {
        const errJson = await response.json();
        errorMsg = errJson.message || errJson.error || errorMsg;
      } catch {
        // ignore parse error
      }
      throw new Error(errorMsg);
    }

    return response.json();
  }

  // --- EVENTS ---

  async listEvents(): Promise<EventItem[]> {
    if (this.isDemoSession) {
      return [this.demoEventState];
    }
    try {
      const data = await this.request<{ events: EventItem[] }>('/events');
      return data.events;
    } catch (e) {
      if (this.isDemoSession) return [this.demoEventState];
      throw e;
    }
  }

  async getEvent(eventId: string): Promise<EventItem> {
    if (this.isDemoSession || eventId === DEMO_EVENT.eventId) {
      return this.demoEventState;
    }
    const data = await this.request<{ event: EventItem }>(`/events/${eventId}`);
    return data.event;
  }

  async createEvent(eventData: any): Promise<EventItem> {
    if (this.isDemoSession) {
      const newEvt: EventItem = {
        ...DEMO_EVENT,
        ...eventData,
        eventId: `evt_${Date.now()}`,
        status: 'planning',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      this.demoEventState = newEvt;
      return newEvt;
    }
    const data = await this.request<{ event: EventItem }>('/events', {
      method: 'POST',
      body: JSON.stringify(eventData),
    });
    return data.event;
  }

  async updateEvent(eventId: string, updates: Partial<EventItem>): Promise<EventItem> {
    if (this.isDemoSession) {
      this.demoEventState = { ...this.demoEventState, ...updates, updatedAt: new Date().toISOString() };
      return this.demoEventState;
    }
    const data = await this.request<{ event: EventItem }>(`/events/${eventId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
    return data.event;
  }

  async getEventProgress(eventId: string): Promise<EventProgress> {
    if (this.isDemoSession) {
      const total = this.demoTasksState.length;
      const completed = this.demoTasksState.filter((t) => t.status === 'completed').length;
      const inProgress = this.demoTasksState.filter((t) => t.status === 'in_progress').length;
      const pending = this.demoTasksState.filter((t) => t.status !== 'completed').length;
      const highPending = this.demoTasksState.filter(
        (t) => t.status !== 'completed' && t.priority === 'high'
      ).length;
      const percentage = total > 0 ? Math.round(((completed + inProgress * 0.5) / total) * 100) : 0;
      return {
        totalTasks: total,
        completedTasks: completed,
        inProgressTasks: inProgress,
        pendingTasks: pending,
        highPriorityPendingTasks: highPending,
        percentage,
        readinessLevel: percentage >= 80 ? 'Ready' : percentage >= 50 ? 'Good' : 'Moderate',
      };
    }

    const data = await this.request<{ progress: EventProgress }>(`/events/${eventId}/progress`);
    return data.progress;
  }

  // --- TASKS ---

  async listTasks(eventId: string, filter?: { status?: string; priority?: string }): Promise<TaskItem[]> {
    if (this.isDemoSession) {
      return this.demoTasksState.filter((t) => {
        if (filter?.status && t.status !== filter.status) return false;
        if (filter?.priority && t.priority !== filter.priority) return false;
        return true;
      });
    }
    const params = new URLSearchParams();
    if (filter?.status) params.append('status', filter.status);
    if (filter?.priority) params.append('priority', filter.priority);
    const qs = params.toString() ? `?${params.toString()}` : '';
    const data = await this.request<{ tasks: TaskItem[] }>(`/events/${eventId}/tasks${qs}`);
    return data.tasks;
  }

  async createTask(eventId: string, taskData: any): Promise<TaskItem> {
    if (this.isDemoSession) {
      const newTask: TaskItem = {
        taskId: `tsk_${Date.now()}`,
        eventId,
        ownerId: 'demo-user-123',
        title: taskData.title,
        description: taskData.description || '',
        category: taskData.category,
        priority: taskData.priority,
        status: taskData.status || 'not_started',
        deadline: taskData.deadline,
        assignedTo: taskData.assignedTo,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      this.demoTasksState = [newTask, ...this.demoTasksState];
      return newTask;
    }
    const data = await this.request<{ task: TaskItem }>(`/events/${eventId}/tasks`, {
      method: 'POST',
      body: JSON.stringify(taskData),
    });
    return data.task;
  }

  async updateTask(eventId: string, taskId: string, updates: Partial<TaskItem>): Promise<TaskItem> {
    if (this.isDemoSession) {
      const idx = this.demoTasksState.findIndex((t) => t.taskId === taskId);
      if (idx !== -1) {
        this.demoTasksState[idx] = {
          ...this.demoTasksState[idx],
          ...updates,
          updatedAt: new Date().toISOString(),
        };
        return this.demoTasksState[idx];
      }
    }
    const data = await this.request<{ task: TaskItem }>(`/events/${eventId}/tasks/${taskId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
    return data.task;
  }

  async deleteTask(eventId: string, taskId: string): Promise<void> {
    if (this.isDemoSession) {
      this.demoTasksState = this.demoTasksState.filter((t) => t.taskId !== taskId);
      return;
    }
    await this.request<{ success: boolean }>(`/events/${eventId}/tasks/${taskId}`, {
      method: 'DELETE',
    });
  }

  // --- AI AGENT ---

  async sendChatMessage(eventId: string, message: string): Promise<{
    reply: string;
    toolExecutions: any[];
    conversationId: string;
  }> {
    if (this.isDemoSession) {
      // Offline interactive demo responses matching the AWS challenge scenario
      const userMsg: ConversationMessage = {
        role: 'user',
        content: message,
        timestamp: new Date().toISOString(),
      };
      this.demoMessagesState.push(userMsg);

      const msgLower = message.toLowerCase();
      let reply = '';
      let toolExecutions: any[] = [];

      if (msgLower.includes('speaker') && (msgLower.includes('cancel') || msgLower.includes('drop'))) {
        reply = `No panic. Let's work through this.

A speaker cancellation 24-48 hours before an event is stressful, but we can definitely keep the workshop high-value!

Here are three practical approaches:
1. **Find an Emergency Speaker**: Reach out to AWS Community alumni.
2. **Convert into Guided Practical Lab (Recommended)**: Pivot the keynote into a collaborative, hands-on workshop led by our student organisers using AWS step-by-step guides.
3. **Interactive Mini-Hack Challenge**: Have teams build a small project together.

I recommend **Option 2** because attendees love hands-on keyboard time, and it removes single-point speaker risk.

I've generated a Plan Rescue proposal for you. Click **"Review Rescue Changes"** above to see the change preview and apply the updates!`;
        toolExecutions = [
          {
            toolName: 'propose_rescue_plan',
            toolInput: { eventId, problemDescription: message },
            toolOutput: { status: 'success', proposalId: 'resc_demo_speaker_pivot' },
          },
        ];
      } else if (msgLower.includes('how ready') || msgLower.includes('progress')) {
        const prog = await this.getEventProgress(eventId);
        reply = `Here is your current preparation status for **${this.demoEventState.title}**:

- **Readiness Score:** ${prog.percentage}% (${prog.readinessLevel})
- **Completed Tasks:** ${prog.completedTasks} of ${prog.totalTasks}
- **In-Progress Tasks:** ${prog.inProgressTasks}
- **High-Priority Pending:** ${prog.highPriorityPendingTasks}

${prog.highPriorityPendingTasks > 0 ? `You have ${prog.highPriorityPendingTasks} critical task(s) needing attention.` : 'You are in great shape for event day!'}`;
        toolExecutions = [
          {
            toolName: 'get_event_progress',
            toolInput: { eventId },
            toolOutput: { progress: prog },
          },
        ];
      } else if (msgLower.includes('important') || msgLower.includes('next') || msgLower.includes('urgent')) {
        reply = `Here are your top 3 priority tasks to focus on right now:

1. **Confirm Workshop Speaker & Content Outline** (Priority: HIGH, Deadline: 2026-11-10)
   _Finalize speaker availability, topic outline, and hands-on lab scope._
2. **Prepare AWS Workshop Lab Environment & IAM Sandboxes** (Priority: HIGH, Deadline: 2026-11-14)
   _Set up step-by-step guides for S3, Lambda, and DynamoDB architecture labs._
3. **Test Projector, Audio Mics & Backup Mobile Hotspot** (Priority: HIGH, Deadline: 2026-11-19)
   _Dry run HDMI projection, presenter wireless microphone, and backup hotspot._`;
        toolExecutions = [
          {
            toolName: 'list_event_tasks',
            toolInput: { eventId, priority: 'high' },
            toolOutput: { count: 3 },
          },
        ];
      } else {
        reply = `I am here as your co-organiser for **${this.demoEventState.title}**. You have ${this.demoTasksState.length} tasks on your board. Ask me "What are my three most important tasks right now?" or "How ready is my event?" anytime!`;
      }

      const assistantMsg: ConversationMessage = {
        role: 'assistant',
        content: reply,
        timestamp: new Date().toISOString(),
        toolExecutions,
      };
      this.demoMessagesState.push(assistantMsg);

      return {
        reply,
        toolExecutions,
        conversationId: 'conv_demo_123',
      };
    }

    return this.request('/agent/chat', {
      method: 'POST',
      body: JSON.stringify({ eventId, message }),
    });
  }

  async getMessages(eventId: string): Promise<ConversationMessage[]> {
    if (this.isDemoSession) {
      return this.demoMessagesState;
    }
    const data = await this.request<{ messages: ConversationMessage[] }>(`/events/${eventId}/messages`);
    return data.messages;
  }

  // --- PLAN RESCUE ---

  async proposeRescue(eventId: string, problemDescription: string): Promise<RescueProposal> {
    if (this.isDemoSession) {
      return this.demoRescueState;
    }
    const data = await this.request<{ proposal: RescueProposal }>(`/events/${eventId}/rescue`, {
      method: 'POST',
      body: JSON.stringify({ problemDescription }),
    });
    return data.proposal;
  }

  async applyRescue(eventId: string, proposalId: string): Promise<{
    message: string;
    proposal: RescueProposal;
    tasks: TaskItem[];
  }> {
    if (this.isDemoSession) {
      // Apply proposed changes into demo tasks
      for (const change of this.demoRescueState.proposedTaskChanges) {
        if (change.changeType === 'add') {
          this.demoTasksState.unshift({
            taskId: `tsk_rescue_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
            eventId,
            ownerId: 'demo-user-123',
            title: change.title,
            description: change.description || '',
            category: change.category,
            priority: change.priority,
            status: change.status || 'not_started',
            deadline: change.deadline || this.demoEventState.date,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        } else if (change.changeType === 'update' && change.taskId) {
          const idx = this.demoTasksState.findIndex((t) => t.taskId === change.taskId);
          if (idx !== -1) {
            this.demoTasksState[idx] = {
              ...this.demoTasksState[idx],
              title: change.title,
              description: change.description || this.demoTasksState[idx].description,
              category: change.category,
              priority: change.priority,
              status: change.status || this.demoTasksState[idx].status,
              updatedAt: new Date().toISOString(),
            };
          }
        }
      }
      this.demoRescueState.approvalStatus = 'approved';
      this.demoRescueState.appliedAt = new Date().toISOString();

      return {
        message: 'Plan rescue applied successfully. 2 new tasks added, 1 task updated.',
        proposal: this.demoRescueState,
        tasks: this.demoTasksState,
      };
    }

    return this.request(`/events/${eventId}/rescue/${proposalId}/apply`, {
      method: 'POST',
    });
  }
}

export const api = new ApiService();
