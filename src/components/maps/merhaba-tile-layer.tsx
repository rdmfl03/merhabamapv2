"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { TileLayer } from "react-leaflet";

import { useMapBasemap } from "@/components/maps/map-basemap-context";
import { OSM_ATTRIBUTION, OSM_TILE_URL } from "@/lib/map-config";

/**
 * MapTiler „Pastel“ via same-origin /api/map-tiles when MAPTILER_API_KEY is set on the server;
 * otherwise OpenStreetMap. Key never ships to the browser.
 */
export function MerhabaTileLayer() {
  const basemap = useMapBasemap();
  const [useOsmFallback, setUseOsmFallback] = useState(false);
  const didFallback = useRef(false);

  const onPrimary = basemap.pastelEnabled && !useOsmFallback;
  const url = onPrimary ? basemap.tileUrl : OSM_TILE_URL;
  const attribution = onPrimary ? basemap.attribution : OSM_ATTRIBUTION;

  const handleTileError = useCallback(() => {
    if (!basemap.pastelEnabled || didFallback.current) {
      return;
    }
    didFallback.current = true;
    setUseOsmFallback(true);
  }, [basemap.pastelEnabled]);

  useEffect(() => {
    setUseOsmFallback(false);
    didFallback.current = false;
  }, [basemap.tileUrl]);

  return (
    <TileLayer attribution={attribution} eventHandlers={{ tileerror: handleTileError }} url={url} />
  );
}
