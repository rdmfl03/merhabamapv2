/** Recent engagement window for discovery (transparent to users in copy). */
export const DISCOVERY_SIGNAL_WINDOW_DAYS = 10;

/** Max items per discovery list. */
export const DISCOVERY_LIST_LIMIT = 10;

export function discoverySignalsSince(): Date {
  return new Date(Date.now() - DISCOVERY_SIGNAL_WINDOW_DAYS * 24 * 60 * 60 * 1000);
}
