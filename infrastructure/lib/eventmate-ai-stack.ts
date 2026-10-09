import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as apigwv2 from 'aws-cdk-lib/aws-apigatewayv2';
import * as apigwv2_integrations from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import * as path from 'path';

export class EventMateAiStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // 1. DynamoDB Tables (On-Demand billing for cost protection)
    const eventsTable = new dynamodb.Table(this, 'EventsTable', {
      partitionKey: { name: 'eventId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      tableName: 'eventmate-ai-events',
    });

    eventsTable.addGlobalSecondaryIndex({
      indexName: 'OwnerIndex',
      partitionKey: { name: 'ownerId', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    const tasksTable = new dynamodb.Table(this, 'TasksTable', {
      partitionKey: { name: 'taskId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      tableName: 'eventmate-ai-tasks',
    });

    tasksTable.addGlobalSecondaryIndex({
      indexName: 'EventIndex',
      partitionKey: { name: 'eventId', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    const conversationsTable = new dynamodb.Table(this, 'ConversationsTable', {
      partitionKey: { name: 'eventId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      tableName: 'eventmate-ai-conversations',
    });

    const rescueProposalsTable = new dynamodb.Table(this, 'RescueProposalsTable', {
      partitionKey: { name: 'proposalId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      tableName: 'eventmate-ai-rescue-proposals',
    });

    rescueProposalsTable.addGlobalSecondaryIndex({
      indexName: 'EventIndex',
      partitionKey: { name: 'eventId', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // 2. Cognito User Pool & Client (Hardened Password Policy)
    const userPool = new cognito.UserPool(this, 'EventMateUserPool', {
      userPoolName: 'eventmate-ai-users',
      selfSignUpEnabled: true,
      signInAliases: { email: true, username: false },
      autoVerify: { email: true },
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: true,
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const userPoolClient = new cognito.UserPoolClient(this, 'EventMateUserPoolClient', {
      userPool,
      userPoolClientName: 'eventmate-ai-web-client',
      generateSecret: false, // SPA web client
      authFlows: {
        userPassword: true,
        userSrp: true,
      },
    });

    // 3. Backend Lambda Function
    const backendLambda = new lambda.Function(this, 'EventMateBackendLambda', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'handlers/lambda.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../backend/dist')),
      memorySize: 512,
      timeout: cdk.Duration.seconds(30),
      environment: {
        EVENTS_TABLE_NAME: eventsTable.tableName,
        TASKS_TABLE_NAME: tasksTable.tableName,
        CONVERSATIONS_TABLE_NAME: conversationsTable.tableName,
        RESCUE_PROPOSALS_TABLE_NAME: rescueProposalsTable.tableName,
        COGNITO_USER_POOL_ID: userPool.userPoolId,
        COGNITO_CLIENT_ID: userPoolClient.userPoolClientId,
        BEDROCK_MODEL_ID: 'amazon.nova-lite-v1:0',
        NODE_ENV: 'production',
      },
    });

    // Least privilege permissions
    eventsTable.grantReadWriteData(backendLambda);
    tasksTable.grantReadWriteData(backendLambda);
    conversationsTable.grantReadWriteData(backendLambda);
    rescueProposalsTable.grantReadWriteData(backendLambda);

    // Bedrock permissions for Nova Lite foundation model & inference profiles
    backendLambda.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['bedrock:InvokeModel', 'bedrock:InvokeModelWithResponseStream'],
        resources: [
          `arn:aws:bedrock:${this.region}::foundation-model/amazon.nova-lite-v1:0`,
          `arn:aws:bedrock:${this.region}:${this.account}:inference-profile/us.amazon.nova-lite-v1:0`,
          `arn:aws:bedrock:${this.region}::inference-profile/us.amazon.nova-lite-v1:0`,
        ],
      })
    );

    // 4. API Gateway HTTP API
    const defaultOrigins = ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'];
    const configuredOrigins = process.env.ALLOWED_ORIGINS
      ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
      : [];
    const allowedOrigins = Array.from(new Set([...defaultOrigins, ...configuredOrigins]));

    const httpApi = new apigwv2.HttpApi(this, 'EventMateHttpApi', {
      apiName: 'EventMate AI API',
      corsPreflight: {
        allowHeaders: ['Authorization', 'Content-Type', 'x-user-id'],
        allowMethods: [
          apigwv2.CorsHttpMethod.GET,
          apigwv2.CorsHttpMethod.POST,
          apigwv2.CorsHttpMethod.PATCH,
          apigwv2.CorsHttpMethod.DELETE,
          apigwv2.CorsHttpMethod.OPTIONS,
        ],
        allowOrigins: allowedOrigins,
        maxAge: cdk.Duration.days(1),
      },
    });

    const lambdaIntegration = new apigwv2_integrations.HttpLambdaIntegration(
      'LambdaProxyIntegration',
      backendLambda
    );

    httpApi.addRoutes({
      path: '/{proxy+}',
      methods: [apigwv2.HttpMethod.ANY],
      integration: lambdaIntegration,
    });

    // CloudFormation Outputs
    new cdk.CfnOutput(this, 'ApiEndpoint', {
      value: httpApi.apiEndpoint,
      description: 'HTTP API Gateway URL',
    });

    new cdk.CfnOutput(this, 'UserPoolId', {
      value: userPool.userPoolId,
      description: 'Cognito User Pool ID',
    });

    new cdk.CfnOutput(this, 'UserPoolClientId', {
      value: userPoolClient.userPoolClientId,
      description: 'Cognito Web Client ID',
    });

    new cdk.CfnOutput(this, 'Region', {
      value: this.region,
      description: 'AWS Deployment Region',
    });
  }
}
