export type MapTileProvider = "maptiler" | "osm";

/** Plain OSM raster tiles (Leaflet fallback). */
export const OSM_TILE_URL = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

export const OSM_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

/** Same-origin proxy; server adds MapTiler key from MAPTILER_API_KEY. */
export const PASTEL_PROXY_TILE_URL = "/api/map-tiles/{z}/{x}/{y}";

export const MAPTILER_ATTRIBUTION = "© MapTiler © OpenStreetMap contributors";
