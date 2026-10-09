# Meet EventMate AI: Building an AI Co-Organiser That Helps You Plan Events Without the Stress

**Challenge Submission:** AWS Builder Center Weekend Challenge: *Build an Agent People Actually Enjoy Using*  
**Tag:** `#agents`

---

## Section 1: The Problem

Organising an event is one of the most rewarding experiences a university student or community leader can undertake—and often one of the most overwhelming. 

Whether it is a 100-student hands-on cloud workshop, a campus hackathon, or a local tech meetup, student organisers are typically thrust into complex project management with limited prior training. They juggle speaker outreach, lab computer arrangements, catering budgets, promotional flyers, and countdown timelines. Inevitably, spreadsheets become out of date, critical tasks slip through the cracks, and the moment an unexpected hiccup strikes—such as a keynote speaker falling ill 24 hours before the event—panic ensues. 

Most generic AI chatbots offer little help in these moments. Asking a generic LLM what to do usually produces a wall of repetitive, generic bullet points that have no grounding in the organiser's actual tasks, confirmed budget, or remaining hours. What organisers truly need is not another passive chatbot, but a proactive, supportive **co-organiser** with tool access to their live preparation board.

---

## Section 2: Introducing EventMate AI

**EventMate AI** was conceived to fulfill a simple promise: *"Your AI Co-Organiser, From Idea to Event Day."*

Targeted directly at student club leads, hackathon committees, and volunteer organisers, EventMate AI bridges the gap between chaotic brainstorming and disciplined execution. Instead of requiring users to fill out painful 20-field spreadsheets, EventMate AI understands event requests in natural language. An organiser can simply type:

> *"I want to organise a hands-on AWS workshop for 100 university students in Colombo on 20 November 2026. My budget is LKR 25,000."*

From this concise input, EventMate AI provisions an event workspace, estimates category allocations, and generates actionable, prioritized preparation tasks. Organisers can track progress via real-time readiness scoring, query their AI co-organiser for immediate priorities, and navigate unexpected crises through our signature feature: **Plan Rescue**.

---

## Section 3: How I Built It

To keep the application fast, secure, low-cost, and completely serverless, EventMate AI is built natively on AWS using TypeScript across both frontend and backend:

1. **Amazon Bedrock & Amazon Nova Lite (`amazon.nova-lite-v1:0`):** Powers the core conversational intelligence. We chose Amazon Nova Lite because of its exceptional reasoning speed, low latency, and cost-effectiveness for multi-turn tool calling.
2. **AWS Lambda (Node.js 24 / TypeScript):** Hosts our serverless backend API and Bedrock Converse execution engine, scaling to zero when inactive to keep hosting costs near zero for student budgets.
3. **Amazon DynamoDB:** Serves as the single source of truth using on-demand billing (`PAY_PER_REQUEST`). Four specialized tables store Events, Tasks, Conversations, and Rescue Proposals, with Global Secondary Indexes (GSIs) enabling sub-10ms queries by owner and event ID.
4. **Amazon Cognito User Pools:** Secures all protected operations. User identities are verified via JSON Web Tokens (JWTs), ensuring strict multi-tenant isolation where users can only inspect and modify their own event records.
5. **Amazon API Gateway HTTP API:** Provides low-latency, CORS-enabled routing to our Lambda backend.
6. **React 18 + Vite + Tailwind CSS Frontend:** A dark-navy SaaS interface built with glassmorphism, responsive mobile cards, and visible status transitions.
7. **AWS CDK (TypeScript):** Every cloud component is declared in reproducible Infrastructure as Code (IaC) in the `infrastructure/` directory.

---

## Section 4: Making the Experience Delightful — The Plan Rescue Workflow

The central criterion of the AWS Builder Challenge is building an agent that people *actually enjoy using*. In event management, the moment of greatest friction—and greatest emotional stress—is when an unexpected problem disrupts the plan.

Most software fails organisers at this exact moment by forcing them to rebuild everything manually. In EventMate AI, this is where **Plan Rescue** shines.

When an organiser clicks **Plan Rescue** and explains:
> *"Our main speaker just cancelled, and the workshop is tomorrow."*

EventMate AI does not respond with alarming error banners. Instead, it greets the organiser with calm, steady language:
> *"No panic. Let's work through this."*

Behind the scenes, the agent:
1. Gathers current tasks from DynamoDB to understand what dependencies exist.
2. Formulates 2–3 practical pivot strategies with explicit tradeoffs (e.g., *Converting the session into a guided hands-on lab led by student leads* versus *Emergency substitute outreach*).
3. Produces an **Interactive Change Preview** that visually categorizes operations:
   - 🟢 **Added Tasks:** (e.g., *Prepare Step-by-Step Lab Guides*)
   - 🟡 **Updated Tasks:** (e.g., *Pivot: Assign Internal Lab Mentors*)
   - ⚪ **Unchanged Tasks:** (e.g., *Confirm Lab Wi-Fi Reservation*)
4. **Requires User Confirmation:** Crucially, the agent never modifies database records without explicit user consent. Once the user clicks "Apply Changes," the database is atomically updated, the readiness score is refreshed, and the user receives a clear summary of modifications.

This transforms a moment of panic into an organized, reassuring pivot.

---

## Section 5: How the AI Agent Works

Rather than relying on basic prompt engineering or brittle regex parsing, EventMate AI implements the native **Bedrock Converse API** (`ConverseCommand`) with 8 defined tools:

1. `create_event_plan`: Ingests parameters and generates an event plan with initial task records.
2. `get_event_details`: Fetches current event specifications.
3. `list_event_tasks`: Queries DynamoDB for tasks with optional priority/status filtering.
4. `add_event_task`: Validates and writes a single task to DynamoDB.
5. `update_event_task`: Updates task statuses, deadlines, or assignees.
6. `get_event_progress`: Computes true mathematical completion percentages from real tasks.
7. `propose_rescue_plan`: Analyzes disruptions and persists a staged rescue proposal.
8. `apply_rescue_plan`: Executes an approved rescue proposal atomically after user confirmation.

The multi-turn Converse loop inspects model output for `toolUse` blocks, validates inputs with Zod schemas, executes the backend operation, and feeds `toolResult` blocks back to Bedrock. To guard against runaway loops or excessive token expenditure, the agent loop enforces a strict maximum of 5 iterations per request and maintains bounded conversation memory (last 20 messages) in DynamoDB.

---

## Section 6: Testing the Experience

We tested EventMate AI through comprehensive automated suites and end-to-end user journeys:
- **12 Backend Tests:** Verified event ownership enforcement, progress calculation formulas, Plan Rescue proposal generation, duplicate application rejection, and unknown tool handling.
- **6 Frontend Tests:** Verified component rendering, readiness bar clamping, modal open/close transitions, and user inputs.
- **Full AWS Workshop Demonstration Journey:** Tested the complete 13-step scenario—from initial event creation for 100 students in Colombo, to asking *"What are my three most important tasks right now?"*, to handling the 24-hour speaker cancellation crisis via Plan Rescue, and checking the updated readiness score.

In all tests, the agent executed tools against stored database state and never simulated successful updates without real persistence.

---

## Section 7: Challenges and Lessons

1. **Balancing Proactivity and User Control:** Early in design, we considered having the AI automatically apply rescue changes upon detecting a problem. User testing and design intuition immediately revealed that organizers feel anxious when an AI silently edits their deadlines. Introducing the **Change Preview** modal—where changes are clearly color-coded as Added, Updated, or Unchanged—gave users complete psychological safety.
2. **Preventing Hallucinated Progress:** AI models love inventing numbers like *"Your event is 78% ready!"* even when no tasks have been created. We solved this by strictly delegating progress math to the `get_event_progress` backend tool, which counts real completed vs. pending tasks in DynamoDB.
3. **Graceful Fallbacks:** To ensure that hackathon evaluators can test the application regardless of AWS credential availability, we built an intelligent deterministic local engine that executes identical tool routines offline. This guarantees 100% testability across any evaluation environment.

---

## Section 8: Demo & Repository Links

- **Live API Endpoint:** `https://5zbjhov2p7.execute-api.us-east-1.amazonaws.com`
- **Cognito User Pool ID:** `us-east-1_cWMH6H7IY`
- **Cognito Client ID:** `66s3ggaiueebp56mbpu345usf5`
- **GitHub Repository:** `https://github.com/PamudaUposath/EventMate-AI`
- **Demonstration Walkthrough:** Available locally via `npm run dev:frontend` using the built-in Explore Demo scenario.

---

## Section 9: Conclusion

Event planning does not have to be an exercise in panic and sleepless nights. By combining **Amazon Bedrock's Nova Lite** foundation model with serverless DynamoDB persistence and an empathetic, human-centered UI design, **EventMate AI** proves that AI agents are most delightful not when they act flashy, but when they make stressful situations feel manageable, structured, and calm.

\#agents
