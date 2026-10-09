import { Response } from 'express';
import { z } from 'zod';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';
import { taskService } from '../services/taskService.js';
import { CreateTaskSchema, UpdateTaskSchema } from '../schemas/index.js';

export const tasksHandler = {
  async list(req: AuthenticatedRequest, res: Response, next: any): Promise<void> {
    try {
      const ownerId = req.user!.userId;
      const eventId = String(req.params.eventId);
      
      const queryFilterSchema = z.object({
        status: z.enum(['not_started', 'in_progress', 'completed']).optional(),
        priority: z.enum(['high', 'medium', 'low']).optional(),
      });
      const filter = queryFilterSchema.parse(req.query);

      const tasks = await taskService.listTasks(ownerId, eventId, filter);

      res.json({ tasks });
    } catch (err) {
      next(err);
    }
  },

  async create(req: AuthenticatedRequest, res: Response, next: any): Promise<void> {
    try {
      const ownerId = req.user!.userId;
      const eventId = String(req.params.eventId);
      const validated = CreateTaskSchema.parse(req.body);

      const task = await taskService.createTask(ownerId, eventId, validated);
      res.status(201).json({ task });
    } catch (err) {
      next(err);
    }
  },

  async update(req: AuthenticatedRequest, res: Response, next: any): Promise<void> {
    try {
      const ownerId = req.user!.userId;
      const eventId = String(req.params.eventId);
      const taskId = String(req.params.taskId);
      const validated = UpdateTaskSchema.parse(req.body);

      const task = await taskService.updateTask(ownerId, eventId, taskId, validated);
      res.json({ task });
    } catch (err) {
      next(err);
    }
  },

  async delete(req: AuthenticatedRequest, res: Response, next: any): Promise<void> {
    try {
      const ownerId = req.user!.userId;
      const eventId = String(req.params.eventId);
      const taskId = String(req.params.taskId);

      await taskService.deleteTask(ownerId, eventId, taskId);
      res.json({ success: true, message: 'Task deleted successfully' });
    } catch (err) {
      next(err);
    }
  },
};
