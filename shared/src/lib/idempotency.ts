/**
 * Idempotency key generator for API requests
 */
export function generateIdempotencyKey(operation: string, resourceId?: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  return `${operation}:${resourceId || 'new'}:${timestamp}:${random}`;
}
