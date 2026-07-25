import { expect, type Page, type Request } from '@playwright/test';

export type RequestFailureEvidence = {
  phase: string;
  timestamp: number;
  pageUrl: string;
  requestUrl: string;
  method: string;
  resourceType: string;
  errorText: string | null;
  isNavigationRequest: boolean;
  frameUrl: string | null;
  nativeZoomFactor: number;
};

export type StrictRequestWindowSnapshot = {
  phase: string;
  activeRequests: string[];
  failures: RequestFailureEvidence[];
};

export function createStrictRequestWindow(page: Page, applicationOrigins: string[], nativeZoomFactor: () => number) {
  const active = new Map<Request, string>();
  const failures: RequestFailureEvidence[] = [];
  const idleWaiters = new Set<() => void>();
  let phase: string | undefined;
  let disposed = false;
  let asserted = false;

  const isApplicationRequest = (request: Request) => applicationOrigins.some(origin => request.url().startsWith(origin));
  const notifyIfIdle = () => { if (active.size === 0) for (const resolve of idleWaiters) resolve(); };
  const onRequest = (request: Request) => {
    if (phase && isApplicationRequest(request)) active.set(request, `${request.method()} ${request.url()}`);
  };
  const finish = (request: Request) => {
    if (!phase || !isApplicationRequest(request)) return;
    active.delete(request);
    notifyIfIdle();
  };
  const onRequestFailed = (request: Request) => {
    if (!phase || !isApplicationRequest(request)) return;
    failures.push({ phase, timestamp: Date.now(), pageUrl: page.url(), requestUrl: request.url(), method: request.method(), resourceType: request.resourceType(), errorText: request.failure()?.errorText ?? null, isNavigationRequest: request.isNavigationRequest(), frameUrl: request.frame()?.url() ?? null, nativeZoomFactor: nativeZoomFactor() });
    finish(request);
  };

  page.on('request', onRequest);
  page.on('requestfinished', finish);
  page.on('requestfailed', onRequestFailed);

  return {
    begin(name: string) {
      if (disposed) throw new Error('Cannot begin a disposed request window');
      if (phase) throw new Error(`Request window already began: ${phase}`);
      phase = name;
    },
    async waitForIdle(timeout = 10_000) {
      if (!phase) throw new Error('Request window must begin before waiting for idle');
      if (active.size === 0) return;
      await new Promise<void>((resolve, reject) => {
        const timer = setTimeout(() => { idleWaiters.delete(onIdle); reject(new Error(`Application requests did not settle in ${phase}: ${JSON.stringify([...active.values()], null, 2)}`)); }, timeout);
        const onIdle = () => { clearTimeout(timer); idleWaiters.delete(onIdle); resolve(); };
        idleWaiters.add(onIdle);
      });
    },
    assertClean() {
      if (!phase) throw new Error('Request window must begin before assertion');
      if (active.size !== 0) throw new Error(`Cannot assert ${phase} while requests are active: ${JSON.stringify([...active.values()], null, 2)}`);
      asserted = true;
      expect(failures, JSON.stringify({ phase, failures }, null, 2)).toEqual([]);
    },
    snapshot(): StrictRequestWindowSnapshot {
      if (!phase) throw new Error('Request window must begin before snapshot');
      return { phase, activeRequests: [...active.values()], failures: failures.map(failure => ({ ...failure })) };
    },
    dispose() {
      if (disposed) return;
      page.off('request', onRequest);
      page.off('requestfinished', finish);
      page.off('requestfailed', onRequestFailed);
      idleWaiters.clear();
      disposed = true;
    },
  };
}
