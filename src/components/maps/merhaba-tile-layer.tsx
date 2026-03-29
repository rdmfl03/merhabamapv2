"use client";

import { useCallback, useRef, useState } from "react";
import { TileLayer } from "react-leaflet";

import {
  MAP_CONFIG,
  OSM_ATTRIBUTION,
  OSM_TILE_URL,
  useMapTiler,
} from "@/lib/map-config";

/**
 * Leaflet basemap: MapTiler when NEXT_PUBLIC_MAPTILER_API_KEY is set, else OSM.
 * On tile load errors with MapTiler, switches once to OSM without crashing.
 */
export function MerhabaTileLayer() {
  const [useOsmFallback, setUseOsmFallback] = useState(false);
  const didFallback = useRef(false);

  const onPrimary = useMapTiler && !useOsmFallback;
  const url = onPrimary ? MAP_CONFIG.tileUrl : OSM_TILE_URL;
  const attribution = onPrimary ? MAP_CONFIG.attribution : OSM_ATTRIBUTION;

  const handleTileError = useCallback(() => {
    if (!useMapTiler || didFallback.current) {
      return;
    }
    didFallback.current = true;
    setUseOsmFallback(true);
  }, []);

  return (
    <TileLayer attribution={attribution} eventHandlers={{ tileerror: handleTileError }} url={url} />
  );
}
