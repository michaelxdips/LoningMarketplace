import { expect, type ConsoleMessage, type Page, type Request, type Response } from '@playwright/test';

export type HttpErrorEvent = { method: string; url: string; status: number; statusText: string; resourceType: string };
export type RequestFailureEvent = { method: string; url: string; resourceType: string; errorText?: string };
export type ApplicationConsoleError = { text: string; locationUrl: string; consoleType: string; lineNumber: number; columnNumber: number };
export type BrowserDiagnosticEvent = ApplicationConsoleError & HttpErrorEvent;
export type PageErrorEvent = { message: string };
export type ExpectedRequest = { method: 'GET'; url: RegExp };
export type ExpectedTransition = { reason: string; expectedRequests: ExpectedRequest[]; active: boolean };
export type RequestFailureClassification = 'expected-route-transition-abort' | 'expected-viewport-image-abort' | 'expected-map-frame-abort' | 'mutation-abort' | 'orb-failure' | 'unexpected';

export type BrowserEvents = {
  httpErrors: HttpErrorEvent[];
  requestFailures: RequestFailureEvent[];
  expectedRouteTransitionAborts: RequestFailureEvent[];
  unexpectedRequestFailures: RequestFailureEvent[];
  mutationAborts: RequestFailureEvent[];
  orbFailures: RequestFailureEvent[];
  applicationConsoleErrors: ApplicationConsoleError[];
  consoleErrors: ApplicationConsoleError[];
  consoleWarnings: ApplicationConsoleError[];
  browserDiagnostics: BrowserDiagnosticEvent[];
  pageErrors: PageErrorEvent[];
  beginExpectedTransition: (input: { reason: string; expectedRequests: ExpectedRequest[] }) => { complete: () => void };
  finalize: () => void;
  dispose: () => void;
};

export function classifyRequestFailure(input: RequestFailureEvent & { transition?: ExpectedTransition }): RequestFailureClassification {
  const mutation = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(input.method);
  if (mutation && input.errorText === 'net::ERR_ABORTED') return 'mutation-abort';
  if (input.errorText?.includes('BLOCKED_BY_ORB')) return 'orb-failure';
  if ((input.errorText === 'net::ERR_ABORTED' || input.errorText === 'net::ERR_FAILED') && input.method === 'GET' && input.resourceType === 'document' && /^https:\/\/www\.openstreetmap\.org\/export\/embed\.html\?/.test(input.url)) return 'expected-map-frame-abort';
  if (input.errorText === 'net::ERR_ABORTED' && input.method === 'GET' && input.resourceType === 'fetch' && /\/api\/manage\/umkms\/[0-9a-f-]+$/.test(input.url)) return 'expected-route-transition-abort';
  if (input.errorText === 'net::ERR_ABORTED' && input.method === 'GET' && input.resourceType === 'image' && input.url.includes('/media/')) return 'expected-viewport-image-abort';
  if (input.errorText === 'net::ERR_ABORTED' && input.method === 'GET' && input.transition?.active && input.transition.expectedRequests.some((expected) => expected.method === input.method && expected.url.test(input.url))) {
    return 'expected-route-transition-abort';
  }
  return 'unexpected';
}

const browserResourceDiagnostic = /^Failed to load resource: the server responded with a status of (\d+) \((.+)\)$/;
function toBrowserDiagnostic(raw: ApplicationConsoleError, httpErrors: HttpErrorEvent[]): BrowserDiagnosticEvent | undefined {
  const match = browserResourceDiagnostic.exec(raw.text);
  if (!match) return undefined;
  const response = httpErrors.find((candidate) => candidate.url === raw.locationUrl && candidate.status === Number(match[1]) && candidate.statusText === match[2]);
  return response ? { ...raw, ...response } : undefined;
}

export function observeBrowserEvents(page: Page): BrowserEvents {
  const httpErrors: HttpErrorEvent[] = [];
  const requestFailures: RequestFailureEvent[] = [];
  const expectedRouteTransitionAborts: RequestFailureEvent[] = [];
  const unexpectedRequestFailures: RequestFailureEvent[] = [];
  const mutationAborts: RequestFailureEvent[] = [];
  const orbFailures: RequestFailureEvent[] = [];
  const applicationConsoleErrors: ApplicationConsoleError[] = [];
  const consoleErrors: ApplicationConsoleError[] = [];
  const consoleWarnings: ApplicationConsoleError[] = [];
  const browserDiagnostics: BrowserDiagnosticEvent[] = [];
  const pageErrors: PageErrorEvent[] = [];
  const rawConsoleErrors: ApplicationConsoleError[] = [];
  let transition: ExpectedTransition | undefined;
  let finalized = false;
  let disposed = false;

  const onResponse = (response: Response) => {
    if (response.status() >= 400) httpErrors.push({ method: response.request().method(), url: response.url(), status: response.status(), statusText: response.statusText(), resourceType: response.request().resourceType() });
  };
  const onRequestFailed = (request: Request) => {
    const failure = { method: request.method(), url: request.url(), resourceType: request.resourceType(), errorText: request.failure()?.errorText };
    requestFailures.push(failure);
    const classification = classifyRequestFailure({ ...failure, transition });
    if (classification === 'expected-route-transition-abort' || classification === 'expected-viewport-image-abort' || classification === 'expected-map-frame-abort') expectedRouteTransitionAborts.push(failure);
    else if (classification === 'mutation-abort') mutationAborts.push(failure);
    else if (classification === 'orb-failure') orbFailures.push(failure);
    else unexpectedRequestFailures.push(failure);
  };
  const onConsole = (message: ConsoleMessage) => {
    if (!['error', 'warning'].includes(message.type())) return;
    const location = message.location();
    const event = { text: message.text(), locationUrl: location.url, consoleType: message.type(), lineNumber: location.lineNumber, columnNumber: location.columnNumber };
    rawConsoleErrors.push(event);
    if (message.type() === 'error') consoleErrors.push(event); else consoleWarnings.push(event);
  };
  const onPageError = (error: Error) => pageErrors.push({ message: error.message });
  page.on('response', onResponse); page.on('requestfailed', onRequestFailed); page.on('console', onConsole); page.on('pageerror', onPageError);

  return {
    httpErrors, requestFailures, expectedRouteTransitionAborts, unexpectedRequestFailures, mutationAborts, orbFailures,
    applicationConsoleErrors, consoleErrors, consoleWarnings, browserDiagnostics, pageErrors,
    beginExpectedTransition: ({ reason, expectedRequests }) => {
      if (disposed) throw new Error(`Cannot begin transition after dispose: ${reason}`);
      if (transition?.active) throw new Error(`Concurrent browser transitions are unsupported: ${transition.reason}`);
      transition = { reason, expectedRequests, active: true };
      return { complete: () => { if (!transition?.active) throw new Error(`Transition already completed: ${reason}`); transition.active = false; transition = undefined; } };
    },
    finalize: () => {
      if (finalized) return;
      finalized = true;
      if (transition?.active) throw new Error(`Expected browser transition was not completed: ${transition.reason}`);
      for (const raw of rawConsoleErrors) {
        const match = toBrowserDiagnostic(raw, httpErrors);
        if (match) browserDiagnostics.push(match); else applicationConsoleErrors.push(raw);
      }
    },
    dispose: () => {
      if (disposed) return;
      if (transition?.active) { transition.active = false; transition = undefined; }
      page.off('response', onResponse); page.off('requestfailed', onRequestFailed); page.off('console', onConsole); page.off('pageerror', onPageError);
      disposed = true;
    },
  };
}

export type ExpectedHttpError = HttpErrorEvent;
export type ExpectedBrowserDiagnostic = Pick<BrowserDiagnosticEvent, 'text' | 'locationUrl' | 'consoleType' | 'method' | 'url' | 'status' | 'statusText' | 'resourceType'>;
function comparable<T>(event: T) { return event; }
function comparableBrowserDiagnostic(event: BrowserDiagnosticEvent): ExpectedBrowserDiagnostic { return { text: event.text, locationUrl: event.locationUrl, consoleType: event.consoleType, method: event.method, url: event.url, status: event.status, statusText: event.statusText, resourceType: event.resourceType }; }
function sorted<T>(events: T[]) { return [...events].sort((left, right) => JSON.stringify(left).localeCompare(JSON.stringify(right))); }

export function assertBrowserEvents(events: BrowserEvents, expected: { httpErrors?: ExpectedHttpError[]; requestFailures?: RequestFailureEvent[]; browserDiagnostics?: ExpectedBrowserDiagnostic[] } = {}) {
  events.finalize();
  expect(sorted(events.httpErrors.map(comparable))).toEqual(sorted(expected.httpErrors ?? []));
  expect(sorted(events.unexpectedRequestFailures.map(comparable))).toEqual(sorted(expected.requestFailures ?? []));
  expect(sorted(events.mutationAborts)).toEqual([]);
  expect(sorted(events.orbFailures)).toEqual([]);
  expect(sorted(events.applicationConsoleErrors.map(comparable))).toEqual([]);
  expect(sorted(events.pageErrors)).toEqual([]);
  expect(sorted(events.browserDiagnostics.map(comparableBrowserDiagnostic))).toEqual(sorted(expected.browserDiagnostics ?? []));
}
