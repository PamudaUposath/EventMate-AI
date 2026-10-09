import { GetCommand, PutCommand, QueryCommand, DeleteCommand, BatchWriteCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, TABLE_NAMES, isMockDbMode } from '../utils/dynamoClient.js';
import { TaskItem } from '../types/index.js';

const memoryTasks = new Map<string, TaskItem>();

export const tasksRepository = {
  async create(task: TaskItem): Promise<TaskItem> {
    if (isMockDbMode) {
      memoryTasks.set(task.taskId, { ...task });
      return { ...task };
    }

    try {
      await docClient.send(
        new PutCommand({
          TableName: TABLE_NAMES.TASKS,
          Item: task,
        })
      );
      return task;
    } catch (err: any) {
      if (err.name === 'ResourceNotFoundException' || err.name === 'UnrecognizedClientException') {
        memoryTasks.set(task.taskId, { ...task });
        return { ...task };
      }
      throw err;
    }
  },

  async createBatch(tasks: TaskItem[]): Promise<TaskItem[]> {
    if (tasks.length === 0) return [];
    if (isMockDbMode) {
      tasks.forEach((t) => memoryTasks.set(t.taskId, { ...t }));
      return tasks;
    }

    try {
      // Chunk into batches of 25 for DynamoDB BatchWriteItem
      const chunkSize = 25;
      for (let i = 0; i < tasks.length; i += chunkSize) {
        const chunk = tasks.slice(i, i + chunkSize);
        await docClient.send(
          new BatchWriteCommand({
            RequestItems: {
              [TABLE_NAMES.TASKS]: chunk.map((item) => ({
                PutRequest: { Item: item },
              })),
            },
          })
        );
      }
      return tasks;
    } catch (err: any) {
      if (err.name === 'ResourceNotFoundException' || err.name === 'UnrecognizedClientException') {
        tasks.forEach((t) => memoryTasks.set(t.taskId, { ...t }));
        return tasks;
      }
      throw err;
    }
  },

  async getById(taskId: string, eventId: string, ownerId: string): Promise<TaskItem | null> {
    if (isMockDbMode) {
      const task = memoryTasks.get(taskId);
      if (task && task.eventId === eventId && task.ownerId === ownerId) {
        return { ...task };
      }
      return null;
    }

    try {
      const res = await docClient.send(
        new GetCommand({
          TableName: TABLE_NAMES.TASKS,
          Key: { taskId },
        })
      );
      if (!res.Item) return null;
      const task = res.Item as TaskItem;
      if (task.eventId === eventId && task.ownerId === ownerId) {
        return task;
      }
      return null;
    } catch (err: any) {
      if (err.name === 'ResourceNotFoundException' || err.name === 'UnrecognizedClientException') {
        const task = memoryTasks.get(taskId);
        if (task && task.eventId === eventId && task.ownerId === ownerId) {
          return { ...task };
        }
        return null;
      }
      throw err;
    }
  },

  async listByEvent(
    eventId: string,
    ownerId: string,
    filter?: { status?: string; priority?: string }
  ): Promise<TaskItem[]> {
    if (isMockDbMode) {
      return Array.from(memoryTasks.values())
        .filter((t) => t.eventId === eventId && t.ownerId === ownerId)
        .filter((t) => (filter?.status ? t.status === filter.status : true))
        .filter((t) => (filter?.priority ? t.priority === filter.priority : true))
        .sort((a, b) => a.deadline.localeCompare(b.deadline));
    }

    try {
      const res = await docClient.send(
        new QueryCommand({
          TableName: TABLE_NAMES.TASKS,
          IndexName: 'EventIndex',
          KeyConditionExpression: 'eventId = :eventId',
          ExpressionAttributeValues: {
            ':eventId': eventId,
          },
        })
      );
      let items = (res.Items as TaskItem[]) || [];
      // Verify ownerId
      items = items.filter((t) => t.ownerId === ownerId);

      if (filter?.status) {
        items = items.filter((t) => t.status === filter.status);
      }
      if (filter?.priority) {
        items = items.filter((t) => t.priority === filter.priority);
      }
      return items.sort((a, b) => a.deadline.localeCompare(b.deadline));
    } catch (err: any) {
      if (err.name === 'ResourceNotFoundException' || err.name === 'UnrecognizedClientException') {
        return Array.from(memoryTasks.values())
          .filter((t) => t.eventId === eventId && t.ownerId === ownerId)
          .filter((t) => (filter?.status ? t.status === filter.status : true))
          .filter((t) => (filter?.priority ? t.priority === filter.priority : true))
          .sort((a, b) => a.deadline.localeCompare(b.deadline));
      }
      throw err;
    }
  },

  async update(
    taskId: string,
    eventId: string,
    ownerId: string,
    updates: Partial<TaskItem>
  ): Promise<TaskItem> {
    const existing = await this.getById(taskId, eventId, ownerId);
    if (!existing) {
      throw new Error(`Task with id ${taskId} not found or unauthorized`);
    }

    const updated: TaskItem = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    if (isMockDbMode) {
      memoryTasks.set(taskId, updated);
      return updated;
    }

    try {
      await docClient.send(
        new PutCommand({
          TableName: TABLE_NAMES.TASKS,
          Item: updated,
        })
      );
      return updated;
    } catch (err: any) {
      if (err.name === 'ResourceNotFoundException' || err.name === 'UnrecognizedClientException') {
        memoryTasks.set(taskId, updated);
        return updated;
      }
      throw err;
    }
  },

  async delete(taskId: string, eventId: string, ownerId: string): Promise<void> {
    const existing = await this.getById(taskId, eventId, ownerId);
    if (!existing) {
      throw new Error(`Task with id ${taskId} not found or unauthorized`);
    }

    if (isMockDbMode) {
      memoryTasks.delete(taskId);
      return;
    }

    try {
      await docClient.send(
        new DeleteCommand({
          TableName: TABLE_NAMES.TASKS,
          Key: { taskId },
        })
      );
    } catch (err: any) {
      if (err.name === 'ResourceNotFoundException' || err.name === 'UnrecognizedClientException') {
        memoryTasks.delete(taskId);
        return;
      }
      throw err;
    }
  },

  _resetMemory(): void {
    memoryTasks.clear();
  },
  _setMemory(task: TaskItem): void {
    memoryTasks.set(task.taskId, task);
  }
};
