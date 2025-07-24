import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { readFileSync } from 'fs'
import { join } from 'path'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()

    // Read the public schema SQL file
    const schemaPath = join(process.cwd(), 'database', 'schema', 'public_schema.sql')
    const schemaSql = readFileSync(schemaPath, 'utf8')

    console.log('Setting up public schema...')

    // Execute the schema creation SQL
    const { error } = await supabase.rpc('exec_sql', { sql: schemaSql })

    if (error) {
      console.error('Error setting up public schema:', error)
      return NextResponse.json({ 
        error: 'Failed to setup public schema',
        details: error 
      }, { status: 500 })
    }

    // Also create the exec_sql function if it doesn't exist
    const execSqlPath = join(process.cwd(), 'database', 'functions', 'exec_sql.sql')
    const execSqlFunction = readFileSync(execSqlPath, 'utf8')

    const { error: funcError } = await supabase.rpc('exec_sql', { sql: execSqlFunction })

    if (funcError) {
      console.error('Error creating exec_sql function:', funcError)
      // Don't fail here as the function might already exist
    }

    return NextResponse.json({
      message: 'Database schema setup completed successfully'
    })

  } catch (error: any) {
    console.error('Database setup error:', error)
    return NextResponse.json({ 
      error: 'Database setup failed',
      message: error.message 
    }, { status: 500 })
  }
}