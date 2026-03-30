"use client";

import { TileLayer } from "react-leaflet";

import { useMapBasemap } from "@/components/maps/map-basemap-context";
import { OSM_ATTRIBUTION, OSM_TILE_URL } from "@/lib/map-config";

/**
 * MapTiler „Pastel“ via same-origin /api/map-tiles when `MAPTILER_API_KEY` is set;
 * otherwise OpenStreetMap. Key never ships to the browser.
 * No silent fallback to OSM when Pastel is configured — keeps style consistent (fix key/upstream instead).
 */
export function MerhabaTileLayer() {
  const basemap = useMapBasemap();

  const url = basemap.pastelEnabled ? basemap.tileUrl : OSM_TILE_URL;
  const attribution = basemap.pastelEnabled ? basemap.attribution : OSM_ATTRIBUTION;

  return <TileLayer attribution={attribution} url={url} />;
}
