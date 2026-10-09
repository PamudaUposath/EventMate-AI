import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';
import { rescueService } from '../services/rescueService.js';
import { ProposeRescueSchema } from '../schemas/index.js';

export const rescueHandler = {
  async propose(req: AuthenticatedRequest, res: Response, next: any): Promise<void> {
    try {
      const ownerId = req.user!.userId;
      const eventId = String(req.params.eventId);
      const validated = ProposeRescueSchema.parse(req.body);

      const proposal = await rescueService.proposeRescue(
        ownerId,
        eventId,
        validated.problemDescription,
        validated.preferredOptionIndex
      );

      res.status(201).json({ proposal });
    } catch (err) {
      next(err);
    }
  },

  async apply(req: AuthenticatedRequest, res: Response, next: any): Promise<void> {
    try {
      const ownerId = req.user!.userId;
      const eventId = String(req.params.eventId);
      const proposalId = String(req.params.proposalId);

      const result = await rescueService.applyRescue(ownerId, eventId, proposalId);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  async list(req: AuthenticatedRequest, res: Response, next: any): Promise<void> {
    try {
      const ownerId = req.user!.userId;
      const eventId = String(req.params.eventId);

      const proposals = await rescueService.listProposals(ownerId, eventId);
      res.json({ proposals });
    } catch (err) {
      next(err);
    }
  },
};
