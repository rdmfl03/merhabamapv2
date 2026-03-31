"use client";

import { useEffect } from "react";
import { TileLayer, useMap } from "react-leaflet";

import { useMapBasemap } from "@/components/maps/map-basemap-context";
import { OSM_ATTRIBUTION, OSM_TILE_URL } from "@/lib/map-config";

/**
 * Entfernt nur das Standard-„Leaflet |“-Präfix. Kachel-Attribution (OSM / MapTiler) bleibt unverändert.
 */
function SuppressLeafletAttributionPrefix() {
  const map = useMap();
  useEffect(() => {
    map.attributionControl?.setPrefix(false);
  }, [map]);
  return null;
}

/**
 * Stadia raster tiles via same-origin /api/map-tiles when `STADIA_API_KEY` is set;
 * otherwise OpenStreetMap. Key never ships to the browser.
 */
export function MerhabaTileLayer() {
  const basemap = useMapBasemap();

  const url = basemap.hostedBasemapEnabled ? basemap.tileUrl : OSM_TILE_URL;
  const attribution = basemap.hostedBasemapEnabled ? basemap.attribution : OSM_ATTRIBUTION;

  return (
    <>
      <TileLayer attribution={attribution} url={url} />
      <SuppressLeafletAttributionPrefix />
    </>
  );
}
