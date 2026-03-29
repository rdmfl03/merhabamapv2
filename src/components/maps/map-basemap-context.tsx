"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";

import {
  MAPTILER_ATTRIBUTION,
  OSM_ATTRIBUTION,
  OSM_TILE_URL,
  PASTEL_PROXY_TILE_URL,
  type MapTileProvider,
} from "@/lib/map-config";

export type MapBasemapValue = {
  /** True when server has MAPTILER_API_KEY; client never sees the key. */
  pastelEnabled: boolean;
  provider: MapTileProvider;
  tileUrl: string;
  attribution: string;
};

const defaultBasemap: MapBasemapValue = {
  pastelEnabled: false,
  provider: "osm",
  tileUrl: OSM_TILE_URL,
  attribution: OSM_ATTRIBUTION,
};

const MapBasemapContext = createContext<MapBasemapValue>(defaultBasemap);

export function MapBasemapProvider({
  pastelEnabled,
  children,
}: {
  pastelEnabled: boolean;
  children: ReactNode;
}) {
  const value = useMemo((): MapBasemapValue => {
    if (!pastelEnabled) {
      return defaultBasemap;
    }

    return {
      pastelEnabled: true,
      provider: "maptiler",
      tileUrl: PASTEL_PROXY_TILE_URL,
      attribution: MAPTILER_ATTRIBUTION,
    };
  }, [pastelEnabled]);

  return <MapBasemapContext.Provider value={value}>{children}</MapBasemapContext.Provider>;
}

export function useMapBasemap() {
  return useContext(MapBasemapContext);
}
