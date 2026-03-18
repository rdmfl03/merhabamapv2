"use client";

import { useEffect, useMemo, useRef, type MutableRefObject } from "react";
import mapboxgl, {
  type GeoJSONSource,
  type Map as MapboxMap,
} from "mapbox-gl";

import type { CityMapPoint } from "@/components/cities/city-discovery-map-types";
import { Link } from "@/i18n/navigation";

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
const PLACE_SOURCE_ID = "merhaba-place-points";
const EVENT_SOURCE_ID = "merhaba-event-points";
const USER_SOURCE_ID = "merhaba-user-location";
const PLACE_CLUSTERS_LAYER_ID = "merhaba-place-clusters";
const PLACE_POINTS_LAYER_ID = "merhaba-place-points-layer";
const EVENT_CLUSTERS_LAYER_ID = "merhaba-event-clusters";
const EVENT_POINTS_LAYER_ID = "merhaba-event-points-layer";
const USER_LAYER_ID = "merhaba-user-point";
const PLACE_ICON_ID = "merhaba-place-marker";
const EVENT_ICON_ID = "merhaba-event-marker";
const PLACE_CLUSTER_ICON_ID = "merhaba-place-cluster-marker";
const EVENT_CLUSTER_ICON_ID = "merhaba-event-cluster-marker";
const CLUSTER_RADIUS = 32;
const CLUSTER_MAX_ZOOM = 14;

function showPointPopup(
  map: MapboxMap,
  popupRef: MutableRefObject<mapboxgl.Popup | null>,
  suppressPopupCloseRef: MutableRefObject<boolean>,
  point: CityMapPoint,
  onSelectChange: (id: string | null) => void,
) {
  if (popupRef.current) {
    suppressPopupCloseRef.current = true;
    popupRef.current.remove();
    popupRef.current = null;
  }

  popupRef.current = new mapboxgl.Popup({
    closeButton: true,
    closeOnClick: false,
    anchor: "bottom",
    offset: 26,
    className: "merhaba-mapbox-popup-shell",
  })
    .setLngLat([point.longitude, point.latitude])
    .setDOMContent(buildPopupNode(point))
    .addTo(map);

  popupRef.current.on("close", () => {
    if (suppressPopupCloseRef.current) {
      suppressPopupCloseRef.current = false;
      return;
    }
    onSelectChange(null);
  });
}

function buildPopupNode(
  point: CityMapPoint,
) {
  const metaParts = point.meta
    .split("·")
    .map((part) => part.trim())
    .filter(Boolean);
  const primaryMeta = metaParts[0] ?? point.meta;
  const secondaryMeta = metaParts.slice(1).join(" · ");

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
  meta.textContent = primaryMeta;

  const description = document.createElement("p");
  description.className = "merhaba-mapbox-popup__description";
  description.textContent = point.description || secondaryMeta || point.meta;

  const detail = document.createElement("p");
  detail.className = "merhaba-mapbox-popup__meta";
  detail.textContent = secondaryMeta;

  root.append(eyebrow, title, meta);

  if (secondaryMeta) {
    root.append(detail);
  }

  root.append(description);

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

function createMarkerSvg(kind: "place" | "event") {
  if (kind === "event") {
    return `
      <svg xmlns="http://www.w3.org/2000/svg" width="46" height="46" viewBox="0 0 46 46">
        <rect x="11" y="11" width="24" height="24" rx="5" transform="rotate(45 23 23)" fill="#111827" stroke="#ffffff" stroke-width="3"/>
        <rect x="18.5" y="18.5" width="9" height="9" rx="2" transform="rotate(45 23 23)" fill="#ffffff"/>
      </svg>
    `;
  }

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="46" height="56" viewBox="0 0 46 56">
      <path d="M23 4C13.6 4 6 11.5 6 20.8c0 12.5 13.8 25.4 16 27.2.6.6 1.6.6 2.2 0C26.2 46.2 40 33.3 40 20.8 40 11.5 32.4 4 23 4Z" fill="#e30a17" stroke="#ffffff" stroke-width="3"/>
      <circle cx="23" cy="21" r="6" fill="#ffffff"/>
      <circle cx="23" cy="21" r="2.4" fill="#e30a17"/>
    </svg>
  `;
}

function createClusterSvg(kind: "place" | "event") {
  if (kind === "event") {
    return `
      <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
        <rect x="14" y="14" width="36" height="36" rx="8" transform="rotate(45 32 32)" fill="#111827" stroke="#ffffff" stroke-width="4"/>
      </svg>
    `;
  }

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="64" height="76" viewBox="0 0 64 76">
      <path d="M32 8C19.3 8 9 18.2 9 30.6c0 16.2 18.5 30.6 21.1 32.6 1.1.9 2.7.9 3.8 0C36.5 61.2 55 46.8 55 30.6 55 18.2 44.7 8 32 8Z" fill="#e30a17" stroke="#ffffff" stroke-width="4"/>
    </svg>
  `;
}

async function addSvgIcon(map: MapboxMap, id: string, svg: string) {
  if (map.hasImage(id)) {
    return;
  }

  const image = new Image();
  const dataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

  await new Promise<void>((resolve, reject) => {
    image.onload = () => {
      map.addImage(id, image, { pixelRatio: 2 });
      resolve();
    };
    image.onerror = () => reject(new Error(`Failed to load ${id}`));
    image.src = dataUrl;
  });
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
  const suppressPopupCloseRef = useRef(false);
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  const placePoints = useMemo(
    () => points.filter((point) => point.kind === "place"),
    [points],
  );
  const eventPoints = useMemo(
    () => points.filter((point) => point.kind === "event"),
    [points],
  );
  const placePointsData = useMemo(() => buildPointsGeoJson(placePoints), [placePoints]);
  const eventPointsData = useMemo(() => buildPointsGeoJson(eventPoints), [eventPoints]);
  const userData = useMemo(() => buildUserGeoJson(userLocation), [userLocation]);
  const selectedPoint = useMemo(
    () => points.find((entry) => entry.id === selectedId) ?? null,
    [points, selectedId],
  );

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
      void Promise.all([
        addSvgIcon(map, PLACE_ICON_ID, createMarkerSvg("place")),
        addSvgIcon(map, EVENT_ICON_ID, createMarkerSvg("event")),
        addSvgIcon(map, PLACE_CLUSTER_ICON_ID, createClusterSvg("place")),
        addSvgIcon(map, EVENT_CLUSTER_ICON_ID, createClusterSvg("event")),
      ]).then(() => {
        map.addSource(PLACE_SOURCE_ID, {
        type: "geojson",
        data: placePointsData,
        cluster: true,
        clusterMaxZoom: CLUSTER_MAX_ZOOM,
        clusterRadius: CLUSTER_RADIUS,
        promoteId: "id",
        });

        map.addLayer({
          id: PLACE_CLUSTERS_LAYER_ID,
          type: "symbol",
          source: PLACE_SOURCE_ID,
          filter: ["has", "point_count"],
          layout: {
            "icon-image": PLACE_CLUSTER_ICON_ID,
            "icon-size": [
              "step",
              ["get", "point_count"],
              0.66,
              10,
              0.78,
              25,
              0.9,
            ],
            "icon-anchor": "center",
            "icon-allow-overlap": true,
            "text-field": ["get", "point_count_abbreviated"],
            "text-size": [
              "step",
              ["get", "point_count"],
              11,
              10,
              12,
              25,
              13,
            ],
            "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"],
            "text-anchor": "center",
            "text-offset": [0, -0.15],
            "text-allow-overlap": true,
          },
          paint: {
            "text-color": "#ffffff",
            "text-halo-color": "rgba(227, 10, 23, 0.18)",
            "text-halo-width": 0.8,
          },
        });

        map.addLayer({
          id: PLACE_POINTS_LAYER_ID,
          type: "symbol",
          source: PLACE_SOURCE_ID,
          filter: ["!", ["has", "point_count"]],
          layout: {
            "icon-image": PLACE_ICON_ID,
            "icon-size": 0.76,
            "icon-allow-overlap": true,
            "icon-anchor": "bottom",
          },
        });

        map.addSource(EVENT_SOURCE_ID, {
        type: "geojson",
        data: eventPointsData,
        cluster: true,
        clusterMaxZoom: CLUSTER_MAX_ZOOM,
        clusterRadius: CLUSTER_RADIUS,
        promoteId: "id",
        });

        map.addLayer({
          id: EVENT_CLUSTERS_LAYER_ID,
          type: "symbol",
          source: EVENT_SOURCE_ID,
          filter: ["has", "point_count"],
          layout: {
          "icon-image": EVENT_CLUSTER_ICON_ID,
          "icon-size": [
            "step",
            ["get", "point_count"],
            0.62,
            10,
            0.74,
            25,
            0.86,
          ],
          "icon-allow-overlap": true,
          "text-field": ["get", "point_count_abbreviated"],
          "text-size": [
            "step",
            ["get", "point_count"],
            11,
            10,
            12,
            25,
            13,
          ],
          "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"],
          "text-anchor": "center",
          "text-allow-overlap": true,
          },
          paint: {
          "text-color": "#ffffff",
          "text-halo-color": "rgba(15, 23, 42, 0.18)",
          "text-halo-width": 0.8,
          },
        });

        map.addLayer({
          id: EVENT_POINTS_LAYER_ID,
          type: "symbol",
          source: EVENT_SOURCE_ID,
          filter: ["!", ["has", "point_count"]],
          layout: {
            "icon-image": EVENT_ICON_ID,
            "icon-size": 0.76,
            "icon-allow-overlap": true,
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

        map.on("click", PLACE_CLUSTERS_LAYER_ID, (event) => {
          const feature = event.features?.[0];
          if (!feature) return;

          const clusterId = feature.properties?.cluster_id;
          const source = map.getSource(PLACE_SOURCE_ID) as GeoJSONSource | undefined;
          if (!source || clusterId == null) return;

          const [longitude, latitude] = (feature.geometry as GeoJSON.Point).coordinates;
          source.getClusterExpansionZoom(Number(clusterId), (error, zoom) => {
            if (error || zoom == null) {
              return;
            }

            map.easeTo({
              center: [longitude, latitude],
              zoom: Math.min(Math.max(zoom, 12.8), 14.1),
              duration: 420,
            });
          });
        });

        map.on("click", EVENT_CLUSTERS_LAYER_ID, (event) => {
          const feature = event.features?.[0];
          if (!feature) return;

          const clusterId = feature.properties?.cluster_id;
          const source = map.getSource(EVENT_SOURCE_ID) as GeoJSONSource | undefined;
          if (!source || clusterId == null) return;

          const [longitude, latitude] = (feature.geometry as GeoJSON.Point).coordinates;
          source.getClusterExpansionZoom(Number(clusterId), (error, zoom) => {
            if (error || zoom == null) {
              return;
            }

            map.easeTo({
              center: [longitude, latitude],
              zoom: Math.min(Math.max(zoom, 12.8), 14.1),
              duration: 420,
            });
          });
        });

        for (const layerId of [
          PLACE_CLUSTERS_LAYER_ID,
          EVENT_CLUSTERS_LAYER_ID,
          PLACE_POINTS_LAYER_ID,
          EVENT_POINTS_LAYER_ID,
        ]) {
          map.on("mouseenter", layerId, () => {
            map.getCanvas().style.cursor = "pointer";
          });

          map.on("mouseleave", layerId, () => {
            map.getCanvas().style.cursor = "";
          });
        }

        for (const [layerId, targetPoints] of [
          [PLACE_POINTS_LAYER_ID, placePoints] as const,
          [EVENT_POINTS_LAYER_ID, eventPoints] as const,
        ]) {
          map.on("mousemove", layerId, (event) => {
          const feature = event.features?.[0];
          const featureId = feature?.properties?.id as string | undefined;
          onHoverChange(featureId ?? null);
          });

          map.on("click", layerId, (event) => {
          const feature = event.features?.[0];
          if (!feature) return;

          const featureId = feature.properties?.id as string | undefined;
          const point = targetPoints.find((entry) => entry.id === featureId);
          if (!featureId || !point) return;

          onSelectChange(featureId);
          showPointPopup(
            map,
            popupRef,
            suppressPopupCloseRef,
            point,
            onSelectChange,
          );
          map.flyTo({
            center: [point.longitude, point.latitude],
            zoom: 15.4,
            speed: 1,
            essential: true,
            duration: 700,
            offset: [0, -60],
          });
          });
        }
      });
    });

    mapRef.current = map;

    return () => {
      popupRef.current?.remove();
      popupRef.current = null;
      map.remove();
      mapRef.current = null;
    };
  }, [
    eventPoints,
    eventPointsData,
    myLocationLabel,
    onHoverChange,
    onSelectChange,
    placePoints,
    placePointsData,
    token,
    userData,
  ]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map?.isStyleLoaded()) {
      return;
    }

    applyGermanLabels(map);

    const placeSource = map.getSource(PLACE_SOURCE_ID) as GeoJSONSource | undefined;
    placeSource?.setData(placePointsData);

    const eventSource = map.getSource(EVENT_SOURCE_ID) as GeoJSONSource | undefined;
    eventSource?.setData(eventPointsData);

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
        maxZoom: 14.5,
        duration: 0,
      },
    );
  }, [
    cityCenter,
    eventPointsData,
    placePointsData,
    points,
    selectedId,
    userData,
    userLocation,
  ]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map?.isStyleLoaded()) {
      return;
    }

    for (const point of placePoints) {
      map.setFeatureState(
        { source: PLACE_SOURCE_ID, id: point.id },
        {
          hover: point.id === activeId,
          selected: point.id === selectedId,
        },
      );
    }

    for (const point of eventPoints) {
      map.setFeatureState(
        { source: EVENT_SOURCE_ID, id: point.id },
        {
          hover: point.id === activeId,
          selected: point.id === selectedId,
        },
      );
    }
  }, [activeId, eventPoints, placePoints, selectedId]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map?.isStyleLoaded()) {
      return;
    }

    if (!selectedId) {
      if (popupRef.current) {
        suppressPopupCloseRef.current = true;
        popupRef.current.remove();
        popupRef.current = null;
      }
      return;
    }

    const point = selectedPoint;
    if (!point) {
      return;
    }

    showPointPopup(
      map,
      popupRef,
      suppressPopupCloseRef,
      point,
      onSelectChange,
    );

    map.flyTo({
      center: [point.longitude, point.latitude],
      zoom: 15.4,
      speed: 1,
      essential: true,
      duration: 700,
      offset: [0, -60],
    });

  }, [onSelectChange, selectedPoint, selectedId]);

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
          <span className="relative block h-4 w-4">
            <span className="absolute left-1/2 top-0 h-3.5 w-3.5 -translate-x-1/2 rounded-full bg-brand" />
            <span className="absolute bottom-0 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 rounded-[1px] bg-brand" />
            <span className="absolute left-1/2 top-[5px] h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-white" />
          </span>
          <span>{legendPlaces}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="relative block h-3.5 w-3.5">
            <span className="absolute inset-0 rotate-45 rounded-[3px] bg-foreground" />
            <span className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rotate-45 rounded-[1px] bg-white" />
          </span>
          <span>{legendEvents}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-sky-600" />
          <span>{myLocationLabel}</span>
        </div>
      </div>

      {selectedPoint ? (
        <div className="absolute right-5 top-5 z-10 w-[min(20rem,calc(100%-2.5rem))]">
          <div className="rounded-[1.4rem] border border-border/80 bg-white/96 p-4 shadow-[0_18px_42px_rgba(15,23,42,0.14)] backdrop-blur-sm">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand">
              {selectedPoint.categoryLabel}
            </p>
            <h3 className="mt-1 text-base font-semibold text-foreground">
              {selectedPoint.label}
            </h3>
            <p className="mt-2 text-xs font-semibold text-slate-500">
              {selectedPoint.meta}
            </p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {selectedPoint.description || selectedPoint.meta}
            </p>
            <div className="mt-4">
              <Link
                href={selectedPoint.href}
                className="inline-flex items-center justify-center rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#c40815]"
              >
                {selectedPoint.kind === "place" ? viewPlaceLabel : viewEventLabel}
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
