export const PRODUCT_INSIGHT_EVENT_NAMES = [
  "public_place_view",
  "public_event_view",
  "public_city_browse_view",
  "public_category_browse_view",
  "public_collection_view",
  "public_search_view",
  "search_submit",
  "home_view",
  "feed_view",
  "notifications_view",
  "participating_events_view",
  "guest_signin_cta_click",
  "guest_signup_cta_click",
  "share_click",
  "save_click",
  "city_follow_click",
  "event_participation_click",
] as const;

export type ProductInsightEventName = (typeof PRODUCT_INSIGHT_EVENT_NAMES)[number];

export const CLIENT_PRODUCT_INSIGHT_EVENT_NAMES = [
  "guest_signin_cta_click",
  "guest_signup_cta_click",
  "share_click",
] as const satisfies readonly ProductInsightEventName[];

export type ClientProductInsightEventName =
  (typeof CLIENT_PRODUCT_INSIGHT_EVENT_NAMES)[number];
