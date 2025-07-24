-- =========================================
-- EXEC_SQL FUNCTION
-- =========================================
-- Creates a function to execute SQL commands from the application
-- This is required for the tenant provisioning system

CREATE OR REPLACE FUNCTION exec_sql(sql text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE sql;
END;
$$;

-- Grant execute permission to authenticated users
-- Note: In production, you may want to restrict this further
GRANT EXECUTE ON FUNCTION exec_sql(text) TO authenticated;
GRANT EXECUTE ON FUNCTION exec_sql(text) TO service_role;