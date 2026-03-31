'use strict';

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, QueryCommand } = require('@aws-sdk/lib-dynamodb');
const crypto = require('crypto');

// --- Cold start env var validation ---
const REQUIRED_VARS = ['DYNAMODB_TABLE_SYMPTOMS', 'COGNITO_USER_POOL_ID', 'COGNITO_CLIENT_ID'];
let configError = null;
for (const v of REQUIRED_VARS) {
  if (!process.env[v]) {
    configError = `Missing required environment variable: ${v}`;
    console.error('[symptomHandler] Configuration error:', configError);
    break;
  }
}

// --- DynamoDB client (only initialised when config is valid) ---
const dynamoClient = configError
  ? null
  : DynamoDBDocumentClient.from(new DynamoDBClient({}));

// --- Constants ---
const VALID_SYMPTOM_TYPES = ['cramps', 'fatigue', 'mood', 'bloating', 'headache', 'other'];

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Content-Type': 'application/json',
};

// --- Helper ---
function respond(statusCode, body) {
  return {
    statusCode,
    headers: CORS_HEADERS,
    body: JSON.stringify(body),
  };
}

// --- Handler ---
exports.handler = async (event) => {
  if (configError) {
    console.error('[symptomHandler] Refusing request due to config error:', configError);
    return respond(500, { message: 'Service configuration error. Please contact support.' });
  }

  const method = event.httpMethod;
  const userId = event.requestContext.authorizer.claims.sub;

  // POST /symptoms
  if (method === 'POST') {
    let body;
    try {
      body = JSON.parse(event.body || '{}');
    } catch {
      return respond(400, { message: 'Invalid request body.' });
    }

    const { symptomType, severity, notes } = body;

    // Validate symptomType
    if (!VALID_SYMPTOM_TYPES.includes(symptomType)) {
      return respond(400, { message: 'Please select a valid symptom type.' });
    }

    // Validate severity: must be an integer between 1 and 10 inclusive
    if (
      !Number.isInteger(Number(severity)) ||
      Number(severity) < 1 ||
      Number(severity) > 10
    ) {
      return respond(400, { message: 'Severity must be a number between 1 and 10.' });
    }

    const symptomId = crypto.randomUUID();
    const timestamp = new Date().toISOString();

    await dynamoClient.send(
      new PutCommand({
        TableName: process.env.DYNAMODB_TABLE_SYMPTOMS,
        Item: {
          userId,
          timestamp,
          symptomId,
          symptomType,
          severity: Number(severity),
          notes: notes || '',
        },
      })
    );

    return respond(201, { symptomId });
  }

  // GET /symptoms
  if (method === 'GET') {
    const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const result = await dynamoClient.send(
      new QueryCommand({
        TableName: process.env.DYNAMODB_TABLE_SYMPTOMS,
        KeyConditionExpression: 'userId = :uid AND #ts >= :cutoff',
        ExpressionAttributeNames: { '#ts': 'timestamp' },
        ExpressionAttributeValues: { ':uid': userId, ':cutoff': cutoff },
        ScanIndexForward: true,
      })
    );

    return respond(200, result.Items || []);
  }

  // OPTIONS (CORS preflight)
  if (method === 'OPTIONS') {
    return respond(200, {});
  }

  return respond(405, { message: 'Method not allowed.' });
};
