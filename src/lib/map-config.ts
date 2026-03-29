const MAPTILER_KEY = (process.env.NEXT_PUBLIC_MAPTILER_API_KEY ?? "").trim();

export const useMapTiler = Boolean(MAPTILER_KEY);

export type MapTileProvider = "maptiler" | "osm";

/** Plain OSM raster tiles (Leaflet default fallback). */
export const OSM_TILE_URL = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

export const OSM_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

export const MAP_CONFIG = {
  provider: (useMapTiler ? "maptiler" : "osm") as MapTileProvider,
  tileUrl: useMapTiler
    ? `https://api.maptiler.com/maps/pastel/{z}/{x}/{y}.png?key=${encodeURIComponent(MAPTILER_KEY)}`
    : OSM_TILE_URL,
  attribution: useMapTiler
    ? "© MapTiler © OpenStreetMap contributors"
    : OSM_ATTRIBUTION,
} as const;
