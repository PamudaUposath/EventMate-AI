import * as cdk from 'aws-cdk-lib';
import { EventMateAiStack } from '../lib/eventmate-ai-stack';

const app = new cdk.App();
new EventMateAiStack(app, 'EventMateAiStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
  },
  description: 'EventMate AI Stack: Intelligent Event Planning Agent powered by Bedrock, DynamoDB, and Cognito',
});
