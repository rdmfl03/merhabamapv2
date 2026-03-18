"use client";

import { useEffect, useMemo, useRef } from "react";
import mapboxgl, {
  type GeoJSONSource,
  type Map as MapboxMap,
} from "mapbox-gl";

import type { CityMapPoint } from "@/components/cities/city-discovery-map-types";

type CityDiscoveryMapboxMapProps = {
  points: CityMapPoint[];
  cityCenter: {
    latitude: number;
    longitude: number;
  } | null;
  activeId: string | null;
  selectedId: string | null;
  onHoverChange: (id: string | null) => void;
  onSelectChange: (id: string | null) => void;
  userLocation: {
    latitude: number;
    longitude: number;
  } | null;
  emptyLabel: string;
  noResultsLabel: string;
  filtered: boolean;
  legendPlaces: string;
  legendEvents: string;
  resultsSummaryUnitLabel: string;
  viewPlaceLabel: string;
  viewEventLabel: string;
  myLocationLabel: string;
};

const DEFAULT_CENTER: [number, number] = [10.4515, 51.1657];
const POINTS_SOURCE_ID = "merhaba-points";
const USER_SOURCE_ID = "merhaba-user-location";
const CLUSTERS_LAYER_ID = "merhaba-clusters";
const CLUSTER_COUNT_LAYER_ID = "merhaba-cluster-count";
const PLACE_LAYER_ID = "merhaba-place-points";
const EVENT_LAYER_ID = "merhaba-event-points";
const USER_LAYER_ID = "merhaba-user-point";
const SMALL_DATASET_CLUSTER_THRESHOLD = 8;

function buildPopupNode(
  point: CityMapPoint,
  viewPlaceLabel: string,
  viewEventLabel: string,
) {
  const root = document.createElement("div");
  root.className = "merhaba-mapbox-popup";

  const eyebrow = document.createElement("p");
  eyebrow.className = "merhaba-mapbox-popup__eyebrow";
  eyebrow.textContent = point.categoryLabel;

  const title = document.createElement("h4");
  title.className = "merhaba-mapbox-popup__title";
  title.textContent = point.label;

  const meta = document.createElement("p");
  meta.className = "merhaba-mapbox-popup__meta";
  meta.textContent = point.meta;

  const description = document.createElement("p");
  description.className = "merhaba-mapbox-popup__description";
  description.textContent = point.description || point.meta;

  const action = document.createElement("a");
  action.href = point.href;
  action.className = "merhaba-mapbox-popup__button";
  action.textContent = point.kind === "place" ? viewPlaceLabel : viewEventLabel;

  root.append(eyebrow, title, meta, description, action);

  return root;
}

function buildPointsGeoJson(points: CityMapPoint[]): GeoJSON.FeatureCollection<GeoJSON.Point> {
  return {
    type: "FeatureCollection",
    features: points.map((point) => ({
      type: "Feature",
      id: point.id,
      properties: {
        id: point.id,
        kind: point.kind,
        label: point.label,
        href: point.href,
        description: point.description,
        categoryLabel: point.categoryLabel,
        meta: point.meta,
      },
      geometry: {
        type: "Point",
        coordinates: [point.longitude, point.latitude],
      },
    })),
  };
}

function buildUserGeoJson(userLocation: {
  latitude: number;
  longitude: number;
} | null): GeoJSON.FeatureCollection<GeoJSON.Point> {
  return {
    type: "FeatureCollection",
    features: userLocation
      ? [
          {
            type: "Feature",
            properties: {},
            geometry: {
              type: "Point",
              coordinates: [userLocation.longitude, userLocation.latitude],
            },
          },
        ]
      : [],
  };
}

function applyGermanLabels(map: MapboxMap) {
  for (const layer of map.getStyle().layers ?? []) {
    if (layer.type !== "symbol") {
      continue;
    }

    try {
      map.setLayoutProperty(layer.id, "text-field", [
        "coalesce",
        ["get", "name_de"],
        ["get", "name"],
      ]);
    } catch {
      // Some symbol layers don't expose a writable text-field; ignore them.
    }
  }
}

function applyNeutralGrayTheme(map: MapboxMap) {
  for (const layer of map.getStyle().layers ?? []) {
    const layerId = layer.id.toLowerCase();

    try {
      if (layer.type === "background") {
        map.setPaintProperty(layer.id, "background-color", "#f5f6f8");
        continue;
      }

      if (layer.type === "fill") {
        if (
          layerId.includes("park") ||
          layerId.includes("landuse") ||
          layerId.includes("landcover") ||
          layerId.includes("grass") ||
          layerId.includes("wood") ||
          layerId.includes("forest") ||
          layerId.includes("scrub")
        ) {
          map.setPaintProperty(layer.id, "fill-color", "#eef1f4");
          map.setPaintProperty(layer.id, "fill-opacity", 0.55);
          continue;
        }

        if (layerId.includes("water")) {
          map.setPaintProperty(layer.id, "fill-color", "#eceff3");
          map.setPaintProperty(layer.id, "fill-opacity", 0.85);
          continue;
        }

        if (
          layerId.includes("building") ||
          layerId.includes("settlement") ||
          layerId.includes("aeroway")
        ) {
          map.setPaintProperty(layer.id, "fill-color", "#f1f3f5");
          map.setPaintProperty(layer.id, "fill-opacity", 0.7);
        }
      }

      if (layer.type === "line") {
        if (layerId.includes("water")) {
          map.setPaintProperty(layer.id, "line-color", "#d5dae1");
          continue;
        }

        if (
          layerId.includes("road") ||
          layerId.includes("street") ||
          layerId.includes("path") ||
          layerId.includes("bridge") ||
          layerId.includes("tunnel")
        ) {
          map.setPaintProperty(layer.id, "line-color", "#d4d8de");
          continue;
        }

        if (layerId.includes("boundary") || layerId.includes("admin")) {
          map.setPaintProperty(layer.id, "line-color", "#c5cbd3");
        }
      }
    } catch {
      // Some style layers have non-writable paint properties; ignore them.
    }
  }
}

export function CityDiscoveryMapboxMap({
  points,
  cityCenter,
  activeId,
  selectedId,
  onHoverChange,
  onSelectChange,
  userLocation,
  emptyLabel,
  noResultsLabel,
  filtered,
  legendPlaces,
  legendEvents,
  resultsSummaryUnitLabel,
  viewPlaceLabel,
  viewEventLabel,
  myLocationLabel,
}: CityDiscoveryMapboxMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapboxMap | null>(null);
  const popupRef = useRef<mapboxgl.Popup | null>(null);
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  const pointsData = useMemo(() => buildPointsGeoJson(points), [points]);
  const userData = useMemo(() => buildUserGeoJson(userLocation), [userLocation]);
  const shouldCluster = points.length > SMALL_DATASET_CLUSTER_THRESHOLD;

  useEffect(() => {
    if (!containerRef.current || !token || mapRef.current) {
      return;
    }

    mapboxgl.accessToken = token;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: DEFAULT_CENTER,
      zoom: 5.6,
      attributionControl: false,
      cooperativeGestures: true,
    });

    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "bottom-right");
    map.addControl(new mapboxgl.AttributionControl({ compact: true }), "bottom-right");

    map.on("style.load", () => {
      applyGermanLabels(map);
      applyNeutralGrayTheme(map);
      map.addSource(POINTS_SOURCE_ID, {
        type: "geojson",
        data: pointsData,
        cluster: shouldCluster,
        clusterMaxZoom: 14,
        clusterRadius: shouldCluster ? 50 : 1,
        promoteId: "id",
      });

      map.addLayer({
        id: CLUSTERS_LAYER_ID,
        type: "circle",
        source: POINTS_SOURCE_ID,
        filter: ["has", "point_count"],
        paint: {
          "circle-color": "#e30a17",
          "circle-radius": [
            "step",
            ["get", "point_count"],
            18,
            10,
            24,
            25,
            30,
          ],
          "circle-stroke-color": "#ffffff",
          "circle-stroke-width": 3,
          "circle-opacity": 0.9,
        },
      });

      map.addLayer({
        id: CLUSTER_COUNT_LAYER_ID,
        type: "symbol",
        source: POINTS_SOURCE_ID,
        filter: ["has", "point_count"],
        layout: {
          "text-field": ["get", "point_count_abbreviated"],
          "text-size": 12,
          "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"],
        },
        paint: {
          "text-color": "#ffffff",
        },
      });

      map.addLayer({
        id: PLACE_LAYER_ID,
        type: "circle",
        source: POINTS_SOURCE_ID,
        filter: ["all", ["!", ["has", "point_count"]], ["==", ["get", "kind"], "place"]],
        paint: {
          "circle-color": "#e30a17",
          "circle-radius": [
            "case",
            ["boolean", ["feature-state", "selected"], false],
            11,
            ["boolean", ["feature-state", "hover"], false],
            9,
            7,
          ],
          "circle-stroke-color": "#ffffff",
          "circle-stroke-width": 3,
          "circle-opacity": 0.95,
        },
      });

      map.addLayer({
        id: EVENT_LAYER_ID,
        type: "circle",
        source: POINTS_SOURCE_ID,
        filter: ["all", ["!", ["has", "point_count"]], ["==", ["get", "kind"], "event"]],
        paint: {
          "circle-color": "#111827",
          "circle-radius": [
            "case",
            ["boolean", ["feature-state", "selected"], false],
            11,
            ["boolean", ["feature-state", "hover"], false],
            9,
            7,
          ],
          "circle-stroke-color": "#ffffff",
          "circle-stroke-width": 3,
          "circle-opacity": 0.95,
        },
      });

      map.addSource(USER_SOURCE_ID, {
        type: "geojson",
        data: userData,
      });

      map.addLayer({
        id: USER_LAYER_ID,
        type: "circle",
        source: USER_SOURCE_ID,
        paint: {
          "circle-color": "#0284c7",
          "circle-radius": 7,
          "circle-stroke-color": "#ffffff",
          "circle-stroke-width": 3,
        },
      });

      if (shouldCluster) {
        map.on("click", CLUSTERS_LAYER_ID, (event) => {
          const feature = event.features?.[0];
          if (!feature) return;

          const clusterId = feature.properties?.cluster_id;
          const source = map.getSource(POINTS_SOURCE_ID) as GeoJSONSource | undefined;
          if (!source || clusterId == null) return;

          const [longitude, latitude] = (feature.geometry as GeoJSON.Point).coordinates;
          source.getClusterExpansionZoom(Number(clusterId), (error, zoom) => {
            if (error || zoom == null) {
              return;
            }

            map.easeTo({
              center: [longitude, latitude],
              zoom: Math.max(zoom, 15),
              duration: 400,
            });
          });
        });
      }

      for (const layerId of [PLACE_LAYER_ID, EVENT_LAYER_ID]) {
        map.on("mouseenter", layerId, () => {
          map.getCanvas().style.cursor = "pointer";
        });

        map.on("mouseleave", layerId, () => {
          map.getCanvas().style.cursor = "";
          onHoverChange(null);
        });

        map.on("mousemove", layerId, (event) => {
          const feature = event.features?.[0];
          const featureId = feature?.properties?.id as string | undefined;
          onHoverChange(featureId ?? null);
        });

        map.on("click", layerId, (event) => {
          const feature = event.features?.[0];
          if (!feature) return;

          const featureId = feature.properties?.id as string | undefined;
          const point = points.find((entry) => entry.id === featureId);
          if (!featureId || !point) return;

          onSelectChange(featureId);
          map.easeTo({
            center: [point.longitude, point.latitude],
            duration: 350,
            offset: [0, -60],
          });
        });
      }
    });

    mapRef.current = map;

    return () => {
      popupRef.current?.remove();
      popupRef.current = null;
      map.remove();
      mapRef.current = null;
    };
  }, [
    myLocationLabel,
    onHoverChange,
    onSelectChange,
    points,
    pointsData,
    shouldCluster,
    token,
    userData,
  ]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map?.isStyleLoaded()) {
      return;
    }

    applyGermanLabels(map);

    const source = map.getSource(POINTS_SOURCE_ID) as GeoJSONSource | undefined;
    source?.setData(pointsData);

    const userSource = map.getSource(USER_SOURCE_ID) as GeoJSONSource | undefined;
    userSource?.setData(userData);

    const bounds: [number, number][] = points.map((point) => [
      point.longitude,
      point.latitude,
    ]);

    if (userLocation) {
      bounds.push([userLocation.longitude, userLocation.latitude]);
    }

    if (selectedId) {
      return;
    }

    if (bounds.length === 0 && cityCenter) {
      map.easeTo({
        center: [cityCenter.longitude, cityCenter.latitude],
        zoom: 11.6,
        duration: 0,
      });
      return;
    }

    if (bounds.length === 0) {
      map.easeTo({ center: DEFAULT_CENTER, zoom: 5.6, duration: 0 });
      return;
    }

    if (bounds.length === 1) {
      map.easeTo({ center: bounds[0], zoom: 13.5, duration: 0 });
      return;
    }

    const longitudes = bounds.map(([lng]) => lng);
    const latitudes = bounds.map(([, lat]) => lat);

    map.fitBounds(
      [
        [Math.min(...longitudes), Math.min(...latitudes)],
        [Math.max(...longitudes), Math.max(...latitudes)],
      ],
      {
        padding: 48,
        maxZoom: shouldCluster ? 13.5 : 15,
        duration: 0,
      },
    );
  }, [cityCenter, points, pointsData, selectedId, shouldCluster, userData, userLocation]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map?.isStyleLoaded()) {
      return;
    }

    for (const point of points) {
      map.setFeatureState(
        { source: POINTS_SOURCE_ID, id: point.id },
        {
          hover: point.id === activeId,
          selected: point.id === selectedId,
        },
      );
    }
  }, [activeId, points, selectedId]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map?.isStyleLoaded()) {
      return;
    }

    popupRef.current?.remove();
    popupRef.current = null;

    if (!selectedId) {
      return;
    }

    const point = points.find((entry) => entry.id === selectedId);
    if (!point) {
      return;
    }

    popupRef.current = new mapboxgl.Popup({
      closeButton: true,
      closeOnClick: false,
      offset: 18,
      className: "merhaba-mapbox-popup-shell",
    })
      .setLngLat([point.longitude, point.latitude])
      .setDOMContent(buildPopupNode(point, viewPlaceLabel, viewEventLabel))
      .addTo(map);

    map.easeTo({
      center: [point.longitude, point.latitude],
      duration: 350,
      offset: [0, -60],
    });

    popupRef.current.on("close", () => {
      onSelectChange(null);
    });
  }, [onSelectChange, points, selectedId, viewEventLabel, viewPlaceLabel]);

  if (!token) {
    return (
    <div className="relative h-[36rem] overflow-hidden rounded-[1.9rem] border border-border/70 bg-[#f3f4f6] lg:h-[42rem]">
      <div className="absolute inset-0 bg-[linear-gradient(180deg,#f8fafc_0%,#f1f5f9_100%)]" />
        <div className="absolute inset-x-6 top-6 rounded-2xl border border-border/80 bg-white/94 px-4 py-3 text-sm text-muted-foreground shadow-sm">
          Mapbox ist vorbereitet, aber `NEXT_PUBLIC_MAPBOX_TOKEN` fehlt noch. Bis der Token gesetzt ist, bleibt die App auf der Leaflet-/OSM-Fallback-Karte.
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-[36rem] overflow-hidden rounded-[1.9rem] border border-border/70 bg-[#f3f4f6] lg:h-[42rem]">
      <div ref={containerRef} className="h-full w-full" />

      {points.length === 0 ? (
        <div className="pointer-events-none absolute inset-x-6 bottom-6 rounded-2xl bg-white/94 px-4 py-3 text-sm text-muted-foreground shadow-sm">
          {filtered ? noResultsLabel : emptyLabel}
        </div>
      ) : null}

      <div className="pointer-events-none absolute left-5 top-5 flex flex-wrap items-center gap-2">
        <span className="rounded-full border border-border/80 bg-white/94 px-3 py-1.5 text-xs font-semibold text-foreground shadow-sm">
          Mapbox
        </span>
        <span className="rounded-full border border-border/80 bg-white/94 px-3 py-1.5 text-xs text-muted-foreground shadow-sm">
          {points.length} {resultsSummaryUnitLabel}
        </span>
      </div>

      <div className="pointer-events-none absolute bottom-5 left-5 flex items-center gap-4 rounded-full border border-border/80 bg-white/94 px-4 py-2 text-xs text-muted-foreground shadow-sm">
        <div className="flex items-center gap-2">
          <span className="relative block h-3.5 w-3.5">
            <span className="absolute inset-x-[1px] top-0 h-3 w-3 rounded-full bg-brand" />
            <span className="absolute bottom-0 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rotate-45 bg-brand" />
          </span>
          <span>{legendPlaces}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rotate-45 rounded-[3px] bg-foreground" />
          <span>{legendEvents}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-sky-600" />
          <span>{myLocationLabel}</span>
        </div>
      </div>
    </div>
  );
}
