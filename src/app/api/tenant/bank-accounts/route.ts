import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { getTenantDb } from '@/lib/turso';
import { eq, and } from 'drizzle-orm';
import { bankAccounts, chartOfAccounts } from '@/lib/db/schema/tenant';

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

    // Fetch bank accounts for the current store with their chart accounts
    const accounts = await db
      .select({
        id: bankAccounts.id,
        storeId: bankAccounts.storeId,
        chartAccountId: bankAccounts.chartAccountId,
        accountName: bankAccounts.accountName,
        bankName: bankAccounts.bankName,
        accountNumber: bankAccounts.accountNumber,
        accountType: bankAccounts.accountType,
        routingNumber: bankAccounts.routingNumber,
        swiftCode: bankAccounts.swiftCode,
        iban: bankAccounts.iban,
        currency: bankAccounts.currency,
        currentBalance: bankAccounts.currentBalance,
        availableBalance: bankAccounts.availableBalance,
        isActive: bankAccounts.isActive,
        isDefault: bankAccounts.isDefault,
        branchName: bankAccounts.branchName,
        branchAddress: bankAccounts.branchAddress,
        contactPerson: bankAccounts.contactPerson,
        contactPhone: bankAccounts.contactPhone,
        description: bankAccounts.description,
        notes: bankAccounts.notes,
        createdAt: bankAccounts.createdAt,
        updatedAt: bankAccounts.updatedAt,
        chartAccount: {
          id: chartOfAccounts.id,
          accountCode: chartOfAccounts.accountCode,
          accountName: chartOfAccounts.accountName,
          accountType: chartOfAccounts.accountType,
        }
      })
      .from(bankAccounts)
      .leftJoin(chartOfAccounts, eq(bankAccounts.chartAccountId, chartOfAccounts.id))
      .where(eq(bankAccounts.isActive, true))
      .orderBy(bankAccounts.accountName);

    return NextResponse.json(accounts);
  } catch (error) {
    console.error('Error fetching bank accounts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bank accounts' },
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
    if (!data.accountName || !data.bankName || !data.accountNumber || !data.accountType) {
      return NextResponse.json(
        { error: 'Missing required fields: accountName, bankName, accountNumber, accountType' },
        { status: 400 }
      );
    }

    // Create new bank account
    const [newAccount] = await db
      .insert(bankAccounts)
      .values({
        storeId: 1, // Default store ID for tenant
        chartAccountId: data.chartAccountId,
        accountName: data.accountName,
        bankName: data.bankName,
        accountNumber: data.accountNumber,
        accountType: data.accountType,
        routingNumber: data.routingNumber,
        swiftCode: data.swiftCode,
        iban: data.iban,
        currency: data.currency || 'HNL',
        currentBalance: data.currentBalance || 0,
        availableBalance: data.availableBalance || 0,
        isActive: data.isActive ?? true,
        isDefault: data.isDefault ?? false,
        branchName: data.branchName,
        branchAddress: data.branchAddress,
        contactPerson: data.contactPerson,
        contactPhone: data.contactPhone,
        description: data.description,
        notes: data.notes,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .returning();

    return NextResponse.json(newAccount, { status: 201 });
  } catch (error) {
    console.error('Error creating bank account:', error);
    return NextResponse.json(
      { error: 'Failed to create bank account' },
      { status: 500 }
    );
  }
}