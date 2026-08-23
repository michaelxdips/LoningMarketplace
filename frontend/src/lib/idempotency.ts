// Shim kompatibilitas Phase 0: sumber asli kini di @loning/shared.
// Dipertahankan agar impor lama di frontend/ dan target vi.mock() tetap valid.
export * from '@loning/shared/lib/idempotency';
