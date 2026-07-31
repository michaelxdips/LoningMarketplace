export class SlugConflictError extends Error {
  readonly code = 'SLUG_CONFLICT';
  readonly statusCode = 409;

  constructor() {
    super('Unable to allocate a unique slug');
    this.name = 'SlugConflictError';
  }
}

export class MigrationPreflightError extends Error {
  readonly code = 'MIGRATION_PREFLIGHT_FAILED';

  constructor(message: string) {
    super(message);
    this.name = 'MigrationPreflightError';
  }
}
