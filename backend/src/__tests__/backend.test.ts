import { describe, it, expect, beforeEach } from 'vitest';
import { eventsRepository } from '../repositories/eventsRepository.js';
import { tasksRepository } from '../repositories/tasksRepository.js';
import { rescueRepository } from '../repositories/rescueRepository.js';
import { conversationsRepository } from '../repositories/conversationsRepository.js';
import { eventService } from '../services/eventService.js';
import { taskService } from '../services/taskService.js';
import { rescueService } from '../services/rescueService.js';
import { AgentEngine } from '../agent/agentEngine.js';

describe('EventMate AI - Backend Core Tests', () => {
  const TEST_OWNER = 'user_test_123';
  const OTHER_OWNER = 'user_other_999';

  beforeEach(() => {
    eventsRepository._resetMemory();
    tasksRepository._resetMemory();
    rescueRepository._resetMemory();
    conversationsRepository._resetMemory();
  });

  describe('Events Service & Ownership Verification', () => {
    it('creates an event successfully with default planning status', async () => {
      const event = await eventService.createEvent(TEST_OWNER, {
        title: 'AWS Cloud Workshop 2026',
        type: 'technical-workshop',
        date: '2026-11-20',
        location: 'Colombo Innovation Hub',
        format: 'in-person',
        participants: 100,
        budget: 25000,
        currency: 'LKR',
        duration: '4 hours',
      });

      expect(event.eventId).toBeDefined();
      expect(event.ownerId).toBe(TEST_OWNER);
      expect(event.title).toBe('AWS Cloud Workshop 2026');
      expect(event.status).toBe('planning');
    });

    it('retrieves an event for the authorized owner', async () => {
      const created = await eventService.createEvent(TEST_OWNER, {
        title: 'Community Tech Meetup',
        type: 'meetup',
        date: '2026-12-05',
        location: 'Online',
        format: 'online',
        participants: 50,
        budget: 5000,
        currency: 'LKR',
        duration: '2 hours',
      });

      const fetched = await eventService.getEvent(TEST_OWNER, created.eventId);
      expect(fetched.eventId).toBe(created.eventId);
    });

    it('rejects access when unauthorized user attempts to view or update event', async () => {
      const created = await eventService.createEvent(TEST_OWNER, {
        title: 'Private Leadership Retreat',
        type: 'retreat',
        date: '2026-11-30',
        location: 'Campus Hall B',
        format: 'in-person',
        participants: 20,
        budget: 15000,
        currency: 'LKR',
        duration: '1 day',
      });

      await expect(
        eventService.getEvent(OTHER_OWNER, created.eventId)
      ).rejects.toThrow('Event not found or access denied');

      await expect(
        eventService.updateEvent(OTHER_OWNER, created.eventId, { title: 'Hacked Title' })
      ).rejects.toThrow('Event not found or access denied');
    });
  });

  describe('Tasks Service & Real DynamoDB Progress Calculation', () => {
    it('creates, updates status, and calculates accurate progress percentage', async () => {
      const event = await eventService.createEvent(TEST_OWNER, {
        title: 'Hackathon 2026',
        type: 'hackathon',
        date: '2026-12-15',
        location: 'University Auditorium',
        format: 'in-person',
        participants: 150,
        budget: 50000,
        currency: 'LKR',
        duration: '24 hours',
      });

      // Initially 0 tasks = 0%
      let progress = await eventService.calculateProgress(TEST_OWNER, event.eventId);
      expect(progress.totalTasks).toBe(0);
      expect(progress.percentage).toBe(0);

      // Add 2 tasks
      const task1 = await taskService.createTask(TEST_OWNER, event.eventId, {
        title: 'Confirm Speaker',
        category: 'speakers',
        priority: 'high',
        status: 'not_started',
        deadline: '2026-11-10',
      });

      const task2 = await taskService.createTask(TEST_OWNER, event.eventId, {
        title: 'Book Auditorium',
        category: 'venue_tech',
        priority: 'high',
        status: 'not_started',
        deadline: '2026-11-05',
      });

      progress = await eventService.calculateProgress(TEST_OWNER, event.eventId);
      expect(progress.totalTasks).toBe(2);
      expect(progress.completedTasks).toBe(0);
      expect(progress.highPriorityPendingTasks).toBe(2);
      expect(progress.percentage).toBe(0);

      // Complete task1
      await taskService.updateTask(TEST_OWNER, event.eventId, task1.taskId, {
        status: 'completed',
      });

      progress = await eventService.calculateProgress(TEST_OWNER, event.eventId);
      expect(progress.completedTasks).toBe(1);
      expect(progress.pendingTasks).toBe(1);
      expect(progress.highPriorityPendingTasks).toBe(1);
      expect(progress.percentage).toBe(50);

      // Set task2 to in_progress (worth 50% weight) -> 100% of 1 + 50% of 1 = 1.5 / 2 = 75%
      await taskService.updateTask(TEST_OWNER, event.eventId, task2.taskId, {
        status: 'in_progress',
      });

      progress = await eventService.calculateProgress(TEST_OWNER, event.eventId);
      expect(progress.inProgressTasks).toBe(1);
      expect(progress.percentage).toBe(75);
    });

    it('prevents task creation on non-existent or unauthorized event', async () => {
      await expect(
        taskService.createTask(TEST_OWNER, 'non_existent_event_id', {
          title: 'Invalid Task',
          category: 'venue_tech',
          priority: 'low',
          deadline: '2026-12-01',
        })
      ).rejects.toThrow('Event not found or unauthorized');
    });
  });

  describe('Signature Feature: Plan Rescue Workflow', () => {
    it('generates a rescue proposal without automatically altering tasks before approval', async () => {
      const event = await eventService.createEvent(TEST_OWNER, {
        title: 'AWS Student Bootcamp',
        type: 'technical-workshop',
        date: '2026-11-20',
        location: 'Lab 4',
        format: 'in-person',
        participants: 100,
        budget: 20000,
        currency: 'LKR',
        duration: '4 hours',
      });

      const originalSpeakerTask = await taskService.createTask(TEST_OWNER, event.eventId, {
        title: 'Confirm Keynote Speaker',
        category: 'speakers',
        priority: 'high',
        status: 'in_progress',
        deadline: '2026-11-18',
      });

      // Trigger Plan Rescue for speaker cancellation
      const proposal = await rescueService.proposeRescue(
        TEST_OWNER,
        event.eventId,
        'Our main speaker just cancelled, and the workshop is tomorrow'
      );

      expect(proposal.proposalId).toBeDefined();
      expect(proposal.approvalStatus).toBe('pending');
      expect(proposal.options.length).toBeGreaterThanOrEqual(2);
      expect(proposal.recommendedSolution).toBeDefined();
      expect(proposal.proposedTaskChanges.length).toBeGreaterThan(0);

      // Verify task in database has NOT been modified yet!
      const taskInDb = await taskService.getTask(TEST_OWNER, event.eventId, originalSpeakerTask.taskId);
      expect(taskInDb.title).toBe('Confirm Keynote Speaker');
    });

    it('applies rescue proposal only upon explicit user approval, and prevents duplicate execution', async () => {
      const event = await eventService.createEvent(TEST_OWNER, {
        title: 'AWS Hands-on Lab',
        type: 'technical-workshop',
        date: '2026-11-20',
        location: 'Room 101',
        format: 'in-person',
        participants: 100,
        budget: 20000,
        currency: 'LKR',
        duration: '4 hours',
      });

      const speakerTask = await taskService.createTask(TEST_OWNER, event.eventId, {
        title: 'Confirm Keynote Speaker',
        category: 'speakers',
        priority: 'high',
        deadline: '2026-11-19',
      });

      const proposal = await rescueService.proposeRescue(
        TEST_OWNER,
        event.eventId,
        'Speaker cancelled last minute'
      );

      // Apply the rescue plan
      const result = await rescueService.applyRescue(TEST_OWNER, event.eventId, proposal.proposalId);
      expect(result.proposal.approvalStatus).toBe('approved');
      expect(result.addedTasksCount).toBeGreaterThan(0);

      // Verify that database tasks now reflect the approved pivot
      const updatedSpeakerTask = await taskService.getTask(TEST_OWNER, event.eventId, speakerTask.taskId);
      expect(updatedSpeakerTask.title).toContain('Pivot');

      // Duplicate application must be prevented!
      await expect(
        rescueService.applyRescue(TEST_OWNER, event.eventId, proposal.proposalId)
      ).rejects.toThrow('This rescue proposal has already been applied');
    });

    it('rejects rescue application across unauthorized users', async () => {
      const event = await eventService.createEvent(TEST_OWNER, {
        title: 'University Hack',
        type: 'hackathon',
        date: '2026-12-01',
        location: 'Main Hall',
        format: 'in-person',
        participants: 80,
        budget: 30000,
        currency: 'LKR',
        duration: '12 hours',
      });

      const proposal = await rescueService.proposeRescue(
        TEST_OWNER,
        event.eventId,
        'Power failure risk at venue'
      );

      await expect(
        rescueService.applyRescue(OTHER_OWNER, event.eventId, proposal.proposalId)
      ).rejects.toThrow('Event not found or unauthorized');
    });
  });

  describe('Agent Engine Tool Dispatch & Error Handling', () => {
    it('executes list_event_tasks tool correctly', async () => {
      const event = await eventService.createEvent(TEST_OWNER, {
        title: 'Test Tech Talk',
        type: 'talk',
        date: '2026-10-30',
        location: 'Virtual',
        format: 'online',
        participants: 40,
        budget: 0,
        currency: 'LKR',
        duration: '1 hour',
      });

      await taskService.createTask(TEST_OWNER, event.eventId, {
        title: 'Test Setup Mic',
        category: 'venue_tech',
        priority: 'medium',
        deadline: '2026-10-29',
      });

      const result = await AgentEngine.executeTool(
        'list_event_tasks',
        { eventId: event.eventId },
        TEST_OWNER,
        event.eventId
      );

      expect(result.status).toBe('success');
      expect(result.count).toBe(1);
    });

    it('rejects unknown tools with controlled error', async () => {
      await expect(
        AgentEngine.executeTool(
          'non_existent_tool',
          {},
          TEST_OWNER,
          'evt_123'
        )
      ).rejects.toThrow('Unknown tool requested: non_existent_tool');
    });

    it('rejects invalid tool arguments with schema validation error', async () => {
      await expect(
        AgentEngine.executeTool(
          'add_event_task',
          { eventId: 'evt_123', task: { title: 'Missing category and deadline' } },
          TEST_OWNER,
          'evt_123'
        )
      ).rejects.toThrow();
    });

    it('handles multi-turn chat and responds with calm, helpful guidance', async () => {
      const event = await eventService.createEvent(TEST_OWNER, {
        title: 'AWS Hands-on Workshop for 100 Students',
        type: 'technical-workshop',
        date: '2026-11-20',
        location: 'Colombo Innovation Lab',
        format: 'in-person',
        participants: 100,
        budget: 25000,
        currency: 'LKR',
        duration: '4 hours',
      });

      await taskService.createTask(TEST_OWNER, event.eventId, {
        title: 'Confirm Workshop Speaker',
        category: 'speakers',
        priority: 'high',
        status: 'not_started',
        deadline: '2026-11-10',
      });

      // Query priority tasks
      const res1 = await AgentEngine.chat(
        TEST_OWNER,
        event.eventId,
        'What are my three most important tasks right now?'
      );
      expect(res1.reply).toContain('Confirm Workshop Speaker');
      expect(res1.toolExecutions.length).toBeGreaterThan(0);

      // Report speaker cancellation -> triggers Plan Rescue
      const res2 = await AgentEngine.chat(
        TEST_OWNER,
        event.eventId,
        'The speaker has cancelled. What should I do?'
      );
      expect(res2.reply).toContain('No panic');
      expect(res2.toolExecutions.some((t) => t.toolName === 'propose_rescue_plan')).toBe(true);

      // Verify conversation memory is persisted
      const messages = await conversationsRepository.getRecentMessages(event.eventId, TEST_OWNER);
      expect(messages.length).toBeGreaterThanOrEqual(4);
    });

    it('blocks cross-event tampering when agent tool targets another eventId', async () => {
      await expect(
        AgentEngine.executeTool(
          'list_event_tasks',
          { eventId: 'evt_victim_999' },
          TEST_OWNER,
          'evt_legitimate_123'
        )
      ).rejects.toThrow('Security validation failed');
    });
  });

  describe('Security & Anti-Tampering Protections', () => {
    it('prevents mass assignment of ownerId or eventId on event updates', async () => {
      const event = await eventService.createEvent(TEST_OWNER, {
        title: 'Original Title',
        type: 'meetup',
        date: '2026-11-20',
        location: 'Hall A',
        format: 'in-person',
        participants: 50,
        budget: 10000,
        currency: 'LKR',
        duration: '2 hours',
      });

      // Attempt to tamper with ownerId
      const updated = await eventService.updateEvent(TEST_OWNER, event.eventId, {
        title: 'Updated Title',
        ...({ ownerId: 'attacker_takeover', eventId: 'evt_fake' } as any),
      });

      expect(updated.title).toBe('Updated Title');
      expect(updated.ownerId).toBe(TEST_OWNER); // Must remain TEST_OWNER!
      expect(updated.eventId).toBe(event.eventId); // Must remain original eventId!
    });

    it('prevents mass assignment of ownerId or eventId on task updates', async () => {
      const event = await eventService.createEvent(TEST_OWNER, {
        title: 'Secure Event',
        type: 'workshop',
        date: '2026-11-20',
        location: 'Lab 1',
        format: 'in-person',
        participants: 30,
        budget: 5000,
        currency: 'LKR',
        duration: '2 hours',
      });

      const task = await taskService.createTask(TEST_OWNER, event.eventId, {
        title: 'Original Task',
        category: 'venue_tech',
        priority: 'medium',
        deadline: '2026-11-15',
      });

      const updated = await taskService.updateTask(TEST_OWNER, event.eventId, task.taskId, {
        title: 'Tampered Task',
        ...({ ownerId: 'hacker_user', eventId: 'evt_foreign' } as any),
      });

      expect(updated.title).toBe('Tampered Task');
      expect(updated.ownerId).toBe(TEST_OWNER);
      expect(updated.eventId).toBe(event.eventId);
    });
  });
});
