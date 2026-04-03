export type MapTileProvider = "stadiamaps";

/** Same-origin proxy; server adds Stadia key from STADIA_API_KEY. */
export const STADIA_PROXY_TILE_URL = "/api/map-tiles/{z}/{x}/{y}";

export const STADIA_ATTRIBUTION =
  '&copy; <a href="https://stadiamaps.com/" target="_blank" rel="noopener noreferrer">Stadia Maps</a>';
