import { Request, Response, NextFunction } from 'express';
import { CognitoJwtVerifier } from 'aws-jwt-verify';

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email?: string;
  };
}

const userPoolId = process.env.COGNITO_USER_POOL_ID;
const clientId = process.env.COGNITO_CLIENT_ID;

let verifier: any = null;

if (userPoolId && clientId && !userPoolId.includes('example')) {
  try {
    verifier = CognitoJwtVerifier.create({
      userPoolId,
      tokenUse: 'id',
      clientId,
    });
  } catch (e) {
    console.warn('[Auth] Failed to initialize CognitoJwtVerifier. Will use fallback for testing.', e);
  }
}

export async function authMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    // If running in development/demo mode without auth requirement
    if (process.env.NODE_ENV === 'test' || process.env.ALLOW_ANONYMOUS_DEV === 'true') {
      req.user = {
        userId: (req.headers['x-user-id'] as string) || 'demo-user-123',
        email: 'demo@eventmate.ai',
      };
      return next();
    }

    res.status(401).json({
      error: 'Unauthorized',
      message: 'Missing Authorization header. Please sign in.',
    });
    return;
  }

  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;

  // 1. If Cognito verifier is initialized, verify signature cryptographically
  if (verifier) {
    try {
      const payload = await verifier.verify(token);
      req.user = {
        userId: payload.sub,
        email: (payload.email as string) || undefined,
      };
      return next();
    } catch (err: any) {
      console.warn('[Auth] Token verification failed:', err.message);
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid or expired authentication token. Please sign in again.',
      });
      return;
    }
  }

  // 2. In production, unverified tokens are strictly prohibited
  if (process.env.NODE_ENV === 'production') {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Cognito authentication verifier is not configured for production environment.',
    });
    return;
  }

  // 3. Development / Local Test Fallback ONLY (NODE_ENV !== 'production')
  // Strictly allow only deterministic test/demo tokens, NEVER forged arbitrary JWTs
  if (token.startsWith('demo-token-')) {
    const parts = token.split('-');
    const suffix = parts.slice(2).join('-');
    const sanitizedId = suffix.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 36) || 'demo-user-123';
    req.user = {
      userId: `user_${sanitizedId}`,
      email: 'student.organiser@university.edu',
    };
    return next();
  }

  // Reject any unrecognized or forged tokens
  res.status(401).json({
    error: 'Unauthorized',
    message: 'Invalid authentication credentials.',
  });
}
