import { NextRequest, NextResponse } from 'next/server';
import { TenantService } from '@/lib/services/tenantService';
import { sign } from 'jsonwebtoken';
import { getTenantDb } from '@/lib/turso';
import { users, memberships } from '@/lib/db/schema/tenant';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const { email, password, domain } = await request.json();

    if (!email || !password || !domain) {
      return NextResponse.json(
        {
          error: 'Email, password, and domain are required'
        },
        { status: 400 }
      );
    }

    try {
      // Get tenant information
      const tenant = await TenantService.getTenantByDomain(domain);

      if (!tenant.isActive) {
        return NextResponse.json(
          {
            error: 'Tenant account is not active'
          },
          { status: 403 }
        );
      }

      // Connect to tenant database using Drizzle
      const db = await getTenantDb(domain);

      // Query user with Drizzle
      const user = await db.query.users.findFirst({
        where: eq(users.email, email)
      });

      if (!user || !user.isActive) {
        return NextResponse.json(
          {
            error: 'Invalid email or password'
          },
          { status: 401 }
        );
      }

      // Verify password
      const bcrypt = await import('bcryptjs');
      const isValidPassword = await bcrypt.compare(password, user.password);

      if (!isValidPassword) {
        return NextResponse.json(
          {
            error: 'Invalid email or password'
          },
          { status: 401 }
        );
      }

      // Query user memberships with related stores using Drizzle
      let userMemberships;
      try {
        userMemberships = await db.query.memberships.findMany({
          where: eq(memberships.userId, user.id),
          with: {
            store: true
          }
        });
      } catch (relationError) {
        console.log('Drizzle relation error, falling back to separate queries:', relationError);

        // Fallback: Query memberships separately and then get stores
        const membershipList = await db.query.memberships.findMany({
          where: eq(memberships.userId, user.id)
        });

        if (!membershipList || membershipList.length === 0) {
          return NextResponse.json(
            {
              error: 'No store access found for user'
            },
            { status: 401 }
          );
        }

        // Get stores for these memberships
        const storeIds = membershipList.map(m => m.storeId);
        const storeList = await db.query.stores.findMany();
        const userStoreList = storeList.filter(store => storeIds.includes(store.id));

        // Map stores with membership roles
        const userStores = userStoreList.map(store => {
          const membership = membershipList.find(m => m.storeId === store.id);
          return {
            id: store.id,
            name: store.name,
            code: store.code,
            description: store.description,
            location: store.location,
            address: store.address,
            city: store.city,
            state: store.state,
            country: store.country,
            postalCode: store.postalCode,
            phone: store.phone,
            email: store.email,
            managerName: store.managerName,
            currency: store.currency,
            taxRate: store.taxRate,
            invoicePrefix: store.invoicePrefix,
            invoiceCounter: store.invoiceCounter,
            isActive: store.isActive,
            createdAt: store.createdAt,
            updatedAt: store.updatedAt,
            role: membership?.role || 'user'
          };
        });

        // Set first store as default X-Store-ID
        const defaultStoreId = userStores.length > 0 ? userStores[0].id : null;

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
          stores: userStores,
          isActive: user.isActive,
          createdAt: user.createdAt
        };

        const response = NextResponse.json({
          success: true,
          user: userResponse,
          tenant: {
            id: tenant.id,
            name: tenant.name,
            domain: tenant.domain
          },
          token,
          expiresAt: expiresAt.toISOString(),
          defaultStoreId
        });

        // Set the default store ID in the response header
        if (defaultStoreId) {
          response.headers.set('X-Store-ID', defaultStoreId.toString());
        }

        return response;
      }

      if (!userMemberships || userMemberships.length === 0) {
        return NextResponse.json(
          {
            error: 'No store access found for user'
          },
          { status: 401 }
        );
      }

      // Extract stores from memberships
      const userStores = userMemberships.map((membership) => ({
        id: membership.store.id,
        name: membership.store.name,
        code: membership.store.code,
        description: membership.store.description,
        location: membership.store.location,
        address: membership.store.address,
        city: membership.store.city,
        state: membership.store.state,
        country: membership.store.country,
        postalCode: membership.store.postalCode,
        phone: membership.store.phone,
        email: membership.store.email,
        managerName: membership.store.managerName,
        currency: membership.store.currency,
        taxRate: membership.store.taxRate,
        invoicePrefix: membership.store.invoicePrefix,
        invoiceCounter: membership.store.invoiceCounter,
        isActive: membership.store.isActive,
        createdAt: membership.store.createdAt,
        updatedAt: membership.store.updatedAt,
        role: membership.role
      }));

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

      // Set first store as default X-Store-ID
      const defaultStoreId = userStores.length > 0 ? userStores[0].id : null;

      // Return user info and token (exclude password)
      const userResponse = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        stores: userStores,
        isActive: user.isActive,
        createdAt: user.createdAt
      };

      const response = NextResponse.json({
        success: true,
        user: userResponse,
        tenant: {
          id: tenant.id,
          name: tenant.name,
          domain: tenant.domain
        },
        token,
        expiresAt: expiresAt.toISOString(),
        defaultStoreId
      });

      // Set the default store ID in the response header
      if (defaultStoreId) {
        response.headers.set('X-Store-ID', defaultStoreId.toString());
      }

      return response;
    } catch (tenantError: any) {
      console.error('Tenant authentication error:', tenantError);
      return NextResponse.json(
        {
          error: 'Authentication failed',
          details: tenantError.message
        },
        { status: 500 }
      );
    }
  } catch (error: unknown) {
    console.error('Login API error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error'
      },
      { status: 500 }
    );
  }
}
