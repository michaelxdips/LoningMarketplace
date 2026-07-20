import { expect, type ConsoleMessage, type Page, type Request, type Response } from '@playwright/test';

export type HttpErrorEvent = {
  method: string;
  url: string;
  status: number;
  statusText: string;
  resourceType: string;
};

export type RequestFailureEvent = {
  method: string;
  url: string;
  resourceType: string;
  errorText?: string;
};

export type ApplicationConsoleError = {
  text: string;
  locationUrl: string;
  consoleType: string;
  lineNumber: number;
  columnNumber: number;
};

export type BrowserDiagnosticEvent = ApplicationConsoleError & {
  method: string;
  url: string;
  status: number;
  statusText: string;
  resourceType: string;
};

export type PageErrorEvent = {
  message: string;
};

export type BrowserEvents = {
  httpErrors: HttpErrorEvent[];
  requestFailures: RequestFailureEvent[];
  expectedNavigationAborts: RequestFailureEvent[];
  unexpectedRequestFailures: RequestFailureEvent[];
  applicationConsoleErrors: ApplicationConsoleError[];
  browserDiagnostics: BrowserDiagnosticEvent[];
  pageErrors: PageErrorEvent[];
  finalize: () => void;
  dispose: () => void;
};

type RawConsoleError = ApplicationConsoleError;

const browserResourceDiagnostic = /^Failed to load resource: the server responded with a status of (\d+) \((.+)\)$/;

function isSameResponse(response: HttpErrorEvent, method: string, url: string, status: number, statusText: string) {
  return response.method === method && response.url === url && response.status === status && response.statusText === statusText;
}

function toBrowserDiagnostic(raw: RawConsoleError, httpErrors: HttpErrorEvent[]): BrowserDiagnosticEvent | undefined {
  const match = browserResourceDiagnostic.exec(raw.text);
  if (!match) return undefined;
  const status = Number(match[1]);
  const statusText = match[2];
  const response = httpErrors.find((candidate) => isSameResponse(candidate, 'GET', raw.locationUrl, status, statusText))
    ?? httpErrors.find((candidate) => isSameResponse(candidate, 'POST', raw.locationUrl, status, statusText))
    ?? httpErrors.find((candidate) => candidate.url === raw.locationUrl && candidate.status === status && candidate.statusText === statusText);
  if (!response) return undefined;
  return { ...raw, method: response.method, url: response.url, status: response.status, statusText: response.statusText, resourceType: response.resourceType };
}

export function observeBrowserEvents(page: Page): BrowserEvents {
  const httpErrors: HttpErrorEvent[] = [];
  const expectedNavigationAborts: RequestFailureEvent[] = [];
  const unexpectedRequestFailures: RequestFailureEvent[] = [];
  const applicationConsoleErrors: ApplicationConsoleError[] = [];
  const browserDiagnostics: BrowserDiagnosticEvent[] = [];
  const pageErrors: PageErrorEvent[] = [];
  const rawConsoleErrors: RawConsoleError[] = [];
  let finalized = false;
  let navigationInProgress = false;

  const onResponse = (response: Response) => {
    if (response.status() < 400) return;
    httpErrors.push({
      method: response.request().method(),
      url: response.url(),
      status: response.status(),
      statusText: response.statusText(),
      resourceType: response.request().resourceType(),
    });
  };
  const onRequestFailed = (request: Request) => {
    const errorText = request.failure()?.errorText;
    const failure = {
      method: request.method(),
      url: request.url(),
      resourceType: request.resourceType(),
      errorText,
    };
    if (errorText === 'net::ERR_ABORTED' && navigationInProgress && request.method() === 'GET') {
      expectedNavigationAborts.push(failure);
    } else {
      unexpectedRequestFailures.push(failure);
    }
  };
  const onConsole = (message: ConsoleMessage) => {
    if (message.type() !== 'error') return;
    const location = message.location();
    rawConsoleErrors.push({
      text: message.text(),
      locationUrl: location.url,
      consoleType: message.type(),
      lineNumber: location.lineNumber,
      columnNumber: location.columnNumber,
    });
  };
  const onPageError = (error: Error) => pageErrors.push({ message: error.message });
  
  // Reset navigation in progress when the new page fully loads
  page.on('load', () => { navigationInProgress = false; });
  
  // Track navigation state automatically for page.goto
  const originalGoto = page.goto;
  page.goto = async function (url: string, options?: any) {
    navigationInProgress = true;
    try {
      return await originalGoto.call(page, url, options);
    } finally {
      setTimeout(() => { navigationInProgress = false; }, 2000);
    }
  };

  // Add a binding to notify Node.js of navigation starts
  // We use a unique name to avoid conflicts if multiple observers are created
  const bindingName = `__notifyNavigation_${Math.random().toString(36).substring(7)}`;
  page.exposeBinding(bindingName, () => {
    navigationInProgress = true;
    setTimeout(() => { navigationInProgress = false; }, 2000);
  }).catch(() => {}); // Ignore if already bound

  const setupInterception = (name: string) => {
    // Prevent double-binding in the same document
    if ((window as any)[`__intercepted_${name}`]) return;
    (window as any)[`__intercepted_${name}`] = true;
    
    const notify = () => {
      if (typeof window[name as any] === 'function') {
        (window[name as any] as any)();
      }
    };
    window.addEventListener('popstate', notify);
    window.addEventListener('beforeunload', notify);
    
    const p = history.pushState;
    history.pushState = function(...args) {
      notify();
      return p.apply(this, args);
    };
    
    const r = history.replaceState;
    history.replaceState = function(...args) {
      notify();
      return r.apply(this, args);
    };
  };

  page.addInitScript(setupInterception, bindingName);
  page.evaluate(setupInterception, bindingName).catch(() => {});

  const onRequest = (request: Request) => {
    if (request.isNavigationRequest()) {
      navigationInProgress = true;
      setTimeout(() => { navigationInProgress = false; }, 500);
    }
  };

  page.on('request', onRequest);
  page.on('response', onResponse);
  page.on('requestfailed', onRequestFailed);
  page.on('console', onConsole);
  page.on('pageerror', onPageError);

  return {
    httpErrors,
    expectedNavigationAborts,
    unexpectedRequestFailures,
    requestFailures: unexpectedRequestFailures, // Provide backward compatibility
    applicationConsoleErrors,
    browserDiagnostics,
    pageErrors,
    finalize: () => {
      if (finalized) return;
      finalized = true;
      for (const raw of rawConsoleErrors) {
        const diagnostic = toBrowserDiagnostic(raw, httpErrors);
        if (diagnostic) browserDiagnostics.push(diagnostic);
        else applicationConsoleErrors.push(raw);
      }
    },
    dispose: () => {
      page.off('request', onRequest);
      page.off('response', onResponse);
      page.off('requestfailed', onRequestFailed);
      page.off('console', onConsole);
      page.off('pageerror', onPageError);
    },
  };
}

export type ExpectedHttpError = HttpErrorEvent;
export type ExpectedBrowserDiagnostic = Pick<BrowserDiagnosticEvent, 'text' | 'locationUrl' | 'consoleType' | 'method' | 'url' | 'status' | 'statusText' | 'resourceType'>;

function comparableHttpError(event: HttpErrorEvent) {
  return event;
}

function comparableRequestFailure(event: RequestFailureEvent) {
  return event;
}

function comparableConsoleError(event: ApplicationConsoleError) {
  return event;
}

function comparableBrowserDiagnostic(event: BrowserDiagnosticEvent): ExpectedBrowserDiagnostic {
  return {
    text: event.text,
    locationUrl: event.locationUrl,
    consoleType: event.consoleType,
    method: event.method,
    url: event.url,
    status: event.status,
    statusText: event.statusText,
    resourceType: event.resourceType,
  };
}

function sorted<T>(events: T[]) {
  return [...events].sort((left, right) => JSON.stringify(left).localeCompare(JSON.stringify(right)));
}

export function assertBrowserEvents(
  events: BrowserEvents,
  expected: {
    httpErrors?: ExpectedHttpError[];
    requestFailures?: RequestFailureEvent[];
    browserDiagnostics?: ExpectedBrowserDiagnostic[];
  } = {},
) {
  events.finalize();
  expect(sorted(events.httpErrors.map(comparableHttpError))).toEqual(sorted(expected.httpErrors ?? []));
  expect(sorted(events.requestFailures.map(comparableRequestFailure))).toEqual(sorted(expected.requestFailures ?? []));
  expect(sorted(events.applicationConsoleErrors.map(comparableConsoleError))).toEqual([]);
  expect(sorted(events.pageErrors)).toEqual([]);
  expect(sorted(events.browserDiagnostics.map(comparableBrowserDiagnostic))).toEqual(sorted(expected.browserDiagnostics ?? []));
}
