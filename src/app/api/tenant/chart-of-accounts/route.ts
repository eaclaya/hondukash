import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { getTenantDb } from '@/lib/turso';
import { eq, and } from 'drizzle-orm';
import { chartOfAccounts } from '@/lib/db/schema/tenant';

export async function GET(request: NextRequest) {
  try {
    const requestHeaders = await headers();
    const host = requestHeaders.get('host');

    if (!host) {
      return NextResponse.json({ error: 'Host header is required' }, { status: 400 });
    }

    // Extract domain from host (remove port if present)
    const domain = host.split(':')[0];
    
    const db = await getTenantDb(domain);

    // Get URL search params for filtering
    const url = new URL(request.url);
    const accountType = url.searchParams.get('accountType');
    const accountSubType = url.searchParams.get('accountSubType');
    const activeOnly = url.searchParams.get('activeOnly') === 'true';

    // Build where conditions
    let whereConditions = [eq(chartOfAccounts.storeId, 1)];
    
    if (accountType) {
      whereConditions.push(eq(chartOfAccounts.accountType, accountType as any));
    }
    
    if (accountSubType) {
      whereConditions.push(eq(chartOfAccounts.accountSubType, accountSubType as any));
    }
    
    if (activeOnly) {
      whereConditions.push(eq(chartOfAccounts.isActive, true));
    }

    // Fetch chart of accounts for the current store
    const accounts = await db
      .select()
      .from(chartOfAccounts)
      .where(and(...whereConditions))
      .orderBy(chartOfAccounts.accountCode);

    return NextResponse.json(accounts);
  } catch (error) {
    console.error('Error fetching chart of accounts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch chart of accounts' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const requestHeaders = await headers();
    const host = requestHeaders.get('host');

    if (!host) {
      return NextResponse.json({ error: 'Host header is required' }, { status: 400 });
    }

    // Extract domain from host (remove port if present)
    const domain = host.split(':')[0];
    
    const db = await getTenantDb(domain);
    const data = await request.json();

    // Validate required fields
    if (!data.accountCode || !data.accountName || !data.accountType || !data.accountSubType || !data.normalBalance) {
      return NextResponse.json(
        { error: 'Missing required fields: accountCode, accountName, accountType, accountSubType, normalBalance' },
        { status: 400 }
      );
    }

    // Create new chart of account
    const [newAccount] = await db
      .insert(chartOfAccounts)
      .values({
        storeId: 1, // Default store ID for tenant
        accountCode: data.accountCode,
        accountName: data.accountName,
        accountType: data.accountType,
        accountSubType: data.accountSubType,
        parentAccountId: data.parentAccountId ? parseInt(data.parentAccountId) : null,
        normalBalance: data.normalBalance,
        isSystemAccount: data.isSystemAccount ?? false,
        isControlAccount: data.isControlAccount ?? false,
        isActive: data.isActive ?? true,
        description: data.description,
        currentBalance: typeof data.currentBalance === 'number' ? data.currentBalance : 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .returning();

    return NextResponse.json(newAccount, { status: 201 });
  } catch (error) {
    console.error('Error creating chart of account:', error);
    return NextResponse.json(
      { error: `Failed to create chart of account: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}