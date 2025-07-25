// This file exports the landlord schema for the main database
export * from './schema/landlord';

// Re-export common types for backward compatibility
import { users, tenants } from './schema/landlord';
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Tenant = typeof tenants.$inferSelect;
export type NewTenant = typeof tenants.$inferInsert;
