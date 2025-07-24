import { verify } from 'jsonwebtoken';

export interface TenantAuthPayload {
  userId: number;
  email: string;
  role: string;
  tenantId: number;
  domain: string;
}

export function verifyTenantToken(token: string): TenantAuthPayload {
  try {
    const jwtSecret = process.env.JWT_SECRET || 'fallback-secret-key';
    const payload = verify(token, jwtSecret) as TenantAuthPayload;
    return payload;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}

export function getTenantSessionFromHeaders(request: Request): TenantAuthPayload | null {
  try {
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);
    return verifyTenantToken(token);
  } catch (error) {
    return null;
  }
}

export function requireTenantAuth(request: Request): TenantAuthPayload {
  const session = getTenantSessionFromHeaders(request);
  
  if (!session) {
    throw new Error('Authentication required');
  }
  
  return session;
}