import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';
import { eventService } from '../services/eventService.js';
import { CreateEventSchema, UpdateEventSchema } from '../schemas/index.js';

export const eventsHandler = {
  async list(req: AuthenticatedRequest, res: Response, next: any): Promise<void> {
    try {
      const ownerId = req.user!.userId;
      const events = await eventService.listEvents(ownerId);
      res.json({ events });
    } catch (err) {
      next(err);
    }
  },

  async create(req: AuthenticatedRequest, res: Response, next: any): Promise<void> {
    try {
      const ownerId = req.user!.userId;
      const validated = CreateEventSchema.parse(req.body);
      const event = await eventService.createEvent(ownerId, validated);
      res.status(201).json({ event });
    } catch (err) {
      next(err);
    }
  },

  async getOne(req: AuthenticatedRequest, res: Response, next: any): Promise<void> {
    try {
      const ownerId = req.user!.userId;
      const eventId = String(req.params.eventId);
      const event = await eventService.getEvent(ownerId, eventId);
      res.json({ event });
    } catch (err) {
      next(err);
    }
  },

  async update(req: AuthenticatedRequest, res: Response, next: any): Promise<void> {
    try {
      const ownerId = req.user!.userId;
      const eventId = String(req.params.eventId);
      const validated = UpdateEventSchema.parse(req.body);
      const event = await eventService.updateEvent(ownerId, eventId, validated);
      res.json({ event });
    } catch (err) {
      next(err);
    }
  },

  async delete(req: AuthenticatedRequest, res: Response, next: any): Promise<void> {
    try {
      const ownerId = req.user!.userId;
      const eventId = String(req.params.eventId);
      await eventService.deleteEvent(ownerId, eventId);
      res.json({ success: true, message: 'Event and associated tasks deleted successfully' });
    } catch (err) {
      next(err);
    }
  },

  async getProgress(req: AuthenticatedRequest, res: Response, next: any): Promise<void> {
    try {
      const ownerId = req.user!.userId;
      const eventId = String(req.params.eventId);
      const progress = await eventService.calculateProgress(ownerId, eventId);
      res.json({ progress });
    } catch (err) {
      next(err);
    }
  },
};
