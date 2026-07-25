import type { Worker } from '@playwright/test';

export async function getApplicationTabForPage(worker: Worker, pageUrl: string, expectedOrigin: string) {
  const tab = await worker.evaluate(async ({ targetUrl, origin }) => {
    const tabs = await chrome.tabs.query({ currentWindow: true });
    const candidates = tabs.filter(tab => typeof tab.id === 'number' && (tab.url ?? '').startsWith(origin));
    const exact = candidates.find(candidate => candidate.url === targetUrl) ?? candidates.find(candidate => candidate.active);
    if (!exact || typeof exact.id !== 'number') throw new Error(`No application tab matched ${targetUrl}`);
    return { id: exact.id, url: exact.url ?? null };
  }, { targetUrl: pageUrl, origin: expectedOrigin });
  if (!tab.url?.startsWith(expectedOrigin)) throw new Error(`Application tab does not match origin: ${tab.url ?? 'unknown'}`);
  return tab;
}

export async function getActiveApplicationTab(worker: Worker, expectedOrigin: string) {
  const tab = await worker.evaluate(async () => {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tabs.length !== 1 || typeof tabs[0].id !== 'number') {
      throw new Error(`Expected one active tab with an ID; received ${tabs.length}`);
    }
    return { id: tabs[0].id, url: tabs[0].url ?? null };
  });
  if (!tab.url?.startsWith(expectedOrigin)) {
    throw new Error(`Active tab does not match application origin: ${tab.url ?? 'unknown'}`);
  }
  return tab;
}

export async function applyNativeZoom(worker: Worker, tabId: number, factor: number) {
  if (!Number.isFinite(factor) || factor <= 0) throw new Error('Native zoom factor must be positive and finite');
  return worker.evaluate(async ({ id, zoom }) => {
    await chrome.tabs.setZoomSettings(id, { mode: 'automatic', scope: 'per-tab' });
    await chrome.tabs.setZoom(id, zoom);
    return chrome.tabs.getZoom(id);
  }, { id: tabId, zoom: factor });
}

export async function readNativeZoom(worker: Worker, tabId: number) {
  return worker.evaluate(id => chrome.tabs.getZoom(id), tabId);
}

export function expectZoom(actual: number, expected: number) {
  if (Math.abs(actual - expected) >= 0.005) throw new Error(`Expected native tab zoom ${expected}, received ${actual}`);
}

