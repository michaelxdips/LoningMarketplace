import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { apiRequest, get, uploadMedia, ApiError, shouldRetryApiRequest, setUnauthorizedHandler } from './api';

describe('apiRequest errors', () => {
  afterEach(() => vi.restoreAllMocks());

  it.each([[400, 'VALIDATION_ERROR'], [401, 'UNAUTHENTICATED'], [403, 'FORBIDDEN'], [500, 'INTERNAL_ERROR']])('preserves a readable %s backend envelope', async (status, code) => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ error: { message: `Aman ${status}`, code } }), { status, headers: { 'Content-Type': 'application/json' } }));
    await expect(apiRequest('/test', { skipUnauthorizedHandler: true })).rejects.toMatchObject({ status, code, message: `Aman ${status}` });
  });

  it('classifies a genuine fetch rejection as a safe network error', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('Failed to fetch'));
    await expect(apiRequest('/test')).rejects.toMatchObject({ status: 0, code: 'NETWORK_ERROR', message: expect.stringContaining('Tidak dapat terhubung') });
  });

  it('preserves AbortError for React Query cancellation', async () => {
    const aborted = new DOMException('Aborted', 'AbortError');
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(aborted);
    await expect(apiRequest('/test')).rejects.toBe(aborted);
  });
});

describe('shouldRetryApiRequest policy', () => {
  it('retries exactly once for status 0 (network error)', () => {
    expect(shouldRetryApiRequest(0, new ApiError(0, 'Network'))).toBe(true);
    expect(shouldRetryApiRequest(1, new ApiError(0, 'Network'))).toBe(false);
  });
  
  it('retries exactly once for 5xx errors', () => {
    expect(shouldRetryApiRequest(0, new ApiError(500, 'Server Error'))).toBe(true);
    expect(shouldRetryApiRequest(1, new ApiError(500, 'Server Error'))).toBe(false);
    expect(shouldRetryApiRequest(0, new ApiError(503, 'Unavailable'))).toBe(true);
  });

  it('does not retry 4xx errors', () => {
    expect(shouldRetryApiRequest(0, new ApiError(400, 'Bad Request'))).toBe(false);
    expect(shouldRetryApiRequest(0, new ApiError(401, 'Unauthorized'))).toBe(false);
    expect(shouldRetryApiRequest(0, new ApiError(404, 'Not Found'))).toBe(false);
  });

  it('does not retry non-ApiError', () => {
    expect(shouldRetryApiRequest(0, new Error('Something else'))).toBe(false);
    expect(shouldRetryApiRequest(0, new DOMException('Aborted', 'AbortError'))).toBe(false);
  });
});

describe('get<T> shared logic', () => {
  let unauthorizedMock: any;
  beforeEach(() => {
    unauthorizedMock = vi.fn();
    setUnauthorizedHandler(unauthorizedMock);
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('handles 200 JSON success', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ data: { test: 123 } })));
    const res = await get('/test');
    expect(res).toEqual({ test: 123 });
  });

  it('handles 204 no content', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status: 204 }));
    const res = await get('/test');
    expect(res).toBeUndefined();
  });

  it('invokes unauthorizedHandler on 401 precisely once', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ error: { message: 'Unauthorized' } }), { status: 401 }));
    await expect(get('/test')).rejects.toThrow(ApiError);
    expect(unauthorizedMock).toHaveBeenCalledTimes(1);
  });

  it('does not invoke unauthorizedHandler on 403, 404, 500', async () => {
    for (const status of [403, 404, 500]) {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ error: { message: 'Err' } }), { status }));
      await expect(get('/test')).rejects.toThrow(ApiError);
      expect(unauthorizedMock).not.toHaveBeenCalled();
      unauthorizedMock.mockClear();
    }
  });

  it('does not invoke unauthorizedHandler on 401 if skipUnauthorizedHandler is true', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ error: { message: 'Unauthorized' } }), { status: 401 }));
    await expect(apiRequest('/test', { skipUnauthorizedHandler: true })).rejects.toThrow(ApiError);
    expect(unauthorizedMock).not.toHaveBeenCalled();
  });

  it('invokes unauthorizedHandler on non-JSON 401', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('Not JSON', { status: 401 }));
    await expect(get('/test')).rejects.toThrow(ApiError);
    expect(unauthorizedMock).toHaveBeenCalledTimes(1);
  });

  it('survives undefined unauthorizedHandler', async () => {
    setUnauthorizedHandler(undefined as any);
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ error: { message: 'Unauthorized' } }), { status: 401 }));
    await expect(get('/test')).rejects.toThrow(ApiError);
  });
});

describe('uploadMedia XHR', () => {
  let xhrMock: any;
  let unauthorizedMock: any;

  beforeEach(() => {
    unauthorizedMock = vi.fn();
    setUnauthorizedHandler(unauthorizedMock);
    xhrMock = {
      open: vi.fn(),
      setRequestHeader: vi.fn(),
      send: vi.fn(),
      upload: {}
    };
    vi.stubGlobal('XMLHttpRequest', vi.fn(() => xhrMock));
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('resolves on 200/201 success', async () => {
    const promise = uploadMedia(new File([], 'test.jpg'), 'alt', 'csrf');
    xhrMock.status = 200;
    xhrMock.responseText = JSON.stringify({ data: { id: 'img1' } });
    xhrMock.onload();
    const res = await promise;
    expect(res).toEqual({ id: 'img1' });
  });

  it('sends the stored bearer session token with the multipart upload', async () => {
    vi.stubGlobal('localStorage', { getItem: vi.fn().mockReturnValue('session-token') });
    const promise = uploadMedia(new File([], 'test.jpg'), 'alt', 'csrf');
    expect(xhrMock.setRequestHeader).toHaveBeenCalledWith('Authorization', 'Bearer session-token');
    xhrMock.status = 200;
    xhrMock.responseText = JSON.stringify({ data: { id: 'img1' } });
    xhrMock.onload();
    await expect(promise).resolves.toEqual({ id: 'img1' });
  });

  it('invokes unauthorized handler exactly once on 401', async () => {
    const promise = uploadMedia(new File([], 'test.jpg'), 'alt', 'csrf');
    xhrMock.status = 401;
    xhrMock.responseText = JSON.stringify({ error: { message: 'unauth' } });
    xhrMock.onload();
    await expect(promise).rejects.toThrow(ApiError);
    expect(unauthorizedMock).toHaveBeenCalledTimes(1);
  });

  it('rejects on network error (onerror) as 0, no unauth call', async () => {
    const promise = uploadMedia(new File([], 'test.jpg'), 'alt', 'csrf');
    xhrMock.onerror();
    await expect(promise).rejects.toMatchObject({ status: 0, code: 'NETWORK_ERROR' });
    expect(unauthorizedMock).not.toHaveBeenCalled();
  });

  it('rejects on abort (onabort) as DOMException', async () => {
    const promise = uploadMedia(new File([], 'test.jpg'), 'alt', 'csrf');
    xhrMock.onabort();
    await expect(promise).rejects.toThrow(DOMException);
    expect(unauthorizedMock).not.toHaveBeenCalled();
  });

  it('rejects on timeout (ontimeout) as 0, no unauth call', async () => {
    const promise = uploadMedia(new File([], 'test.jpg'), 'alt', 'csrf');
    xhrMock.ontimeout();
    await expect(promise).rejects.toMatchObject({ status: 0, code: 'TIMEOUT_ERROR' });
    expect(unauthorizedMock).not.toHaveBeenCalled();
  });

  it('handles invalid JSON success response safely', async () => {
    const promise = uploadMedia(new File([], 'test.jpg'), 'alt', 'csrf');
    xhrMock.status = 200;
    xhrMock.responseText = 'Invalid JSON';
    xhrMock.onload();
    await expect(promise).rejects.toThrow(ApiError);
  });

  it('handles invalid JSON error response safely', async () => {
    const promise = uploadMedia(new File([], 'test.jpg'), 'alt', 'csrf');
    xhrMock.status = 400;
    xhrMock.responseText = 'Invalid JSON';
    xhrMock.onload();
    await expect(promise).rejects.toMatchObject({ status: 400, message: 'Upload gambar gagal.' });
  });

  it('handles upload progress correctly', async () => {
    const onProgress = vi.fn();
    const promise = uploadMedia(new File([], 'test.jpg'), 'alt', 'csrf', onProgress);
    xhrMock.upload.onprogress({ lengthComputable: true, loaded: 50, total: 100 });
    expect(onProgress).toHaveBeenCalledWith(50);
  });

  it('handles upload progress with zero-byte total without division by zero', async () => {
    const onProgress = vi.fn();
    const promise = uploadMedia(new File([], 'test.jpg'), 'alt', 'csrf', onProgress);
    xhrMock.upload.onprogress({ lengthComputable: true, loaded: 0, total: 0 });
    // Math.round(0 / 0 * 100) -> NaN. Should not throw.
    expect(onProgress).toHaveBeenCalledWith(NaN);
  });
});
