import { Tool } from '@aws-sdk/client-bedrock-runtime';

export const AGENT_BEDROCK_TOOLS: Tool[] = [
  {
    toolSpec: {
      name: 'create_event_plan',
      description: 'Generates a structured event plan and initial preparation checklist in DynamoDB when the user explicitly requests event plan creation.',
      inputSchema: {
        json: {
          type: 'object',
          properties: {
            eventName: { type: 'string', description: 'Name of the event' },
            eventType: { type: 'string', description: 'Type of the event (e.g., technical-workshop, hackathon)' },
            date: { type: 'string', description: 'Date in YYYY-MM-DD format' },
            location: { type: 'string', description: 'Event venue or online platform' },
            participants: { type: 'number', description: 'Expected attendee count' },
            budget: { type: 'number', description: 'Total allocated budget' },
            currency: { type: 'string', description: 'Currency code (e.g., LKR, USD)' },
            duration: { type: 'string', description: 'Duration (e.g. 4 hours)' },
            additionalRequirements: { type: 'string', description: 'Special requirements' },
          },
          required: ['eventName', 'eventType', 'date', 'location'],
        },
      },
    },
  },
  {
    toolSpec: {
      name: 'get_event_details',
      description: 'Retrieves current event information including format, participants, date, and budget.',
      inputSchema: {
        json: {
          type: 'object',
          properties: {
            eventId: { type: 'string', description: 'The unique ID of the event' },
          },
          required: ['eventId'],
        },
      },
    },
  },
  {
    toolSpec: {
      name: 'list_event_tasks',
      description: 'Retrieves current tasks for an event from DynamoDB, optionally filtered by status or priority.',
      inputSchema: {
        json: {
          type: 'object',
          properties: {
            eventId: { type: 'string', description: 'The unique ID of the event' },
            status: { type: 'string', enum: ['not_started', 'in_progress', 'completed'] },
            priority: { type: 'string', enum: ['high', 'medium', 'low'] },
          },
          required: ['eventId'],
        },
      },
    },
  },
  {
    toolSpec: {
      name: 'add_event_task',
      description: 'Validates and saves a new actionable preparation task to DynamoDB for an event.',
      inputSchema: {
        json: {
          type: 'object',
          properties: {
            eventId: { type: 'string', description: 'The event ID' },
            title: { type: 'string', description: 'Title of the task' },
            description: { type: 'string', description: 'Detailed instructions' },
            category: {
              type: 'string',
              enum: [
                'speakers',
                'venue_tech',
                'content_labs',
                'logistics_catering',
                'marketing_registration',
                'budget_admin',
                'team_coordination',
              ],
            },
            priority: { type: 'string', enum: ['high', 'medium', 'low'] },
            deadline: { type: 'string', description: 'Deadline in YYYY-MM-DD format' },
            assignedTo: { type: 'string', description: 'Optional assigned person' },
          },
          required: ['eventId', 'title', 'category', 'priority', 'deadline'],
        },
      },
    },
  },
  {
    toolSpec: {
      name: 'update_event_task',
      description: 'Updates an existing task status, deadline, priority, or details in DynamoDB.',
      inputSchema: {
        json: {
          type: 'object',
          properties: {
            eventId: { type: 'string', description: 'The event ID' },
            taskId: { type: 'string', description: 'The unique ID of the task to update' },
            status: { type: 'string', enum: ['not_started', 'in_progress', 'completed'] },
            priority: { type: 'string', enum: ['high', 'medium', 'low'] },
            deadline: { type: 'string', description: 'New deadline in YYYY-MM-DD' },
            title: { type: 'string' },
            description: { type: 'string' },
          },
          required: ['eventId', 'taskId'],
        },
      },
    },
  },
  {
    toolSpec: {
      name: 'get_event_progress',
      description: 'Calculates true event preparation progress and readiness score based on real database records.',
      inputSchema: {
        json: {
          type: 'object',
          properties: {
            eventId: { type: 'string', description: 'The event ID' },
          },
          required: ['eventId'],
        },
      },
    },
  },
  {
    toolSpec: {
      name: 'propose_rescue_plan',
      description: 'Signature Feature: Analyzes an unexpected problem (e.g. speaker cancellation, venue issue, budget cut) and produces structured solution options and proposed task modifications. Does not apply changes automatically.',
      inputSchema: {
        json: {
          type: 'object',
          properties: {
            eventId: { type: 'string', description: 'The event ID' },
            problemDescription: { type: 'string', description: 'Description of the disruption or problem' },
          },
          required: ['eventId', 'problemDescription'],
        },
      },
    },
  },
  {
    toolSpec: {
      name: 'apply_rescue_plan',
      description: 'Applies an approved Plan Rescue proposal to DynamoDB tasks after the user has reviewed and confirmed the change preview.',
      inputSchema: {
        json: {
          type: 'object',
          properties: {
            eventId: { type: 'string', description: 'The event ID' },
            proposalId: { type: 'string', description: 'The ID of the approved rescue proposal' },
          },
          required: ['eventId', 'proposalId'],
        },
      },
    },
  },
];
