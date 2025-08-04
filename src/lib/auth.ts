import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import { db } from '@/lib/turso'
import { users } from '@/lib/db/schema/landlord'
import { eq } from 'drizzle-orm'

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production'

interface AdminUser {
  id: number
  email: string
  name: string
  role: string
}

interface JWTPayload {
  userId: number
  email: string
  role: string
  iat?: number
  exp?: number
}

export async function getAdminSession() {
  const cookieStore = await cookies()
  const adminToken = cookieStore.get('admin-session')

  if (!adminToken?.value) {
    return {
      isAuthenticated: false,
      user: null
    }
  }

  try {
    // Verify and decode JWT token
    const decoded = jwt.verify(adminToken.value, JWT_SECRET)
    
    // Type guard to ensure we have the expected payload structure
    if (typeof decoded === 'object' && decoded !== null && 'userId' in decoded) {
      const payload = decoded as JWTPayload

      // Fetch current user data from database
      const user = await db.query.users.findFirst({
        where: eq(users.id, payload.userId),
        columns: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
          lastLoginAt: true
        }
      })

      if (!user || !user.isActive) {
        return {
          isAuthenticated: false,
          user: null
        }
      }

      return {
        isAuthenticated: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          lastLoginAt: user.lastLoginAt
        }
      }
    } else {
      return {
        isAuthenticated: false,
        user: null
      }
    }
  } catch (error) {
    console.error('JWT verification failed:', error)
    return {
      isAuthenticated: false,
      user: null
    }
  }
}

export function setAdminSession(user: AdminUser) {
  // Create JWT token with user information
  const payload: JWTPayload = {
    userId: user.id,
    email: user.email,
    role: user.role
  }

  const token = jwt.sign(payload, JWT_SECRET, {
    expiresIn: '7d'
  })

  return {
    name: 'admin-session',
    value: token,
    options: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/'
    }
  }
}

export function verifyAdminToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    
    // Type guard to ensure we have the expected payload structure
    if (typeof decoded === 'object' && decoded !== null && 'userId' in decoded) {
      return decoded as JWTPayload
    }
    
    return null
  } catch (error) {
    console.error('Token verification failed:', error)
    return null
  }
}