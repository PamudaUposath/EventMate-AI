import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';
import { AgentEngine } from '../agent/agentEngine.js';
import { conversationsRepository } from '../repositories/conversationsRepository.js';
import { AgentChatSchema } from '../schemas/index.js';

export const agentHandler = {
  async chat(req: AuthenticatedRequest, res: Response, next: any): Promise<void> {
    try {
      const ownerId = req.user!.userId;
      const validated = AgentChatSchema.parse(req.body);

      const result = await AgentEngine.chat(ownerId, validated.eventId, validated.message);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  async getMessages(req: AuthenticatedRequest, res: Response, next: any): Promise<void> {
    try {
      const ownerId = req.user!.userId;
      const eventId = String(req.params.eventId);

      const messages = await conversationsRepository.getRecentMessages(eventId, ownerId, 50);
      res.json({ messages });
    } catch (err) {
      next(err);
    }
  },
};
