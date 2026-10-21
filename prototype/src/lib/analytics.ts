import { readJSON, STORAGE_KEYS, writeJSON } from './storage';

export type AnalyticsEvent =
  | 'product_view'
  | 'search'
  | 'filter_applied'
  | 'wishlist_add'
  | 'add_to_cart'
  | 'checkout_start'
  | 'payment_success'
  | 'payment_failed'
  | 'newsletter_signup';

interface LoggedEvent {
  name: AnalyticsEvent;
  at: string;
  props: Record<string, string | number | boolean>;
}

const LIMIT = 200;

/**
 * Local-only analytics. Events stay in this browser so a real provider can be
 * wired in later behind the same call signature. Nothing is transmitted.
 */
export function track(name: AnalyticsEvent, props: LoggedEvent['props'] = {}): void {
  const log = readJSON<LoggedEvent[]>(STORAGE_KEYS.analytics, []);
  log.push({ name, at: new Date().toISOString(), props });
  writeJSON(STORAGE_KEYS.analytics, log.slice(-LIMIT));
}
