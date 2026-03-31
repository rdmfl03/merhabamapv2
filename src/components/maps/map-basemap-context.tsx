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
  OSM_ATTRIBUTION,
  OSM_TILE_URL,
  STADIA_ATTRIBUTION,
  STADIA_PROXY_TILE_URL,
  type MapTileProvider,
} from "@/lib/map-config";

export type MapBasemapValue = {
  /** True when server has STADIA_API_KEY; client never sees the key. */
  hostedBasemapEnabled: boolean;
  provider: MapTileProvider;
  tileUrl: string;
  attribution: string;
};

const defaultBasemap: MapBasemapValue = {
  hostedBasemapEnabled: false,
  provider: "osm",
  tileUrl: OSM_TILE_URL,
  attribution: OSM_ATTRIBUTION,
};

const MapBasemapContext = createContext<MapBasemapValue>(defaultBasemap);

type MapBasemapProviderProps = {
  children: ReactNode;
  /** From server layout when `STADIA_API_KEY` is set — avoids an initial OSM flash before `/api/map/basemap` responds. */
  initialHostedBasemapEnabled?: boolean;
};

export function MapBasemapProvider({
  children,
  initialHostedBasemapEnabled = false,
}: MapBasemapProviderProps) {
  const [hostedBasemapEnabled, setHostedBasemapEnabled] = useState(initialHostedBasemapEnabled);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/map/basemap", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : { basemapEnabled: false }))
      .then((data: { basemapEnabled?: boolean }) => {
        if (!cancelled && typeof data.basemapEnabled === "boolean") {
          setHostedBasemapEnabled(data.basemapEnabled);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo((): MapBasemapValue => {
    if (!hostedBasemapEnabled) {
      return defaultBasemap;
    }

    return {
      hostedBasemapEnabled: true,
      provider: "stadiamaps",
      tileUrl: STADIA_PROXY_TILE_URL,
      attribution: STADIA_ATTRIBUTION,
    };
  }, [hostedBasemapEnabled]);

  return <MapBasemapContext.Provider value={value}>{children}</MapBasemapContext.Provider>;
}

export function useMapBasemap() {
  return useContext(MapBasemapContext);
}
