import { Schema } from 'mongoose';

export function tenantPlugin(schema: Schema) {
  // Add indexes for multi-tenant performance
  schema.index({ organizationId: 1, branchId: 1 });

  // Optional: Add global hooks if needed
  // Note: Global find hooks can be tricky with NestJS injection
}
