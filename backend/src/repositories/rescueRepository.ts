import { GetCommand, PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, TABLE_NAMES, isMockDbMode } from '../utils/dynamoClient.js';
import { RescueProposal } from '../types/index.js';

const memoryProposals = new Map<string, RescueProposal>();

export const rescueRepository = {
  async save(proposal: RescueProposal): Promise<RescueProposal> {
    if (isMockDbMode) {
      memoryProposals.set(proposal.proposalId, { ...proposal });
      return { ...proposal };
    }

    try {
      await docClient.send(
        new PutCommand({
          TableName: TABLE_NAMES.RESCUE_PROPOSALS,
          Item: proposal,
        })
      );
      return proposal;
    } catch (err: any) {
      if (err.name === 'ResourceNotFoundException' || err.name === 'UnrecognizedClientException') {
        memoryProposals.set(proposal.proposalId, { ...proposal });
        return { ...proposal };
      }
      throw err;
    }
  },

  async getById(proposalId: string, eventId: string, ownerId: string): Promise<RescueProposal | null> {
    if (isMockDbMode) {
      const item = memoryProposals.get(proposalId);
      if (item && item.eventId === eventId && item.ownerId === ownerId) {
        return { ...item };
      }
      return null;
    }

    try {
      const res = await docClient.send(
        new GetCommand({
          TableName: TABLE_NAMES.RESCUE_PROPOSALS,
          Key: { proposalId },
        })
      );
      if (!res.Item) return null;
      const proposal = res.Item as RescueProposal;
      if (proposal.eventId === eventId && proposal.ownerId === ownerId) {
        return proposal;
      }
      return null;
    } catch (err: any) {
      if (err.name === 'ResourceNotFoundException' || err.name === 'UnrecognizedClientException') {
        const item = memoryProposals.get(proposalId);
        if (item && item.eventId === eventId && item.ownerId === ownerId) {
          return { ...item };
        }
        return null;
      }
      throw err;
    }
  },

  async markApplied(proposalId: string, eventId: string, ownerId: string): Promise<RescueProposal> {
    const existing = await this.getById(proposalId, eventId, ownerId);
    if (!existing) {
      throw new Error('Rescue proposal not found or unauthorized');
    }
    if (existing.approvalStatus === 'approved') {
      throw new Error('This rescue proposal has already been applied');
    }

    const updated: RescueProposal = {
      ...existing,
      approvalStatus: 'approved',
      appliedAt: new Date().toISOString(),
    };

    if (isMockDbMode) {
      memoryProposals.set(proposalId, updated);
      return updated;
    }

    try {
      await docClient.send(
        new PutCommand({
          TableName: TABLE_NAMES.RESCUE_PROPOSALS,
          Item: updated,
          ConditionExpression: 'approvalStatus = :pending AND ownerId = :ownerId AND eventId = :eventId',
          ExpressionAttributeValues: {
            ':pending': 'pending',
            ':ownerId': ownerId,
            ':eventId': eventId,
          },
        })
      );
      return updated;
    } catch (err: any) {
      if (err.name === 'ResourceNotFoundException' || err.name === 'UnrecognizedClientException') {
        memoryProposals.set(proposalId, updated);
        return updated;
      }
      throw err;
    }
  },

  async listByEvent(eventId: string, ownerId: string): Promise<RescueProposal[]> {
    if (isMockDbMode) {
      return Array.from(memoryProposals.values())
        .filter((p) => p.eventId === eventId && p.ownerId === ownerId)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }

    try {
      const res = await docClient.send(
        new QueryCommand({
          TableName: TABLE_NAMES.RESCUE_PROPOSALS,
          IndexName: 'EventIndex',
          KeyConditionExpression: 'eventId = :eventId',
          ExpressionAttributeValues: {
            ':eventId': eventId,
          },
        })
      );
      const items = (res.Items as RescueProposal[]) || [];
      return items.filter((p) => p.ownerId === ownerId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    } catch (err: any) {
      if (err.name === 'ResourceNotFoundException' || err.name === 'UnrecognizedClientException') {
        return Array.from(memoryProposals.values())
          .filter((p) => p.eventId === eventId && p.ownerId === ownerId)
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      }
      throw err;
    }
  },

  _resetMemory(): void {
    memoryProposals.clear();
  }
};
