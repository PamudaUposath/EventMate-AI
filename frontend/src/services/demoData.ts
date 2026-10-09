import { EventItem, TaskItem, ConversationMessage, RescueProposal } from '../types';

export const DEMO_EVENT: EventItem = {
  eventId: 'evt_demo_aws_workshop',
  ownerId: 'demo-user-123',
  title: 'AWS Cloud Hands-on Workshop 2026',
  type: 'technical-workshop',
  description: 'Hands-on AWS cloud architecture and serverless fundamentals workshop for university students.',
  date: '2026-11-20',
  timezone: 'Asia/Colombo',
  location: 'Colombo Innovation Campus, Lab 3',
  format: 'in-person',
  participants: 100,
  budget: 25000,
  currency: 'LKR',
  duration: '4 hours',
  additionalRequirements: 'Attendees must bring laptops with AWS Free Tier or Builder ID configured. Projector and dual microphones required.',
  status: 'planning',
  createdAt: '2026-10-01T09:00:00.000Z',
  updatedAt: '2026-10-09T10:00:00.000Z',
};

export const DEMO_TASKS: TaskItem[] = [
  {
    taskId: 'tsk_demo_01',
    eventId: 'evt_demo_aws_workshop',
    ownerId: 'demo-user-123',
    title: 'Confirm Workshop Speaker & Content Outline',
    description: 'Finalize speaker availability, topic outline, and hands-on lab scope.',
    category: 'speakers',
    priority: 'high',
    status: 'in_progress',
    deadline: '2026-11-10',
    assignedTo: 'Kavindu (Lead)',
    createdAt: '2026-10-01T10:00:00.000Z',
    updatedAt: '2026-10-05T14:30:00.000Z',
  },
  {
    taskId: 'tsk_demo_02',
    eventId: 'evt_demo_aws_workshop',
    ownerId: 'demo-user-123',
    title: 'Reserve Lab Facility & High-Speed Wi-Fi',
    description: 'Confirm reservation for 100 students and verify campus subnet bandwidth.',
    category: 'venue_tech',
    priority: 'high',
    status: 'completed',
    deadline: '2026-11-05',
    assignedTo: 'Nadeesha',
    createdAt: '2026-10-01T10:00:00.000Z',
    updatedAt: '2026-10-04T11:00:00.000Z',
  },
  {
    taskId: 'tsk_demo_03',
    eventId: 'evt_demo_aws_workshop',
    ownerId: 'demo-user-123',
    title: 'Prepare AWS Workshop Lab Environment & IAM Sandboxes',
    description: 'Set up step-by-step guides for S3, Lambda, and DynamoDB architecture labs.',
    category: 'content_labs',
    priority: 'high',
    status: 'not_started',
    deadline: '2026-11-14',
    assignedTo: 'Technical Committee',
    createdAt: '2026-10-01T10:00:00.000Z',
    updatedAt: '2026-10-01T10:00:00.000Z',
  },
  {
    taskId: 'tsk_demo_04',
    eventId: 'evt_demo_aws_workshop',
    ownerId: 'demo-user-123',
    title: 'Launch Participant Registration Form & Promotion',
    description: 'Publish Google Form / Luma registration and share flyer across WhatsApp student clubs.',
    category: 'marketing_registration',
    priority: 'medium',
    status: 'completed',
    deadline: '2026-11-08',
    assignedTo: 'Sanduni',
    createdAt: '2026-10-01T10:00:00.000Z',
    updatedAt: '2026-10-07T16:00:00.000Z',
  },
  {
    taskId: 'tsk_demo_05',
    eventId: 'evt_demo_aws_workshop',
    ownerId: 'demo-user-123',
    title: 'Procure Light Refreshments & Tea Break',
    description: 'Order tea, coffee, and patties for 100 participants within LKR 12,000 budget.',
    category: 'logistics_catering',
    priority: 'medium',
    status: 'not_started',
    deadline: '2026-11-18',
    assignedTo: 'Logistics Team',
    createdAt: '2026-10-01T10:00:00.000Z',
    updatedAt: '2026-10-01T10:00:00.000Z',
  },
  {
    taskId: 'tsk_demo_06',
    eventId: 'evt_demo_aws_workshop',
    ownerId: 'demo-user-123',
    title: 'Test Projector, Audio Mics & Backup Mobile Hotspot',
    description: 'Dry run HDMI projection, presenter wireless microphone, and backup hotspot.',
    category: 'venue_tech',
    priority: 'high',
    status: 'not_started',
    deadline: '2026-11-19',
    assignedTo: 'Nadeesha',
    createdAt: '2026-10-01T10:00:00.000Z',
    updatedAt: '2026-10-01T10:00:00.000Z',
  },
  {
    taskId: 'tsk_demo_07',
    eventId: 'evt_demo_aws_workshop',
    ownerId: 'demo-user-123',
    title: 'Prepare Digital Feedback Survey & AWS Swag Distribution',
    description: 'Set up post-event feedback form and prepare stickers for participants.',
    category: 'marketing_registration',
    priority: 'low',
    status: 'not_started',
    deadline: '2026-11-19',
    assignedTo: 'Sanduni',
    createdAt: '2026-10-01T10:00:00.000Z',
    updatedAt: '2026-10-01T10:00:00.000Z',
  },
];

export const DEMO_MESSAGES: ConversationMessage[] = [
  {
    role: 'user',
    content: 'I want to organise an AWS hands-on workshop for 100 university students in Colombo on 20 November 2026. The event will run for four hours, and I have a budget of LKR 25,000.',
    timestamp: '2026-10-01T09:00:00.000Z',
  },
  {
    role: 'assistant',
    content: `I've created a comprehensive plan for **AWS Cloud Hands-on Workshop 2026**! 

I structured 7 essential milestones tailored for a technical student workshop:
- Keynote & Speaker confirmation
- Lab computer reservation with high-speed Wi-Fi
- Hands-on sandbox preparation
- Registration launch and promotion
- Catering allocations within your LKR 25,000 budget
- AV dry run & technical readiness

Your preparation checklist is ready on your board. What would you like to tackle first?`,
    timestamp: '2026-10-01T09:00:05.000Z',
    toolExecutions: [
      {
        toolName: 'create_event_plan',
        toolInput: {
          eventName: 'AWS Cloud Hands-on Workshop 2026',
          eventType: 'technical-workshop',
          date: '2026-11-20',
          location: 'Colombo Innovation Campus',
          participants: 100,
          budget: 25000,
          currency: 'LKR',
          duration: '4 hours',
        },
        toolOutput: { status: 'success', tasksCount: 7 },
      },
    ],
  },
  {
    role: 'user',
    content: 'What are my three most important tasks right now?',
    timestamp: '2026-10-09T09:15:00.000Z',
  },
  {
    role: 'assistant',
    content: `Here are the top priority tasks to focus on right now for **AWS Cloud Hands-on Workshop 2026**:

1. **Confirm Workshop Speaker & Content Outline** (Priority: HIGH, Deadline: 2026-11-10)
   _Finalize speaker availability, topic outline, and hands-on lab scope._
   
2. **Prepare AWS Workshop Lab Environment & IAM Sandboxes** (Priority: HIGH, Deadline: 2026-11-14)
   _Set up step-by-step guides for S3, Lambda, and DynamoDB architecture labs._

3. **Test Projector, Audio Mics & Backup Mobile Hotspot** (Priority: HIGH, Deadline: 2026-11-19)
   _Dry run HDMI projection, presenter wireless microphone, and backup hotspot._

Would you like me to help you mark any of these as completed or update their deadlines?`,
    timestamp: '2026-10-09T09:15:03.000Z',
    toolExecutions: [
      {
        toolName: 'list_event_tasks',
        toolInput: { eventId: 'evt_demo_aws_workshop', priority: 'high' },
        toolOutput: { count: 3 },
      },
    ],
  },
];

export const DEMO_RESCUE_PROPOSAL: RescueProposal = {
  proposalId: 'resc_demo_speaker_pivot',
  eventId: 'evt_demo_aws_workshop',
  ownerId: 'demo-user-123',
  problemSummary: 'Our main speaker just cancelled, and the workshop is tomorrow.',
  selectedOptionTitle: 'Convert into Guided Hands-on Practical Lab',
  recommendedSolution: 'Pivot the keynote into a collaborative, hands-on workshop led by the student leads using AWS step-by-step lab guides.',
  options: [
    {
      optionId: 'opt_1',
      title: 'Emergency Speaker Replacement',
      description: 'Reach out to local community AWS Community Builders or university alumni to give a quick guest talk.',
      isRecommended: false,
      recommendationReason: 'Good if someone is immediately available, but high stress within 24 hours.',
      tradeoffs: 'Requires rapid outreach and speaker briefing.',
    },
    {
      optionId: 'opt_2',
      title: 'Convert into Guided Hands-on Practical Lab',
      description: 'Pivot the session into a collaborative workshop led by core student organisers using AWS step-by-step lab walk-throughs.',
      isRecommended: true,
      recommendationReason: 'Hands-on practical labs deliver high attendee satisfaction and eliminate single-point speaker risk.',
      tradeoffs: 'Student leads must circulate and assist participants with technical questions.',
    },
    {
      optionId: 'opt_3',
      title: 'Interactive Group Challenge / Mini-Hack',
      description: 'Break attendees into small teams of 3-4 to build a simple serverless web app architecture.',
      isRecommended: false,
      recommendationReason: 'Exciting team dynamic, but requires team grouping and judging setup.',
      tradeoffs: 'Requires dynamic facilitator involvement.',
    },
  ],
  proposedTaskChanges: [
    {
      changeType: 'update',
      taskId: 'tsk_demo_01',
      title: 'Pivot: Assign Internal Lab Mentors (Replaced Speaker Session)',
      description: 'Transitioned session to hands-on guided lab due to speaker unavailability. Organisers will facilitate.',
      category: 'content_labs',
      priority: 'high',
      status: 'in_progress',
      deadline: '2026-11-19',
      reason: 'Replaced cancelled external speaker with team mentorship',
    },
    {
      changeType: 'add',
      title: 'Prepare Step-by-Step Practical Lab Guides & Cloud Sandboxes',
      description: 'Print or link digital architecture guides with sample code and console instructions.',
      category: 'content_labs',
      priority: 'high',
      deadline: '2026-11-19',
      reason: 'Required for self-guided workshop format',
    },
    {
      changeType: 'add',
      title: 'Notify Attendees of Interactive Hands-on Format Update',
      description: 'Send brief WhatsApp / email announcement: Bring laptops with browsers ready for hands-on building.',
      category: 'marketing_registration',
      priority: 'medium',
      deadline: '2026-11-19',
      reason: 'Ensure participants arrive prepared',
    },
    {
      changeType: 'keep',
      taskId: 'tsk_demo_02',
      title: 'Reserve Lab Facility & High-Speed Wi-Fi',
      category: 'venue_tech',
      priority: 'high',
      status: 'completed',
      deadline: '2026-11-05',
      reason: 'Facility is confirmed and unaffected',
    },
  ],
  explanation: "No panic. Let's work through this. Given that the workshop is tomorrow, pivoting into a guided practical lab led by your student leads provides high value and zero external speaker dependency.",
  immediateNextActions: [
    'Send a reassuring update to participants highlighting the interactive building focus.',
    'Review the hands-on lab walk-through with your co-organisers.',
    'Assign 2 student leads to circulate and answer participant questions during labs.',
  ],
  approvalStatus: 'pending',
  createdAt: '2026-10-09T10:00:00.000Z',
  expiresAt: '2026-10-11T10:00:00.000Z',
};
