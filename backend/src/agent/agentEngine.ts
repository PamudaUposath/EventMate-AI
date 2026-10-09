import {
  BedrockRuntimeClient,
  ConverseCommand,
  Message as BedrockMessage,
  ContentBlock,
} from '@aws-sdk/client-bedrock-runtime';
import { SYSTEM_PROMPT } from './agentPrompts.js';
import { AGENT_BEDROCK_TOOLS } from './agentTools.js';
import { eventService } from '../services/eventService.js';
import { taskService } from '../services/taskService.js';
import { rescueService } from '../services/rescueService.js';
import { conversationsRepository } from '../repositories/conversationsRepository.js';
import {
  ToolCreateEventPlanSchema,
  ToolGetEventDetailsSchema,
  ToolListEventTasksSchema,
  ToolAddEventTaskSchema,
  ToolUpdateEventTaskSchema,
  ToolGetEventProgressSchema,
  ToolProposeRescuePlanSchema,
  ToolApplyRescuePlanSchema,
} from '../schemas/index.js';

const region = process.env.AWS_REGION || 'us-east-1';
const modelId = process.env.BEDROCK_MODEL_ID || 'amazon.nova-lite-v1:0';

const bedrockClient = new BedrockRuntimeClient({ region });

export interface AgentChatResult {
  reply: string;
  toolExecutions: Array<{
    toolName: string;
    toolInput: Record<string, any>;
    toolOutput: Record<string, any>;
  }>;
  conversationId: string;
}

export class AgentEngine {
  /**
   * Executes a specific tool by name with input validation and ownership checking
   */
  static async executeTool(
    toolName: string,
    toolInput: Record<string, any>,
    ownerId: string,
    eventId: string
  ): Promise<any> {
    // Defense-in-depth: Prevent cross-event context drift or prompt injection tampering
    if (toolName !== 'create_event_plan' && toolInput.eventId && toolInput.eventId !== eventId) {
      throw new Error(`Security validation failed: Tool calls are restricted to the active event context.`);
    }

    switch (toolName) {
      case 'create_event_plan': {
        const validated = ToolCreateEventPlanSchema.parse(toolInput);
        const event = await eventService.createEvent(ownerId, {
          title: validated.eventName,
          type: validated.eventType,
          date: validated.date,
          location: validated.location,
          participants: validated.participants,
          budget: validated.budget,
          currency: validated.currency,
          duration: validated.duration,
          additionalRequirements: validated.additionalRequirements,
          format: 'in-person',
        });

        // Generate tailored initial tasks based on event type
        const isTechnical =
          validated.eventType.toLowerCase().includes('tech') ||
          validated.eventType.toLowerCase().includes('workshop') ||
          validated.eventName.toLowerCase().includes('aws');

        const initialTasks = isTechnical
          ? [
              {
                title: 'Confirm Workshop Speaker & Topic Outline',
                description: 'Finalize speaker availability and hands-on session content roadmap.',
                category: 'speakers' as const,
                priority: 'high' as const,
                deadline: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
              },
              {
                title: 'Reserve Lab Facility & High-Speed Internet',
                description: 'Ensure lab PCs and Wi-Fi can support 100 concurrent active users.',
                category: 'venue_tech' as const,
                priority: 'high' as const,
                deadline: new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0],
              },
              {
                title: 'Prepare AWS Workshop Lab Environment & IAM Sandboxes',
                description: 'Configure event engine or test participant IAM credentials and credits.',
                category: 'content_labs' as const,
                priority: 'high' as const,
                deadline: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
              },
              {
                title: 'Launch Participant Registration Form & Promotion',
                description: 'Publish sign-up page on student clubs portal and WhatsApp channels.',
                category: 'marketing_registration' as const,
                priority: 'medium' as const,
                deadline: new Date(Date.now() + 12 * 86400000).toISOString().split('T')[0],
              },
              {
                title: 'Arrange Refreshments & Logistics Support Team',
                description: 'Coordinate light catering and assign student volunteer roles.',
                category: 'logistics_catering' as const,
                priority: 'medium' as const,
                deadline: new Date(Date.now() + 16 * 86400000).toISOString().split('T')[0],
              },
            ]
          : [
              {
                title: 'Confirm Main Program Agenda & Hosts',
                description: 'Outline timing, activities, and host assignments.',
                category: 'content_labs' as const,
                priority: 'high' as const,
                deadline: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
              },
              {
                title: 'Book Venue & Audio/Visual Equipment',
                description: 'Confirm booking reservation and AV equipment support.',
                category: 'venue_tech' as const,
                priority: 'high' as const,
                deadline: new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0],
              },
              {
                title: 'Open Attendee Registration & Public Announcements',
                description: 'Distribute posters and online registration link.',
                category: 'marketing_registration' as const,
                priority: 'medium' as const,
                deadline: new Date(Date.now() + 12 * 86400000).toISOString().split('T')[0],
              },
            ];

        const createdTasks = await taskService.createBatch(ownerId, event.eventId, initialTasks);
        return {
          status: 'success',
          event,
          tasksCount: createdTasks.length,
          tasks: createdTasks,
        };
      }

      case 'get_event_details': {
        const validated = ToolGetEventDetailsSchema.parse({
          eventId: toolInput.eventId || eventId,
        });
        const details = await eventService.getEvent(ownerId, validated.eventId);
        return { status: 'success', event: details };
      }

      case 'list_event_tasks': {
        const validated = ToolListEventTasksSchema.parse({
          eventId: toolInput.eventId || eventId,
          status: toolInput.status,
          priority: toolInput.priority,
        });
        const tasks = await taskService.listTasks(ownerId, validated.eventId, {
          status: validated.status,
          priority: validated.priority,
        });
        return {
          status: 'success',
          count: tasks.length,
          tasks,
        };
      }

      case 'add_event_task': {
        const validated = ToolAddEventTaskSchema.parse({
          eventId: toolInput.eventId || eventId,
          task: toolInput.task || toolInput,
        });
        const newTask = await taskService.createTask(
          ownerId,
          validated.eventId,
          validated.task
        );
        return { status: 'success', task: newTask };
      }

      case 'update_event_task': {
        const validated = ToolUpdateEventTaskSchema.parse({
          eventId: toolInput.eventId || eventId,
          taskId: toolInput.taskId,
          updates: toolInput.updates || {
            status: toolInput.status,
            priority: toolInput.priority,
            deadline: toolInput.deadline,
            title: toolInput.title,
            description: toolInput.description,
          },
        });
        const updated = await taskService.updateTask(
          ownerId,
          validated.eventId,
          validated.taskId,
          validated.updates
        );
        return { status: 'success', task: updated };
      }

      case 'get_event_progress': {
        const validated = ToolGetEventProgressSchema.parse({
          eventId: toolInput.eventId || eventId,
        });
        const progress = await eventService.calculateProgress(ownerId, validated.eventId);
        return { status: 'success', progress };
      }

      case 'propose_rescue_plan': {
        const validated = ToolProposeRescuePlanSchema.parse({
          eventId: toolInput.eventId || eventId,
          problemDescription: toolInput.problemDescription,
        });
        const proposal = await rescueService.proposeRescue(
          ownerId,
          validated.eventId,
          validated.problemDescription
        );
        return {
          status: 'success',
          proposalId: proposal.proposalId,
          problemSummary: proposal.problemSummary,
          recommendedSolution: proposal.recommendedSolution,
          optionsCount: proposal.options.length,
          options: proposal.options,
          proposedTaskChanges: proposal.proposedTaskChanges,
          explanation: proposal.explanation,
          immediateNextActions: proposal.immediateNextActions,
        };
      }

      case 'apply_rescue_plan': {
        const validated = ToolApplyRescuePlanSchema.parse({
          eventId: toolInput.eventId || eventId,
          proposalId: toolInput.proposalId,
        });
        const result = await rescueService.applyRescue(
          ownerId,
          validated.eventId,
          validated.proposalId
        );
        return { status: 'success', ...result };
      }

      default:
        throw new Error(`Unknown tool requested: ${toolName}`);
    }
  }

  /**
   * Primary entry point for multi-turn agent conversation
   */
  static async chat(
    ownerId: string,
    eventId: string,
    userMessage: string
  ): Promise<AgentChatResult> {
    // 1. Fetch current event context
    const event = await eventService.getEvent(ownerId, eventId);

    // 2. Load recent conversation history (bounded to 20 messages)
    const history = await conversationsRepository.getRecentMessages(eventId, ownerId, 20);

    const executedTools: Array<{
      toolName: string;
      toolInput: Record<string, any>;
      toolOutput: Record<string, any>;
    }> = [];

    let finalReply = '';

    // Check if live Bedrock client can be reached or fallback to deterministic agent
    const canUseBedrock =
      process.env.USE_MOCK_BEDROCK !== 'true' &&
      (process.env.AWS_ACCESS_KEY_ID || process.env.AWS_EXECUTION_ENV || process.env.AWS_LAMBDA_FUNCTION_NAME);

    if (canUseBedrock) {
      try {
        finalReply = await this.executeBedrockConverse(
          event,
          history,
          userMessage,
          ownerId,
          eventId,
          executedTools
        );
      } catch (err: any) {
        console.warn('[Bedrock] Converse error, falling back to local agent dispatch:', err.message);
        finalReply = await this.executeDeterministicAgent(
          event,
          userMessage,
          ownerId,
          eventId,
          executedTools
        );
      }
    } else {
      // Local deterministic agent engine for offline development & tests
      finalReply = await this.executeDeterministicAgent(
        event,
        userMessage,
        ownerId,
        eventId,
        executedTools
      );
    }

    // 3. Persist conversation history
    const now = new Date().toISOString();
    await conversationsRepository.appendMessage(eventId, ownerId, {
      role: 'user',
      content: userMessage,
      timestamp: now,
    });

    const assistantMsg = await conversationsRepository.appendMessage(eventId, ownerId, {
      role: 'assistant',
      content: finalReply,
      timestamp: new Date().toISOString(),
      toolExecutions: executedTools,
    });

    return {
      reply: finalReply,
      toolExecutions: executedTools,
      conversationId: assistantMsg.conversationId,
    };
  }

  /**
   * Bedrock Converse API multi-turn tool-calling loop
   */
  private static async executeBedrockConverse(
    event: any,
    history: any[],
    userMessage: string,
    ownerId: string,
    eventId: string,
    executedTools: any[]
  ): Promise<string> {
    const systemPromptWithContext = `${SYSTEM_PROMPT}

CURRENT EVENT CONTEXT:
- Title: ${event.title}
- Type: ${event.type}
- Date: ${event.date}
- Location: ${event.location}
- Format: ${event.format}
- Participants: ${event.participants}
- Budget: ${event.budget} ${event.currency}
- Duration: ${event.duration}
- Event ID: ${eventId}`;

    // Convert saved messages to Bedrock format
    const messages: BedrockMessage[] = [];
    for (const msg of history) {
      messages.push({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: [{ text: msg.content }],
      });
    }

    // Append new user message
    messages.push({
      role: 'user',
      content: [{ text: userMessage }],
    });

    const MAX_TOOL_ITERATIONS = 5;
    let iteration = 0;

    while (iteration < MAX_TOOL_ITERATIONS) {
      iteration++;

      const command = new ConverseCommand({
        modelId,
        system: [{ text: systemPromptWithContext }],
        messages,
        toolConfig: {
          tools: AGENT_BEDROCK_TOOLS,
        },
        inferenceConfig: {
          maxTokens: 1500,
          temperature: 0.3,
        },
      });

      const response = await bedrockClient.send(command);
      const outputMessage = response.output?.message;

      if (!outputMessage) {
        throw new Error('Received empty response from Amazon Bedrock');
      }

      messages.push(outputMessage);

      // Check if model requested any tool uses
      const toolUseBlocks = outputMessage.content?.filter((c) => c.toolUse) || [];

      if (toolUseBlocks.length === 0) {
        // Model provided final text
        const textBlocks = outputMessage.content?.filter((c) => c.text) || [];
        return textBlocks.map((t) => t.text).join('\n') || 'I am ready to help you coordinate your event.';
      }

      // Execute each tool use block
      const toolResultBlocks: ContentBlock[] = [];

      for (const block of toolUseBlocks) {
        const toolUse = block.toolUse!;
        const toolName = toolUse.name!;
        const toolInput = (toolUse.input as Record<string, any>) || {};

        try {
          const result = await this.executeTool(toolName, toolInput, ownerId, eventId);
          executedTools.push({
            toolName,
            toolInput,
            toolOutput: result,
          });

          toolResultBlocks.push({
            toolResult: {
              toolUseId: toolUse.toolUseId,
              content: [{ json: result }],
              status: 'success',
            },
          });
        } catch (err: any) {
          toolResultBlocks.push({
            toolResult: {
              toolUseId: toolUse.toolUseId,
              content: [{ text: `Tool error: ${err.message}` }],
              status: 'error',
            },
          });
        }
      }

      // Send tool results back to Converse API
      messages.push({
        role: 'user',
        content: toolResultBlocks,
      });
    }

    return 'I completed the requested event actions. What would you like to focus on next?';
  }

  /**
   * Deterministic AI co-organiser router for local testing & offline judging demo
   */
  private static async executeDeterministicAgent(
    event: any,
    userMessage: string,
    ownerId: string,
    eventId: string,
    executedTools: any[]
  ): Promise<string> {
    const textLower = userMessage.toLowerCase();

    // 1. Plan Rescue triggers (speaker cancelled, venue unavailable, budget cut, problem)
    if (
      textLower.includes('cancel') ||
      textLower.includes('speaker') && (textLower.includes('drop') || textLower.includes('sick') || textLower.includes('tomorrow')) ||
      textLower.includes('what should i do') && (textLower.includes('problem') || textLower.includes('cancel')) ||
      textLower.includes('rescue') ||
      textLower.includes('venue') && textLower.includes('unavailable') ||
      textLower.includes('budget') && textLower.includes('cut')
    ) {
      const rescueResult = await this.executeTool(
        'propose_rescue_plan',
        {
          eventId,
          problemDescription: userMessage,
        },
        ownerId,
        eventId
      );

      executedTools.push({
        toolName: 'propose_rescue_plan',
        toolInput: { eventId, problemDescription: userMessage },
        toolOutput: rescueResult,
      });

      return `No panic. Let's work through this.

A sudden disruption like this is challenging, but we can definitely adapt without compromising attendee experience.

Here are the practical options I've prepared for you:
1. **${rescueResult.options[0]?.title}**: ${rescueResult.options[0]?.description}
2. **${rescueResult.options[1]?.title}** (Recommended): ${rescueResult.options[1]?.description}
${rescueResult.options[2] ? `3. **${rescueResult.options[2]?.title}**: ${rescueResult.options[2]?.description}` : ''}

**My Recommendation:**
${rescueResult.explanation}

I have drafted a Plan Rescue proposal (ID: \`${rescueResult.proposalId}\`). You can review the interactive Change Preview on your screen right now and click **Apply Changes** to update your checklist!`;
    }

    // 2. Progress / Readiness inquiries
    if (
      textLower.includes('how ready') ||
      textLower.includes('progress') ||
      textLower.includes('readiness') ||
      textLower.includes('status')
    ) {
      const progressResult = await this.executeTool(
        'get_event_progress',
        { eventId },
        ownerId,
        eventId
      );
      executedTools.push({
        toolName: 'get_event_progress',
        toolInput: { eventId },
        toolOutput: progressResult,
      });

      const p = progressResult.progress;
      return `Here is your current preparation status for "${event.title}":

• Overall Readiness: ${p.percentage}% (${p.readinessLevel})
• Completed Tasks: ${p.completedTasks} of ${p.totalTasks}
• In-Progress Tasks: ${p.inProgressTasks}
• Pending Tasks: ${p.pendingTasks}
• High-Priority Items Remaining: ${p.highPriorityPendingTasks}

${
  p.highPriorityPendingTasks > 0
    ? `You have ${p.highPriorityPendingTasks} critical task(s) needing attention soon. Would you like me to highlight them?`
    : `Great job! Your highest priority tasks are on track.`
}`;
    }

    // 3. Next tasks / priority tasks
    if (
      textLower.includes('next') ||
      textLower.includes('important') ||
      textLower.includes('priority') ||
      textLower.includes('three most') ||
      textLower.includes('urgent') ||
      textLower.includes('what should i work on')
    ) {
      const tasksResult = await this.executeTool(
        'list_event_tasks',
        { eventId },
        ownerId,
        eventId
      );
      executedTools.push({
        toolName: 'list_event_tasks',
        toolInput: { eventId },
        toolOutput: tasksResult,
      });

      const highPriority = tasksResult.tasks
        .filter((t: any) => t.status !== 'completed' && t.priority === 'high')
        .slice(0, 3);

      const itemsToShow =
        highPriority.length > 0
          ? highPriority
          : tasksResult.tasks.filter((t: any) => t.status !== 'completed').slice(0, 3);

      if (itemsToShow.length === 0) {
        return `All your scheduled tasks for "${event.title}" are completed! You are in great shape for event day. Let me know if you would like to brainstorm promotional ideas or a post-event survey.`;
      }

      const listStr = itemsToShow
        .map(
          (t: any, idx: number) =>
            `${idx + 1}. ${t.title} (Priority: ${t.priority.toUpperCase()}, Deadline: ${t.deadline})\n   ${t.description || 'Core deliverable'}`
        )
        .join('\n\n');

      return `Here are the top priority tasks to focus on right now for "${event.title}":\n\n${listStr}\n\nWould you like me to help you mark any of these as completed or update their deadlines?`;
    }

    // 4. Marking tasks completed
    if (
      textLower.includes('mark') &&
      (textLower.includes('complete') || textLower.includes('done'))
    ) {
      const tasksResult = await this.executeTool(
        'list_event_tasks',
        { eventId },
        ownerId,
        eventId
      );

      // Search for best matching task
      const match = tasksResult.tasks.find((t: any) => {
        const titleWords = t.title.toLowerCase().split(' ');
        return titleWords.some((w: string) => w.length > 3 && textLower.includes(w));
      });

      if (match) {
        const updateResult = await this.executeTool(
          'update_event_task',
          {
            eventId,
            taskId: match.taskId,
            updates: { status: 'completed' },
          },
          ownerId,
          eventId
        );

        executedTools.push({
          toolName: 'update_event_task',
          toolInput: { eventId, taskId: match.taskId, status: 'completed' },
          toolOutput: updateResult,
        });

        return `Done! I've marked "${match.title}" as completed in your database checklist. Your readiness score has been updated. What would you like to work on next?`;
      }
    }

    // 5. Default helpful co-organiser response
    const tasksResult = await this.executeTool(
      'list_event_tasks',
      { eventId },
      ownerId,
      eventId
    );
    executedTools.push({
      toolName: 'list_event_tasks',
      toolInput: { eventId },
      toolOutput: { count: tasksResult.count },
    });

    return `I am here as your co-organiser for "${event.title}" (${event.date} in ${event.location}).

You have ${tasksResult.count} tasks on your preparation board. You can ask me to:
• "What are my three most important tasks right now?"
• "How ready is my event?"
• "Mark [task name] as completed"
• Use Plan Rescue if you face any last-minute surprises like speaker or venue issues!`;
  }
}
