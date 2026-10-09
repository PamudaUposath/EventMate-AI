import { GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, TABLE_NAMES, isMockDbMode } from '../utils/dynamoClient.js';
import { ConversationMessage, ConversationRecord } from '../types/index.js';

const memoryConversations = new Map<string, ConversationRecord>();
const MAX_STORED_MESSAGES = 40;

export const conversationsRepository = {
  async getRecord(eventId: string, ownerId: string): Promise<ConversationRecord | null> {
    if (isMockDbMode) {
      const rec = memoryConversations.get(eventId);
      if (rec && rec.ownerId === ownerId) return rec;
      return null;
    }

    try {
      const res = await docClient.send(
        new GetCommand({
          TableName: TABLE_NAMES.CONVERSATIONS,
          Key: { eventId },
        })
      );
      if (!res.Item) return null;
      const rec = res.Item as ConversationRecord;
      return rec.ownerId === ownerId ? rec : null;
    } catch (err: any) {
      if (err.name === 'ResourceNotFoundException' || err.name === 'UnrecognizedClientException') {
        const rec = memoryConversations.get(eventId);
        if (rec && rec.ownerId === ownerId) return rec;
        return null;
      }
      throw err;
    }
  },

  async getRecentMessages(
    eventId: string,
    ownerId: string,
    limit: number = 20
  ): Promise<ConversationMessage[]> {
    const record = await this.getRecord(eventId, ownerId);
    if (!record || !record.messages) return [];
    return record.messages.slice(-limit);
  },

  async appendMessage(
    eventId: string,
    ownerId: string,
    message: ConversationMessage
  ): Promise<ConversationRecord> {
    let record = await this.getRecord(eventId, ownerId);
    const now = new Date().toISOString();

    if (!record) {
      record = {
        conversationId: `conv_${eventId}`,
        eventId,
        ownerId,
        messages: [message],
        createdAt: now,
        updatedAt: now,
      };
    } else {
      const updatedMessages = [...record.messages, message];
      // Keep bounded memory to prevent excessive token or storage usage
      const boundedMessages = updatedMessages.slice(-MAX_STORED_MESSAGES);
      record = {
        ...record,
        messages: boundedMessages,
        updatedAt: now,
      };
    }

    if (isMockDbMode) {
      memoryConversations.set(eventId, record);
      return record;
    }

    try {
      await docClient.send(
        new PutCommand({
          TableName: TABLE_NAMES.CONVERSATIONS,
          Item: record,
        })
      );
      return record;
    } catch (err: any) {
      if (err.name === 'ResourceNotFoundException' || err.name === 'UnrecognizedClientException') {
        memoryConversations.set(eventId, record);
        return record;
      }
      throw err;
    }
  },

  _resetMemory(): void {
    memoryConversations.clear();
  }
};
