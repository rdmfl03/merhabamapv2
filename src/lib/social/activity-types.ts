/** Feed / activity row types — store only references, no personal data in payload. */
export const ACTIVITY_TYPE = {
  SAVE_PLACE: "SAVE_PLACE",
  NEW_PLACE: "NEW_PLACE",
  NEW_EVENT: "NEW_EVENT",
  COMMENT_PLACE: "COMMENT_PLACE",
  COMMENT_EVENT: "COMMENT_EVENT",
  EVENT_INTERESTED: "EVENT_INTERESTED",
  EVENT_GOING: "EVENT_GOING",
  COLLECTION_CREATED: "COLLECTION_CREATED",
  COLLECTION_PLACE_ADDED: "COLLECTION_PLACE_ADDED",
  CITY_FOLLOWED: "CITY_FOLLOWED",
} as const;

export type ActivityTypeId = (typeof ACTIVITY_TYPE)[keyof typeof ACTIVITY_TYPE];

export const ACTIVITY_ENTITY = {
  place: "place",
  event: "event",
  collection: "collection",
  collection_item: "collection_item",
  city: "city",
} as const;

export type ActivityEntityTypeId = (typeof ACTIVITY_ENTITY)[keyof typeof ACTIVITY_ENTITY];
