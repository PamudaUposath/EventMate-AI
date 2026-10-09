import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Secure logging on backend
  console.error('[Error] Request error:', {
    path: req.path,
    method: req.method,
    name: err.name,
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });

  if (err instanceof ZodError) {
    res.status(400).json({
      error: 'Validation failed',
      message: 'Some of the provided fields are invalid or missing.',
      details: err.errors.map((e) => ({
        path: e.path.join('.'),
        message: e.message,
      })),
    });
    return;
  }

  // AWS Bedrock Throttling
  if (err.name === 'ThrottlingException' || err.message?.includes('ThrottlingException')) {
    res.status(429).json({
      error: 'Rate limit exceeded',
      message: 'EventMate is receiving too many requests right now. Please try again shortly.',
    });
    return;
  }

  // Bedrock Access Denied or Model Not Found
  if (err.name === 'AccessDeniedException' || err.message?.includes('AccessDeniedException')) {
    res.status(403).json({
      error: 'AI Access Denied',
      message: 'EventMate AI model access is not enabled in this AWS region. Please verify Amazon Bedrock Nova Lite model permissions.',
    });
    return;
  }

  if (err.name === 'ResourceNotFoundException') {
    res.status(404).json({
      error: 'Resource not found',
      message: 'The requested event, task, or record was not found.',
    });
    return;
  }

  const status = err.statusCode || err.status || 500;
  const userMessage =
    status === 500
      ? 'An unexpected error occurred while processing your request. Please try again.'
      : err.message || 'Operation failed';

  res.status(status).json({
    error: err.name || 'InternalServerError',
    message: userMessage,
  });
}
