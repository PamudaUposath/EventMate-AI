import { v4 as uuidv4 } from 'uuid';
import { tasksRepository } from '../repositories/tasksRepository.js';
import { eventsRepository } from '../repositories/eventsRepository.js';
import { TaskItem, TaskPriority, TaskStatus, TaskCategory } from '../types/index.js';

export const taskService = {
  async createTask(
    ownerId: string,
    eventId: string,
    data: {
      title: string;
      description?: string;
      category: TaskCategory;
      priority: TaskPriority;
      status?: TaskStatus;
      deadline: string;
      assignedTo?: string;
    }
  ): Promise<TaskItem> {
    // Verify event ownership
    const event = await eventsRepository.getById(eventId, ownerId);
    if (!event) {
      const err: any = new Error('Event not found or unauthorized');
      err.statusCode = 404;
      throw err;
    }

    const now = new Date().toISOString();
    const task: TaskItem = {
      taskId: `tsk_${uuidv4().replace(/-/g, '').slice(0, 12)}`,
      eventId,
      ownerId,
      title: data.title,
      description: data.description || '',
      category: data.category,
      priority: data.priority,
      status: data.status || 'not_started',
      deadline: data.deadline,
      assignedTo: data.assignedTo,
      createdAt: now,
      updatedAt: now,
    };

    return await tasksRepository.create(task);
  },

  async listTasks(
    ownerId: string,
    eventId: string,
    filter?: { status?: string; priority?: string }
  ): Promise<TaskItem[]> {
    const event = await eventsRepository.getById(eventId, ownerId);
    if (!event) {
      const err: any = new Error('Event not found or unauthorized');
      err.statusCode = 404;
      throw err;
    }
    return await tasksRepository.listByEvent(eventId, ownerId, filter);
  },

  async getTask(ownerId: string, eventId: string, taskId: string): Promise<TaskItem> {
    const task = await tasksRepository.getById(taskId, eventId, ownerId);
    if (!task) {
      const err: any = new Error('Task not found or unauthorized');
      err.statusCode = 404;
      throw err;
    }
    return task;
  },

  async updateTask(
    ownerId: string,
    eventId: string,
    taskId: string,
    updates: Partial<TaskItem>
  ): Promise<TaskItem> {
    // 1. Verify event ownership first
    const event = await eventsRepository.getById(eventId, ownerId);
    if (!event) {
      const err: any = new Error('Event not found or unauthorized');
      err.statusCode = 404;
      throw err;
    }

    // 2. Explicit allowlist to prevent overwriting taskId, eventId, ownerId, or createdAt
    const safeUpdates: Partial<TaskItem> = {};
    if (updates.title !== undefined) safeUpdates.title = updates.title;
    if (updates.description !== undefined) safeUpdates.description = updates.description;
    if (updates.category !== undefined) safeUpdates.category = updates.category;
    if (updates.priority !== undefined) safeUpdates.priority = updates.priority;
    if (updates.status !== undefined) safeUpdates.status = updates.status;
    if (updates.deadline !== undefined) safeUpdates.deadline = updates.deadline;
    if (updates.assignedTo !== undefined) safeUpdates.assignedTo = updates.assignedTo;

    return await tasksRepository.update(taskId, eventId, ownerId, safeUpdates);
  },

  async deleteTask(ownerId: string, eventId: string, taskId: string): Promise<void> {
    const event = await eventsRepository.getById(eventId, ownerId);
    if (!event) {
      const err: any = new Error('Event not found or unauthorized');
      err.statusCode = 404;
      throw err;
    }
    return await tasksRepository.delete(taskId, eventId, ownerId);
  },

  async createBatch(
    ownerId: string,
    eventId: string,
    items: Array<{
      title: string;
      description?: string;
      category: TaskCategory;
      priority: TaskPriority;
      status?: TaskStatus;
      deadline: string;
      assignedTo?: string;
    }>
  ): Promise<TaskItem[]> {
    const now = new Date().toISOString();
    const tasks: TaskItem[] = items.map((t) => ({
      taskId: `tsk_${uuidv4().replace(/-/g, '').slice(0, 12)}`,
      eventId,
      ownerId,
      title: t.title,
      description: t.description || '',
      category: t.category,
      priority: t.priority,
      status: t.status || 'not_started',
      deadline: t.deadline,
      assignedTo: t.assignedTo,
      createdAt: now,
      updatedAt: now,
    }));

    return await tasksRepository.createBatch(tasks);
  },
};
