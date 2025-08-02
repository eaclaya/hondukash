import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

export async function GET(_request: NextRequest) {
  try {
    const supabase = createClient()

    // Test basic connection
    console.log('Testing database connection...')

    // Check if tenants table exists
    const { data: tables, error: tablesError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'tenants';
      `
    })

    if (tablesError) {
      console.error('Error checking tables:', tablesError)
      return NextResponse.json({ 
        error: 'Database connection failed',
        details: tablesError 
      }, { status: 500 })
    }

    console.log('Tables check result:', tables)

    // Try to query tenants table
    const { data: tenants, error: tenantsError } = await supabase
      .from('tenants')
      .select('count')
      .limit(1)

    return NextResponse.json({
      message: 'Database test completed',
      tablesExist: tables && tables.length > 0,
      tables: tables,
      tenantsQueryError: tenantsError,
      tenantsData: tenants
    })

  } catch (error: unknown) {
    console.error('Database test error:', error)
    return NextResponse.json({ 
      error: 'Database test failed',
      message: error instanceof Error ? error.message : 'Unknown error occurred' 
    }, { status: 500 })
  }
}