"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

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

type MapBasemapProviderProps = {
  children: ReactNode;
  /** From server layout when `MAPTILER_API_KEY` is set — avoids an initial OSM flash before `/api/map/basemap` responds. */
  initialPastelEnabled?: boolean;
};

export function MapBasemapProvider({
  children,
  initialPastelEnabled = false,
}: MapBasemapProviderProps) {
  const [pastelEnabled, setPastelEnabled] = useState(initialPastelEnabled);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/map/basemap", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : { pastelEnabled: false }))
      .then((data: { pastelEnabled?: boolean }) => {
        if (!cancelled && typeof data.pastelEnabled === "boolean") {
          setPastelEnabled(data.pastelEnabled);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

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
