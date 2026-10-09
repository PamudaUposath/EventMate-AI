import { v4 as uuidv4 } from 'uuid';
import { rescueRepository } from '../repositories/rescueRepository.js';
import { eventsRepository } from '../repositories/eventsRepository.js';
import { tasksRepository } from '../repositories/tasksRepository.js';
import {
  RescueProposal,
  RescueOption,
  ProposedTaskChange,
  TaskItem,
} from '../types/index.js';

export const rescueService = {
  async proposeRescue(
    ownerId: string,
    eventId: string,
    problemDescription: string,
    preferredOptionIndex?: number
  ): Promise<RescueProposal> {
    const event = await eventsRepository.getById(eventId, ownerId);
    if (!event) {
      const err: any = new Error('Event not found or unauthorized');
      err.statusCode = 404;
      throw err;
    }

    const currentTasks = await tasksRepository.listByEvent(eventId, ownerId);
    const problemLower = problemDescription.toLowerCase();

    // Contextual rescue analysis based on problem description and existing event tasks
    let options: RescueOption[] = [];
    let recommendedSolution = '';
    let explanation = '';
    let selectedOptionTitle = '';
    let proposedTaskChanges: ProposedTaskChange[] = [];
    let immediateNextActions: string[] = [];

    const eventDate = new Date(event.date);
    const today = new Date();
    const daysUntilEvent = Math.max(
      0,
      Math.ceil((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    );

    if (problemLower.includes('speaker') || problemLower.includes('cancelled') || problemLower.includes('host')) {
      options = [
        {
          optionId: 'opt_1',
          title: 'Emergency Speaker Replacement',
          description: 'Reach out to co-organisers, local community AWS Community Builders, or alumni who can step in.',
          isRecommended: false,
          recommendationReason: 'Good if an experienced substitute is immediately available, but risky within 24-48 hours.',
          tradeoffs: 'Requires rapid outreach and speaker briefing.',
        },
        {
          optionId: 'opt_2',
          title: 'Convert into Guided Hands-on Practical Lab',
          description: 'Pivot the keynote into a collaborative, hands-on workshop led by the organising leads using AWS step-by-step lab guides.',
          isRecommended: true,
          recommendationReason: `Recommended because your event is ${daysUntilEvent <= 2 ? 'imminent' : 'approaching'} and practical self-paced labs deliver high participant engagement with minimal external dependency.`,
          tradeoffs: 'Lab guides and cloud sandbox accounts must be tested in advance.',
        },
        {
          optionId: 'opt_3',
          title: 'Interactive Group Challenge / Mini-Hack',
          description: 'Restructure the session into teams building a prototype with mentors facilitating questions.',
          isRecommended: false,
          recommendationReason: 'Creates high energy, but requires team grouping and judging coordination.',
          tradeoffs: 'Requires dynamic facilitator involvement.',
        },
      ];

      const selectedOpt =
        preferredOptionIndex !== undefined && options[preferredOptionIndex]
          ? options[preferredOptionIndex]
          : options[1]; // default to recommended

      selectedOptionTitle = selectedOpt.title;
      recommendedSolution = selectedOpt.description;
      explanation = `No panic. Let's work through this together. Given the speaker cancellation, transitioning to a "${selectedOpt.title}" keeps your attendees actively engaged without relying on outside availability.`;

      immediateNextActions = [
        'Send a reassuring update to participants regarding the interactive lab focus.',
        'Review and test the hands-on lab walk-through materials with your core team.',
        'Assign 2 student leads to circulate and support attendees during the lab.',
      ];

      // Build task changes: Update speaker task, add lab prep tasks, keep unaffected tasks
      for (const t of currentTasks) {
        if (
          t.title.toLowerCase().includes('speaker') ||
          t.category === 'speakers'
        ) {
          proposedTaskChanges.push({
            changeType: 'update',
            taskId: t.taskId,
            title: `Pivot: Assign Internal Lab Mentors (Replaced Speaker Session)`,
            description: `Transitioned session to hands-on guided lab due to speaker unavailability. Mentors will facilitate.`,
            category: 'content_labs',
            priority: 'high',
            status: 'in_progress',
            deadline: t.deadline,
            reason: 'Adapted to replace cancelled external speaker',
          });
        } else {
          proposedTaskChanges.push({
            changeType: 'keep',
            taskId: t.taskId,
            title: t.title,
            category: t.category,
            priority: t.priority,
            status: t.status,
            deadline: t.deadline,
            reason: 'Task remains unchanged and valid',
          });
        }
      }

      // Add new rescue tasks
      proposedTaskChanges.push({
        changeType: 'add',
        title: 'Prepare Step-by-Step Practical Lab Guides & Cloud Sandbox',
        description: 'Format digital lab instructions with architecture diagrams and sample code for participants.',
        category: 'content_labs',
        priority: 'high',
        deadline: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        reason: 'Required to support the new hands-on lab format',
      });

      proposedTaskChanges.push({
        changeType: 'add',
        title: 'Notify Attendees of Interactive Hands-on Format Update',
        description: 'Send brief announcement: Attendees should bring laptops with AWS console accounts ready.',
        category: 'marketing_registration',
        priority: 'medium',
        deadline: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        reason: 'Ensure participants come prepared for lab activities',
      });
    } else if (problemLower.includes('budget') || problemLower.includes('money') || problemLower.includes('cost')) {
      options = [
        {
          optionId: 'opt_1',
          title: 'Streamline Catering & Refreshments',
          description: 'Switch to light refreshments/packaged snacks and leverage campus water coolers.',
          isRecommended: true,
          recommendationReason: 'Catering is typically 30-40% of non-technical expenses and easily flexible.',
          tradeoffs: 'Modest refreshments instead of full meal.',
        },
        {
          optionId: 'opt_2',
          title: 'Adopt Hybrid or Free Venue Facilities',
          description: 'Leverage university lab rooms or host online to eliminate venue and AV rental fees.',
          isRecommended: false,
          recommendationReason: 'Immediately eliminates facility rental costs.',
          tradeoffs: 'Venue changes require participant notification.',
        },
      ];

      const selectedOpt =
        preferredOptionIndex !== undefined && options[preferredOptionIndex]
          ? options[preferredOptionIndex]
          : options[0];

      selectedOptionTitle = selectedOpt.title;
      recommendedSolution = selectedOpt.description;
      explanation = `No panic. We can easily adjust your budget allocations to keep the event vibrant while remaining within your target expenditure.`;

      immediateNextActions = [
        'Adjust refreshment procurement to light snacks.',
        'Review free digital badges/certificates instead of printed physical kits.',
      ];

      for (const t of currentTasks) {
        if (t.category === 'logistics_catering' || t.title.toLowerCase().includes('catering') || t.title.toLowerCase().includes('refreshment')) {
          proposedTaskChanges.push({
            changeType: 'update',
            taskId: t.taskId,
            title: 'Procure Budget-Optimised Light Refreshments',
            description: 'Order tea/coffee and light packaged snacks within revised budget cap.',
            category: 'logistics_catering',
            priority: 'medium',
            status: 'not_started',
            deadline: t.deadline,
            reason: 'Reduced expense to match budget constraint',
          });
        } else {
          proposedTaskChanges.push({
            changeType: 'keep',
            taskId: t.taskId,
            title: t.title,
            category: t.category,
            priority: t.priority,
            status: t.status,
            deadline: t.deadline,
          });
        }
      }

      proposedTaskChanges.push({
        changeType: 'add',
        title: 'Audit Digital-Only Handouts and Certificates',
        description: 'Eliminate printing expenses by sharing PDFs and digital credentials.',
        category: 'budget_admin',
        priority: 'medium',
        deadline: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        reason: 'Save costs on physical materials',
      });
    } else if (problemLower.includes('venue') || problemLower.includes('room') || problemLower.includes('hall') || problemLower.includes('location')) {
      options = [
        {
          optionId: 'opt_1',
          title: 'Reserve Alternate University Lab / Lecture Theatre',
          description: 'Work with department head to reserve an adjacent computer lab or auditorium.',
          isRecommended: true,
          recommendationReason: 'Maintains in-person atmosphere without changing participant logistics much.',
          tradeoffs: 'Requires department administrative approval.',
        },
        {
          optionId: 'opt_2',
          title: 'Pivot to Virtual / Hybrid Session (Amazon Chime / Zoom)',
          description: 'Switch format to interactive online session with breakout rooms.',
          isRecommended: false,
          recommendationReason: 'Zero venue dependency and quick setup.',
          tradeoffs: 'Attendees will join remotely.',
        },
      ];

      const selectedOpt =
        preferredOptionIndex !== undefined && options[preferredOptionIndex]
          ? options[preferredOptionIndex]
          : options[0];

      selectedOptionTitle = selectedOpt.title;
      recommendedSolution = selectedOpt.description;
      explanation = `No panic. Venue hiccups happen frequently. We have immediate fallback alternatives ready.`;

      immediateNextActions = [
        'Submit expedited booking request for alternate hall.',
        'Update venue signage and email directions to attendees.',
      ];

      for (const t of currentTasks) {
        if (t.category === 'venue_tech' || t.title.toLowerCase().includes('venue')) {
          proposedTaskChanges.push({
            changeType: 'update',
            taskId: t.taskId,
            title: 'Confirm Alternate University Facility & Test AV/Wi-Fi',
            description: 'Verify sound system, projector HDMI, and Wi-Fi capacity in the backup hall.',
            category: 'venue_tech',
            priority: 'high',
            status: 'in_progress',
            deadline: t.deadline,
            reason: 'Relocated to backup facility',
          });
        } else {
          proposedTaskChanges.push({
            changeType: 'keep',
            taskId: t.taskId,
            title: t.title,
            category: t.category,
            priority: t.priority,
            status: t.status,
            deadline: t.deadline,
          });
        }
      }

      proposedTaskChanges.push({
        changeType: 'add',
        title: 'Dispatch Hall Re-direction Signage and Student Guides',
        description: 'Place clear signs at original venue entrance pointing to new room.',
        category: 'team_coordination',
        priority: 'high',
        deadline: event.date,
        reason: 'Prevent attendee confusion on arrival',
      });
    } else {
      // General unexpected change
      options = [
        {
          optionId: 'opt_1',
          title: 'Rapid Timeline Realignment',
          description: 'Shift non-critical milestones forward and prioritize core operational readiness.',
          isRecommended: true,
          recommendationReason: 'Restores team focus on essential deliverables.',
          tradeoffs: 'Secondary decorative or promotional activities deferred.',
        },
        {
          optionId: 'opt_2',
          title: 'Team Task Redistribution',
          description: 'Pair organizers on delayed high-priority items to accelerate completion.',
          isRecommended: false,
          recommendationReason: 'Spreads workload to resolve bottlenecks.',
          tradeoffs: 'Requires quick 15-minute sync with team.',
        },
      ];

      const selectedOpt = options[0];
      selectedOptionTitle = selectedOpt.title;
      recommendedSolution = selectedOpt.description;
      explanation = `No panic. Let's work through this. We can streamline your timeline and concentrate efforts on your critical milestones.`;

      immediateNextActions = [
        'Review urgent deadlines with the core organizing committee.',
        'Confirm highest priority items first.',
      ];

      for (const t of currentTasks) {
        proposedTaskChanges.push({
          changeType: 'keep',
          taskId: t.taskId,
          title: t.title,
          category: t.category,
          priority: t.priority,
          status: t.status,
          deadline: t.deadline,
        });
      }

      proposedTaskChanges.push({
        changeType: 'add',
        title: '15-Minute Standup: Triage & Align On Critical Path',
        description: 'Sync with organizing team to confirm roles for the resolved issue.',
        category: 'team_coordination',
        priority: 'high',
        deadline: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        reason: 'Align team on emergency action plan',
      });
    }

    const proposalId = `resc_${uuidv4().replace(/-/g, '').slice(0, 12)}`;
    const now = new Date().toISOString();
    const expiryDate = new Date(Date.now() + 48 * 3600 * 1000).toISOString();

    const proposal: RescueProposal = {
      proposalId,
      eventId,
      ownerId,
      problemSummary: problemDescription,
      selectedOptionTitle,
      recommendedSolution,
      options,
      proposedTaskChanges,
      explanation,
      immediateNextActions,
      approvalStatus: 'pending',
      createdAt: now,
      expiresAt: expiryDate,
    };

    return await rescueRepository.save(proposal);
  },

  async applyRescue(
    ownerId: string,
    eventId: string,
    proposalId: string
  ): Promise<{
    message: string;
    proposal: RescueProposal;
    updatedTasksCount: number;
    addedTasksCount: number;
    tasks: TaskItem[];
  }> {
    // 1. Verify event ownership
    const event = await eventsRepository.getById(eventId, ownerId);
    if (!event) {
      const err: any = new Error('Event not found or unauthorized');
      err.statusCode = 404;
      throw err;
    }

    // 2. Retrieve proposal and verify ownership and non-duplicate status
    const proposal = await rescueRepository.getById(proposalId, eventId, ownerId);
    if (!proposal) {
      const err: any = new Error('Rescue proposal not found or unauthorized');
      err.statusCode = 404;
      throw err;
    }

    if (proposal.approvalStatus === 'approved') {
      const err: any = new Error('This rescue proposal has already been applied');
      err.statusCode = 409;
      throw err;
    }

    let updatedTasksCount = 0;
    let addedTasksCount = 0;

    // 3. Apply changes
    for (const change of proposal.proposedTaskChanges) {
      if (change.changeType === 'add') {
        await tasksRepository.create({
          taskId: `tsk_${uuidv4().replace(/-/g, '').slice(0, 12)}`,
          eventId,
          ownerId,
          title: change.title,
          description: change.description || '',
          category: change.category,
          priority: change.priority,
          status: change.status || 'not_started',
          deadline: change.deadline || event.date,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        addedTasksCount++;
      } else if (change.changeType === 'update' && change.taskId) {
        await tasksRepository.update(change.taskId, eventId, ownerId, {
          title: change.title,
          description: change.description,
          category: change.category,
          priority: change.priority,
          status: change.status,
          deadline: change.deadline,
        });
        updatedTasksCount++;
      } else if (change.changeType === 'remove' && change.taskId) {
        await tasksRepository.delete(change.taskId, eventId, ownerId);
      }
    }

    // 4. Mark proposal as approved
    const updatedProposal = await rescueRepository.markApplied(proposalId, eventId, ownerId);

    // 5. Fetch all current tasks to return fresh state
    const currentTasks = await tasksRepository.listByEvent(eventId, ownerId);

    return {
      message: `Plan rescue applied successfully. ${addedTasksCount} new task(s) added, ${updatedTasksCount} task(s) updated.`,
      proposal: updatedProposal,
      updatedTasksCount,
      addedTasksCount,
      tasks: currentTasks,
    };
  },

  async listProposals(ownerId: string, eventId: string): Promise<RescueProposal[]> {
    return await rescueRepository.listByEvent(eventId, ownerId);
  },
};
