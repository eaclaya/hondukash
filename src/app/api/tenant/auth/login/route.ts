import { NextRequest, NextResponse } from 'next/server';
import { TenantService } from '@/lib/services/tenantService';
import { sign } from 'jsonwebtoken';

export async function POST(request: NextRequest) {
  try {
    const { email, password, domain } = await request.json();

    if (!email || !password || !domain) {
      return NextResponse.json({ 
        error: 'Email, password, and domain are required' 
      }, { status: 400 });
    }

    try {
      // Get tenant information
      const tenant = await TenantService.getTenantByDomain(domain);
      
      if (!tenant.isActive) {
        return NextResponse.json({ 
          error: 'Tenant account is not active' 
        }, { status: 403 });
      }

      // Connect to tenant database
      const tenantDb = await TenantService.connectToTenantDatabaseByDomain(domain);

      // Query user from tenant database
      const userResult = await tenantDb.execute({
        sql: 'SELECT * FROM users WHERE email = ? AND is_active = 1',
        args: [email]
      });

      if (!userResult.rows || userResult.rows.length === 0) {
        return NextResponse.json({ 
          error: 'Invalid email or password' 
        }, { status: 401 });
      }

      const user = userResult.rows[0];

      // Verify password
      const bcrypt = await import('bcryptjs');
      const isValidPassword = await bcrypt.compare(password, user.password as string);

      if (!isValidPassword) {
        return NextResponse.json({ 
          error: 'Invalid email or password' 
        }, { status: 401 });
      }

      // Generate JWT token
      const jwtSecret = process.env.JWT_SECRET || 'fallback-secret-key';
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      const token = sign(
        {
          userId: user.id,
          email: user.email,
          role: user.role,
          tenantId: tenant.id,
          domain: tenant.domain
        },
        jwtSecret,
        { expiresIn: '24h' }
      );

      // Return user info and token (exclude password)
      const userResponse = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isActive: user.is_active,
        createdAt: user.created_at
      };

      return NextResponse.json({
        success: true,
        user: userResponse,
        tenant: {
          id: tenant.id,
          name: tenant.name,
          domain: tenant.domain
        },
        token,
        expiresAt: expiresAt.toISOString()
      });

    } catch (tenantError: any) {
      console.error('Tenant authentication error:', tenantError);
      return NextResponse.json({ 
        error: 'Authentication failed',
        details: tenantError.message 
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('Login API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}