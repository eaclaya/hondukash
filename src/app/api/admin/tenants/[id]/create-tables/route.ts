import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/turso';
import { tenants } from '@/lib/db/schema';
import { readFileSync } from 'fs';
import { join } from 'path';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: tenantId } = await params;

    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID is required' }, { status: 400 });
    }

    // Get tenant record to get schema name
    const tenant = await db.select()
      .from(tenants)
      .where(eq(tenants.id, parseInt(tenantId)))
      .limit(1);

    if (tenant.length === 0) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    const tenantRecord = tenant[0];

    const schemaName = tenantRecord.schemaName;
    console.log(schemaName);
    // Check if schema exists
    // const { data: schemas } = await supabase.rpc('exec_sql', {
    //   sql: `SELECT schema_name FROM information_schema.schemata WHERE schema_name = '${schemaName}';`
    // });
    // console.log(schemas);
    // const schemaExists = schemas && schemas.length > 0;

    // if (!schemaExists) {
    //   return NextResponse.json({ error: 'Tenant schema does not exist' }, { status: 400 });
    // }

    // Read the tenant schema SQL file
    const schemaPath = join(process.cwd(), 'database', 'schema', 'tenant_schema.sql');
    let schemaSql = readFileSync(schemaPath, 'utf8');
    console.log(schemaSql);
    // Replace placeholder with actual schema name
    schemaSql = schemaSql.replaceAll('{TENANT_SCHEMA}', schemaName);

    // Execute the schema creation SQL (tables will be created if they don't exist)
    await turso.execute(schemaSql);

    return NextResponse.json({
      message: 'Tenant tables created successfully',
      schemaName: schemaName
    });
  } catch (error: any) {
    console.error('Error in create tables endpoint:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
