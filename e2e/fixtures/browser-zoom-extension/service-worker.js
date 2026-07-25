chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  (async () => {
    if (!request || !Number.isInteger(request.tabId)) {
      return { ok: false, error: { code: 'INVALID_REQUEST', message: 'tabId must be an integer' } };
    }
    if (request.action === 'setZoom') {
      if (typeof request.factor !== 'number' || !Number.isFinite(request.factor) || request.factor <= 0) {
        return { ok: false, error: { code: 'INVALID_FACTOR', message: 'factor must be a positive finite number' } };
      }
      await chrome.tabs.setZoomSettings(request.tabId, { mode: 'automatic', scope: 'per-tab' });
      await chrome.tabs.setZoom(request.tabId, request.factor);
    } else if (request.action !== 'getZoom') {
      return { ok: false, error: { code: 'UNKNOWN_ACTION', message: 'Unsupported zoom action' } };
    }
    const factor = await chrome.tabs.getZoom(request.tabId);
    return { ok: true, factor };
  })().then(sendResponse).catch(error => sendResponse({ ok: false, error: { code: error?.name ?? 'ZOOM_ERROR', message: error?.message ?? String(error) } }));
  return true;
});
