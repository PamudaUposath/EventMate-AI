import { v4 as uuidv4 } from 'uuid';
import { eventsRepository } from '../repositories/eventsRepository.js';
import { tasksRepository } from '../repositories/tasksRepository.js';
import { EventItem, EventProgress } from '../types/index.js';

export const eventService = {
  async createEvent(
    ownerId: string,
    data: Omit<EventItem, 'eventId' | 'ownerId' | 'status' | 'createdAt' | 'updatedAt'> & {
      status?: EventItem['status'];
    }
  ): Promise<EventItem> {
    const now = new Date().toISOString();
    const event: EventItem = {
      eventId: `evt_${uuidv4().replace(/-/g, '').slice(0, 12)}`,
      ownerId,
      title: data.title,
      type: data.type,
      description: data.description || '',
      date: data.date,
      timezone: data.timezone || 'UTC',
      location: data.location,
      format: data.format,
      participants: data.participants,
      budget: data.budget,
      currency: data.currency || 'LKR',
      duration: data.duration,
      additionalRequirements: data.additionalRequirements || '',
      status: data.status || 'planning',
      createdAt: now,
      updatedAt: now,
    };

    return await eventsRepository.create(event);
  },

  async getEvent(ownerId: string, eventId: string): Promise<EventItem> {
    const event = await eventsRepository.getById(eventId, ownerId);
    if (!event) {
      const err: any = new Error('Event not found or access denied');
      err.statusCode = 404;
      throw err;
    }
    return event;
  },

  async listEvents(ownerId: string): Promise<EventItem[]> {
    return await eventsRepository.listByOwner(ownerId);
  },

  async updateEvent(
    ownerId: string,
    eventId: string,
    updates: Partial<EventItem>
  ): Promise<EventItem> {
    // Explicit allowlist to prevent mass-assignment/tampering of ownerId or eventId
    const safeUpdates: Partial<EventItem> = {};
    if (updates.title !== undefined) safeUpdates.title = updates.title;
    if (updates.type !== undefined) safeUpdates.type = updates.type;
    if (updates.description !== undefined) safeUpdates.description = updates.description;
    if (updates.date !== undefined) safeUpdates.date = updates.date;
    if (updates.timezone !== undefined) safeUpdates.timezone = updates.timezone;
    if (updates.location !== undefined) safeUpdates.location = updates.location;
    if (updates.format !== undefined) safeUpdates.format = updates.format;
    if (updates.participants !== undefined) safeUpdates.participants = updates.participants;
    if (updates.budget !== undefined) safeUpdates.budget = updates.budget;
    if (updates.currency !== undefined) safeUpdates.currency = updates.currency;
    if (updates.duration !== undefined) safeUpdates.duration = updates.duration;
    if (updates.additionalRequirements !== undefined) safeUpdates.additionalRequirements = updates.additionalRequirements;
    if (updates.status !== undefined) safeUpdates.status = updates.status;

    return await eventsRepository.update(eventId, ownerId, safeUpdates);
  },

  async deleteEvent(ownerId: string, eventId: string): Promise<void> {
    const tasks = await tasksRepository.listByEvent(eventId, ownerId);
    for (const t of tasks) {
      await tasksRepository.delete(t.taskId, eventId, ownerId);
    }
    await eventsRepository.delete(eventId, ownerId);
  },

  async calculateProgress(ownerId: string, eventId: string): Promise<EventProgress> {
    // Must verify event exists
    await this.getEvent(ownerId, eventId);

    const tasks = await tasksRepository.listByEvent(eventId, ownerId);
    const total = tasks.length;
    if (total === 0) {
      return {
        totalTasks: 0,
        completedTasks: 0,
        inProgressTasks: 0,
        pendingTasks: 0,
        highPriorityPendingTasks: 0,
        percentage: 0,
        readinessLevel: 'Low',
      };
    }

    const completed = tasks.filter((t) => t.status === 'completed').length;
    const inProgress = tasks.filter((t) => t.status === 'in_progress').length;
    const pending = tasks.filter((t) => t.status !== 'completed').length;
    const highPriorityPending = tasks.filter(
      (t) => t.status !== 'completed' && t.priority === 'high'
    ).length;

    // Weight: completed = 100%, in_progress = 50%
    const progressScore = ((completed * 1.0 + inProgress * 0.5) / total) * 100;
    const percentage = Math.round(progressScore);

    let readinessLevel: EventProgress['readinessLevel'] = 'Low';
    if (percentage >= 85) readinessLevel = 'Ready';
    else if (percentage >= 60) readinessLevel = 'Good';
    else if (percentage >= 30) readinessLevel = 'Moderate';

    return {
      totalTasks: total,
      completedTasks: completed,
      inProgressTasks: inProgress,
      pendingTasks: pending,
      highPriorityPendingTasks: highPriorityPending,
      percentage,
      readinessLevel,
    };
  },
};
