import { GetCommand, PutCommand, QueryCommand, UpdateCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, TABLE_NAMES, isMockDbMode } from '../utils/dynamoClient.js';
import { EventItem } from '../types/index.js';

// In-memory store for unit tests or offline local simulation
const memoryEvents = new Map<string, EventItem>();

export const eventsRepository = {
  async create(event: EventItem): Promise<EventItem> {
    if (isMockDbMode) {
      memoryEvents.set(event.eventId, { ...event });
      return { ...event };
    }

    try {
      await docClient.send(
        new PutCommand({
          TableName: TABLE_NAMES.EVENTS,
          Item: event,
        })
      );
      return event;
    } catch (err: any) {
      // If table doesn't exist yet, fallback to memory
      if (err.name === 'ResourceNotFoundException' || err.name === 'UnrecognizedClientException') {
        memoryEvents.set(event.eventId, { ...event });
        return { ...event };
      }
      throw err;
    }
  },

  async getById(eventId: string, ownerId: string): Promise<EventItem | null> {
    if (isMockDbMode) {
      const item = memoryEvents.get(eventId);
      if (item && item.ownerId === ownerId) return { ...item };
      return null;
    }

    try {
      const res = await docClient.send(
        new GetCommand({
          TableName: TABLE_NAMES.EVENTS,
          Key: { eventId },
        })
      );
      if (!res.Item) return null;
      const item = res.Item as EventItem;
      return item.ownerId === ownerId ? item : null;
    } catch (err: any) {
      if (err.name === 'ResourceNotFoundException' || err.name === 'UnrecognizedClientException') {
        const item = memoryEvents.get(eventId);
        if (item && item.ownerId === ownerId) return { ...item };
        return null;
      }
      throw err;
    }
  },

  async listByOwner(ownerId: string): Promise<EventItem[]> {
    if (isMockDbMode) {
      return Array.from(memoryEvents.values())
        .filter((e) => e.ownerId === ownerId)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }

    try {
      const res = await docClient.send(
        new QueryCommand({
          TableName: TABLE_NAMES.EVENTS,
          IndexName: 'OwnerIndex',
          KeyConditionExpression: 'ownerId = :ownerId',
          ExpressionAttributeValues: {
            ':ownerId': ownerId,
          },
        })
      );
      const items = (res.Items as EventItem[]) || [];
      return items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    } catch (err: any) {
      if (err.name === 'ResourceNotFoundException' || err.name === 'UnrecognizedClientException') {
        return Array.from(memoryEvents.values())
          .filter((e) => e.ownerId === ownerId)
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      }
      throw err;
    }
  },

  async update(eventId: string, ownerId: string, updates: Partial<EventItem>): Promise<EventItem> {
    const existing = await this.getById(eventId, ownerId);
    if (!existing) {
      throw new Error('Event not found or access denied');
    }

    const updated: EventItem = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    if (isMockDbMode) {
      memoryEvents.set(eventId, updated);
      return updated;
    }

    try {
      await docClient.send(
        new PutCommand({
          TableName: TABLE_NAMES.EVENTS,
          Item: updated,
        })
      );
      return updated;
    } catch (err: any) {
      if (err.name === 'ResourceNotFoundException' || err.name === 'UnrecognizedClientException') {
        memoryEvents.set(eventId, updated);
        return updated;
      }
      throw err;
    }
  },

  async delete(eventId: string, ownerId: string): Promise<void> {
    const existing = await this.getById(eventId, ownerId);
    if (!existing) {
      throw new Error('Event not found or access denied');
    }

    if (isMockDbMode) {
      memoryEvents.delete(eventId);
      return;
    }

    try {
      await docClient.send(
        new DeleteCommand({
          TableName: TABLE_NAMES.EVENTS,
          Key: { eventId },
          ConditionExpression: 'ownerId = :ownerId',
          ExpressionAttributeValues: {
            ':ownerId': ownerId,
          },
        })
      );
    } catch (err: any) {
      if (err.name === 'ResourceNotFoundException' || err.name === 'UnrecognizedClientException') {
        memoryEvents.delete(eventId);
        return;
      }
      throw err;
    }
  },

  // Helper to seed or clear in tests
  _resetMemory(): void {
    memoryEvents.clear();
  },
  _setMemory(event: EventItem): void {
    memoryEvents.set(event.eventId, event);
  }
};
