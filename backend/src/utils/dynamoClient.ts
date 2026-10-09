import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

const region = process.env.AWS_REGION || 'us-east-1';

const baseClient = new DynamoDBClient({
  region,
});

export const docClient = DynamoDBDocumentClient.from(baseClient, {
  marshallOptions: {
    convertEmptyValues: true,
    removeUndefinedValues: true,
    convertClassInstanceToMap: true,
  },
  unmarshallOptions: {
    wrapNumbers: false,
  },
});

export const TABLE_NAMES = {
  EVENTS: process.env.EVENTS_TABLE_NAME || 'eventmate-ai-events',
  TASKS: process.env.TASKS_TABLE_NAME || 'eventmate-ai-tasks',
  CONVERSATIONS: process.env.CONVERSATIONS_TABLE_NAME || 'eventmate-ai-conversations',
  RESCUE_PROPOSALS: process.env.RESCUE_PROPOSALS_TABLE_NAME || 'eventmate-ai-rescue-proposals',
};

// Check if running in offline/mock database mode (for local testing without live AWS DynamoDB)
export const isMockDbMode =
  process.env.USE_MOCK_DB === 'true' ||
  (!process.env.AWS_ACCESS_KEY_ID &&
    !process.env.AWS_PROFILE &&
    !process.env.AWS_LAMBDA_FUNCTION_NAME &&
    !process.env.AWS_EXECUTION_ENV);
