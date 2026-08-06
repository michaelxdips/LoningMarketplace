import { expect, test } from '@playwright/test';
import { classifyRequestFailure, observeBrowserEvents, type ExpectedTransition } from './browser-events';

const transition = (active = true): ExpectedTransition => ({ reason: 'test-navigation', expectedRequests: [{ method: 'GET', url: /\/api\/products(?:\?|$)/ }], active });
const failure = (overrides: Partial<{ method: string; url: string; resourceType: string; errorText?: string }> = {}) => ({ method: 'GET', url: 'http://localhost:3001/api/products', resourceType: 'fetch', errorText: 'net::ERR_ABORTED', ...overrides });

test.describe('browser event classifier', () => {
  test('classifies only matching GET aborts during an explicit active transition', () => {
    expect(classifyRequestFailure({ ...failure(), transition: transition() })).toBe('expected-route-transition-abort');
    expect(classifyRequestFailure(failure())).toBe('unexpected');
    expect(classifyRequestFailure({ ...failure({ url: 'http://localhost:3001/api/umkms' }), transition: transition() })).toBe('unexpected');
    expect(classifyRequestFailure({ ...failure(), transition: transition(false) })).toBe('unexpected');
  });

  test('keeps all mutation aborts and special failures visible while classifying image aborts', () => {
    for (const method of ['POST', 'PATCH', 'DELETE']) expect(classifyRequestFailure({ ...failure({ method }), transition: transition() })).toBe('mutation-abort');
    expect(classifyRequestFailure(failure({ errorText: 'net::ERR_BLOCKED_BY_ORB' }))).toBe('orb-failure');
    expect(classifyRequestFailure(failure({ errorText: 'net::ERR_CONNECTION_RESET' }))).toBe('unexpected');
    expect(classifyRequestFailure({ ...failure({ errorText: undefined }), transition: transition() })).toBe('unexpected');

    expect(classifyRequestFailure({ method: 'GET', url: 'http://localhost:3000/media/asset/card.webp', resourceType: 'image', errorText: 'net::ERR_ABORTED' })).toBe('expected-viewport-image-abort');
    expect(classifyRequestFailure({ method: 'GET', url: 'http://localhost:3000/images/hero/produk-1.jpg', resourceType: 'image', errorText: 'net::ERR_ABORTED' })).toBe('unexpected');
    expect(classifyRequestFailure({ method: 'GET', url: 'http://localhost:3000/images/hero/produk-1.jpg', resourceType: 'image', errorText: 'net::ERR_ABORTED', transition: transition() })).toBe('expected-viewport-image-abort');
    expect(classifyRequestFailure({ method: 'GET', url: 'https://maps.google.com/maps?q=-6.891236,109.382146&z=16&output=embed', resourceType: 'document', errorText: 'net::ERR_ABORTED' })).toBe('expected-google-map-embed-abort');
    expect(classifyRequestFailure({ method: 'GET', url: 'https://maps.googleapis.com/maps/api/js/StaticMapService.GetMapImage?token=test', resourceType: 'image', errorText: 'net::ERR_ABORTED' })).toBe('expected-google-map-embed-abort');
    expect(classifyRequestFailure({ method: 'GET', url: 'https://maps.googleapis.com/maps/api/mapsjs/gen_204?csp_test=true', resourceType: 'xhr', errorText: 'net::ERR_ABORTED' })).toBe('expected-google-map-embed-abort');
    expect(classifyRequestFailure({ method: 'GET', url: 'https://maps.googleapis.com/maps/api/mapsjs/gen_204?other=true', resourceType: 'xhr', errorText: 'net::ERR_ABORTED' })).toBe('unexpected');
    expect(classifyRequestFailure({ method: 'GET', url: 'https://maps.googleapis.com/unrelated.png', resourceType: 'image', errorText: 'net::ERR_ABORTED' })).toBe('unexpected');

    // FAIL — document / fetch / xhr / script net::ERR_ABORTED
    expect(classifyRequestFailure({ method: 'GET', url: 'http://localhost:3000/faq', resourceType: 'document', errorText: 'net::ERR_ABORTED' })).toBe('unexpected');
    expect(classifyRequestFailure({ method: 'GET', url: 'http://localhost:3000/api/data', resourceType: 'fetch', errorText: 'net::ERR_ABORTED' })).toBe('unexpected');
    expect(classifyRequestFailure({ method: 'GET', url: 'http://localhost:3000/api/data', resourceType: 'xhr', errorText: 'net::ERR_ABORTED' })).toBe('unexpected');
    expect(classifyRequestFailure({ method: 'GET', url: 'http://localhost:3000/app.js', resourceType: 'script', errorText: 'net::ERR_ABORTED' })).toBe('unexpected');

    // FAIL — image ERR_NAME_NOT_RESOLVED / connection reset
    expect(classifyRequestFailure({ method: 'GET', url: 'http://localhost:3000/images/hero/produk-1.jpg', resourceType: 'image', errorText: 'net::ERR_NAME_NOT_RESOLVED' })).toBe('unexpected');
    expect(classifyRequestFailure({ method: 'GET', url: 'http://localhost:3000/images/hero/produk-1.jpg', resourceType: 'image', errorText: 'net::ERR_CONNECTION_RESET' })).toBe('unexpected');
  });

  test('production collector retains request-start ownership for a late abort and disposes listeners', () => {
    const listeners = new Map<string, Set<(...args: any[]) => void>>();
    const page = { on: (name: string, listener: (...args: any[]) => void) => { if (!listeners.has(name)) listeners.set(name, new Set()); listeners.get(name)!.add(listener); }, off: (name: string, listener: (...args: any[]) => void) => listeners.get(name)?.delete(listener) } as any;
    const emit = (name: string, ...args: any[]) => { for (const listener of listeners.get(name) ?? []) listener(...args); };
    const events = observeBrowserEvents(page);
    const route = events.beginExpectedTransition({ reason: 'products', expectedRequests: [{ method: 'GET', url: /\/api\/products/ }] });
    const lateRequest = { method: () => 'GET', url: () => 'http://localhost:3001/api/products', resourceType: () => 'fetch', failure: () => ({ errorText: 'net::ERR_ABORTED' }) };
    emit('request', lateRequest);
    route.complete();
    emit('requestfailed', lateRequest);
    const inFlightRequest = { method: () => 'GET', url: () => 'http://localhost:3001/api/products?limit=100', resourceType: () => 'fetch', failure: () => ({ errorText: 'net::ERR_ABORTED' }) };
    emit('request', inFlightRequest);
    const logout = events.beginExpectedTransition({ reason: 'logout', expectedRequests: [{ method: 'GET', url: /\/api\/products/ }] });
    logout.complete();
    emit('requestfailed', inFlightRequest);
    expect(events.expectedRouteTransitionAborts).toHaveLength(2);
    expect(events.requestFailures).toHaveLength(2);
    events.dispose();
    expect([...listeners.values()].every(set => set.size === 0)).toBe(true);
  });

  test('rejects concurrent transitions and prevents sequential state leakage', () => {
    const listeners = new Map<string, Set<(...args: any[]) => void>>();
    const page = { on: (name: string, listener: (...args: any[]) => void) => { if (!listeners.has(name)) listeners.set(name, new Set()); listeners.get(name)!.add(listener); }, off: (name: string, listener: (...args: any[]) => void) => listeners.get(name)?.delete(listener) } as any;
    const events = observeBrowserEvents(page);
    const first = events.beginExpectedTransition({ reason: 'first', expectedRequests: [{ method: 'GET', url: /first/ }] });
    expect(() => events.beginExpectedTransition({ reason: 'second', expectedRequests: [{ method: 'GET', url: /second/ }] })).toThrow(/Concurrent/);
    first.complete();
    const second = events.beginExpectedTransition({ reason: 'second', expectedRequests: [{ method: 'GET', url: /second/ }] });
    second.complete();
    events.dispose();
  });
});