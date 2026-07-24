export type PublicEventType = 'umkm_view' | 'product_view' | 'inquiry_started' | 'message_copied' | 'whatsapp_opened';
export type PublicEventSource = 'homepage_featured' | 'homepage_catalog' | 'umkm_detail' | 'product_detail' | 'search_results';
type PublicEvent = { eventType: PublicEventType; source: PublicEventSource; umkmId?: string; productId?: string };

const SESSION_KEY = 'loning_anonymous_session_id';
function anonymousSessionId() {
  try {
    const existing = sessionStorage.getItem(SESSION_KEY);
    if (existing) return existing;
    const created = crypto.randomUUID();
    sessionStorage.setItem(SESSION_KEY, created);
    return created;
  } catch { return crypto.randomUUID(); }
}

export function trackPublicEvent(event: PublicEvent) {
  const baseUrl = import.meta.env.VITE_API_URL?.replace(/\/+$/, '');
  if (!baseUrl) return;
  void fetch(`${baseUrl}/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...event, anonymousSessionId: anonymousSessionId() }),
  }).catch(() => undefined);
}