"use client";

import { useEffect } from "react";
import { TileLayer, useMap } from "react-leaflet";

import { useMapBasemap } from "@/components/maps/map-basemap-context";

/**
 * Entfernt nur das Standard-„Leaflet |“-Präfix. Die Anbieter-Attribution bleibt unverändert.
 */
function SuppressLeafletAttributionPrefix() {
  const map = useMap();
  useEffect(() => {
    map.attributionControl?.setPrefix(false);
  }, [map]);
  return null;
}

/**
 * Stadia raster tiles via same-origin /api/map-tiles. Key never ships to the browser.
 */
export function MerhabaTileLayer() {
  const basemap = useMapBasemap();

  return (
    <>
      <TileLayer attribution={basemap.attribution} url={basemap.tileUrl} />
      <SuppressLeafletAttributionPrefix />
    </>
  );
}
