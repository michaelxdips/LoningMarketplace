export interface DisposableDatabaseEnvironment {
  NODE_ENV?: string;
  ALLOW_DISPOSABLE_DB_MUTATION?: string;
  DISPOSABLE_COMPOSE_PROJECT?: string;
  DATABASE_URL?: string;
  [key: string]: string | undefined;
}
export interface DisposableDatabaseTarget { project: string; host: string; port: number; database: string; redactedUrl: string }
export function assertDisposableDatabase(env: DisposableDatabaseEnvironment): DisposableDatabaseTarget;