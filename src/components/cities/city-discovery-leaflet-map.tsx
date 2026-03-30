"use client";

import { useEffect, useMemo, useState } from "react";
import { Star } from "lucide-react";
import L, {
  type DivIcon,
  type LatLngBoundsExpression,
  type LatLngExpression,
  type LeafletMouseEvent,
} from "leaflet";
import { useLeafletContext } from "@react-leaflet/core";
import {
  MapContainer,
  Marker,
  Popup,
  ZoomControl,
  useMap,
} from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";

import { useMapBasemap } from "@/components/maps/map-basemap-context";
import { MerhabaTileLayer } from "@/components/maps/merhaba-tile-layer";
import { Link } from "@/i18n/navigation";
import type { CityMapPoint, MapViewportBounds } from "@/components/cities/city-discovery-map-types";
import {
  CITY_DISCOVERY_MAP_MIN_ZOOM,
  maxBoundsFromCenterRadiusKm,
} from "@/lib/cities/city-map-max-bounds";

export type GermanyCityClusterMarker = {
  slug: string;
  label: string;
  latitude: number;
  longitude: number;
  placeCount: number;
  eventCount: number;
};

type CityDiscoveryLeafletMapProps = {
  points: CityMapPoint[];
  cityCenter: {
    latitude: number;
    longitude: number;
  } | null;
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
  placePopupRatingCaption: string;
  viewEventLabel: string;
  myLocationLabel: string;
  onViewportBoundsChange?: (bounds: MapViewportBounds) => void;
  /** When set with empty `points`, map fits these and shows one marker per city (Germany overview). */
  germanyCityClusters?: GermanyCityClusterMarker[];
  onGermanyCityClusterClick?: (slug: string) => void;
  /** Bump to re-fit bounds (e.g. return from city drill-in). */
  mapLayoutEpoch?: number;
  clusterLoadingSlug?: string | null;
  clusterLoadingLabel?: string;
  resultsCitiesUnitLabel?: string;
  germanyClusterRevealLabel?: string;
  /** Wenn gesetzt (Stadt-Ansicht): Pan/Zoom auf Kreis um cityCenter begrenzt (km). Deutschland-Cluster: weglassen. */
  restrictToCityRadiusKm?: number | null;
};

const DEFAULT_CENTER: LatLngExpression = [51.1657, 10.4515];

/**
 * Pan- und Zoom-Rahmen: Deutschland mit moderatem Rand zu Nachbarregionen.
 * Verhindert Herauszoomen bis Weltkarte/Nordpol; Produktfokus bleibt D-A-CH + Mitteleuropa-Kern.
 */
const DISCOVERY_MAP_MAX_BOUNDS: LatLngBoundsExpression = [
  [45.35, 4.95],
  [55.5, 17.1],
];

/** Unterhalb dieses Zooms wird die Karte zu weit (z. B. ganze Nordhalbkugel). */
const DISCOVERY_MAP_MIN_ZOOM = 5;

/**
 * Unspiderfy nur bei Klick auf die Basemap, nicht auf Pins/Lines/UI.
 * Nicht nur `.leaflet-tile` prüfen: Klicks treffen oft den Tile-Container oder Lücken zwischen Kacheln
 * (Geschwister-Struktur → kein `closest` zur Kachel). Dafür reicht `.leaflet-tile-pane`.
 * Klicks auf halbtransparente Icons können bis zur Kachel durchgehen — Marker-Pane/Overlay ausschließen.
 */
function spiderfyMapClickIsBasemapBackground(e?: LeafletMouseEvent): boolean {
  const t = e?.originalEvent?.target;
  if (!(t instanceof Element)) return false;
  if (t.closest(".leaflet-control-container")) return false;
  if (t.closest(".leaflet-popup-pane")) return false;
  if (t.closest(".leaflet-tooltip-pane")) return false;
  if (t.closest(".leaflet-overlay-pane")) return false;
  if (t.closest(".leaflet-marker-pane .leaflet-marker-icon, .leaflet-marker-pane .leaflet-div-icon")) {
    return false;
  }
  return Boolean(t.closest(".leaflet-tile-pane"));
}

type MarkerClusterGroupLayer = L.Layer & {
  _unspiderfyWrapper?: (ev?: LeafletMouseEvent) => void;
  __merhabaSpiderfyClickGuard?: boolean;
};

function patchSpiderfyUnspiderfyWrapper(layer: MarkerClusterGroupLayer, map: L.Map) {
  if (layer.__merhabaSpiderfyClickGuard) return;
  const previous = layer._unspiderfyWrapper;
  if (typeof previous !== "function") return;
  map.off("click", previous, layer);
  const runOriginal = previous.bind(layer);
  const guarded = function (this: MarkerClusterGroupLayer, ev?: LeafletMouseEvent) {
    if (!spiderfyMapClickIsBasemapBackground(ev)) return;
    runOriginal();
  };
  layer._unspiderfyWrapper = guarded;
  map.on("click", guarded, layer);
  layer.__merhabaSpiderfyClickGuard = true;
}

/**
 * leaflet.markercluster: `map.on("click", _unspiderfyWrapper)` schließt Spiderfy — auch wenn der Klick von einem Pin
 * stammt. Wir patchen jede Gruppe mit `_unspiderfyWrapper` (Duck-Typing, robust bei mehreren Plugin-Kopien).
 */
function SpiderfyMapClickGuard() {
  const map = useMap();
  useEffect(() => {
    const patchAll = () => {
      map.eachLayer((layer) => {
        const candidate = layer as MarkerClusterGroupLayer;
        if (typeof candidate._unspiderfyWrapper !== "function") return;
        patchSpiderfyUnspiderfyWrapper(candidate, map);
      });
    };
    patchAll();
    const onLayerAdd = () => queueMicrotask(patchAll);
    map.on("layeradd", onLayerAdd);
    return () => {
      map.off("layeradd", onLayerAdd);
    };
  }, [map]);
  return null;
}

type MarkerClusterClickEvent = L.LeafletMouseEvent & { layer: L.Marker };

/**
 * Zweiter Klick auf denselben Cluster (Mitte) soll Spiderfy schließen.
 * `_zoomOrSpiderfy` ruft sonst nur `spiderfy()` auf, das bei bereits offenem Zustand sofort return’t.
 * Handler nach Plugin-Registrierung (useEffect), damit er nach `_zoomOrSpiderfy` läuft.
 */
function ClusterReclickUnspiderfy() {
  const { layerContainer } = useLeafletContext();
  useEffect(() => {
    const group = layerContainer as L.Layer & {
      _spiderfied?: L.Marker | null;
      unspiderfy?: () => void;
      on(type: string, fn: (e: MarkerClusterClickEvent) => void): void;
      off(type: string, fn: (e: MarkerClusterClickEvent) => void): void;
    };
    if (!group?.on || typeof group.unspiderfy !== "function") return;
    const handler = (e: MarkerClusterClickEvent) => {
      if (group._spiderfied === e.layer) {
        group.unspiderfy!();
      }
    };
    group.on("clusterclick", handler);
    return () => {
      group.off("clusterclick", handler);
    };
  }, [layerContainer]);
  return null;
}

/** Zusätzlich: Leaflet bricht `_fireDOMEvent`-Schleife bei `originalEvent._stopped` ab. */
function stopPinClickFromClosingSpiderfy(e: LeafletMouseEvent) {
  L.DomEvent.stopPropagation(e);
}

function mapPopupDescriptionLine(point: CityMapPoint): string | null {
  const desc = point.description.trim();
  return desc || null;
}

function MapEntityPopup({
  point,
  ctaLabel,
  placeRatingCaption,
}: {
  point: CityMapPoint;
  ctaLabel: string;
  placeRatingCaption?: string;
}) {
  const descriptionLine = mapPopupDescriptionLine(point);

  if (point.kind === "place") {
    const addressLine = point.mapAddressLine?.trim() || point.meta;
    const ratingAria = placeRatingCaption?.trim()
      ? `${placeRatingCaption}: ${point.mapRatingLabel ?? ""}`
      : (point.mapRatingLabel ?? undefined);
    return (
      <Popup>
        <div className="space-y-1.5 min-w-[12rem]">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#e30a17]">
            {point.categoryLabel}
          </p>
          <h4 className="text-sm font-semibold text-slate-900">{point.label}</h4>
          <p className="text-xs font-medium text-slate-500">{addressLine}</p>
          {point.mapRatingLabel ? (
            <p
              className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs text-slate-800"
              aria-label={ratingAria}
            >
              <Star
                className="h-3.5 w-3.5 shrink-0 fill-amber-500 text-amber-500"
                aria-hidden
              />
              {placeRatingCaption ? (
                <span className="font-medium text-slate-600">{placeRatingCaption}</span>
              ) : null}
              <span className="font-semibold tabular-nums text-slate-900">{point.mapRatingLabel}</span>
            </p>
          ) : null}
          {descriptionLine ? (
            <p className="text-xs leading-5 text-slate-600">{descriptionLine}</p>
          ) : null}
          <Link
            href={point.href}
            className="inline-block rounded-full bg-[#e30a17] px-3 py-1.5 text-xs font-semibold"
            style={{ color: "#ffffff", textDecoration: "none" }}
          >
            {ctaLabel}
          </Link>
        </div>
      </Popup>
    );
  }

  return (
    <Popup>
      <div className="space-y-1.5 min-w-[12rem]">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#e30a17]">
          {point.categoryLabel}
        </p>
        <h4 className="text-sm font-semibold text-slate-900">{point.label}</h4>
        <p className="text-xs font-medium text-slate-500">{point.meta}</p>
        {descriptionLine ? (
          <p className="text-xs leading-5 text-slate-600">{descriptionLine}</p>
        ) : null}
        <Link
          href={point.href}
          className="inline-block rounded-full bg-[#e30a17] px-3 py-1.5 text-xs font-semibold"
          style={{ color: "#ffffff", textDecoration: "none" }}
        >
          {ctaLabel}
        </Link>
      </div>
    </Popup>
  );
}

/** Stable identity for marker geometry; parent passes a new `points` array every render. */
function fingerprintMapPoints(points: CityMapPoint[]): string {
  if (points.length === 0) {
    return "";
  }
  return points
    .map((p) => `${p.id}:${p.latitude},${p.longitude}`)
    .sort()
    .join("|");
}

function createMarkerIcon(kind: "place" | "event", active: boolean): DivIcon {
  if (kind === "event") {
    const size = active ? 32 : 28;
    return L.divIcon({
      className: "",
      html: `<span style="
        display:flex;
        align-items:center;
        justify-content:center;
        width:${size}px;
        height:${size}px;
        filter:drop-shadow(0 10px 24px rgba(17,24,39,0.18));
      ">
        <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 46 46" fill="none">
          <rect x="11" y="11" width="24" height="24" rx="5" transform="rotate(45 23 23)" fill="#111827" stroke="#ffffff" stroke-width="3"/>
          <rect x="18.5" y="18.5" width="9" height="9" rx="2" transform="rotate(45 23 23)" fill="#ffffff"/>
        </svg>
      </span>`,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
    });
  }

  const width = active ? 28 : 24;
  const height = active ? 34 : 30;
  return L.divIcon({
    className: "",
    html: `<span style="
      display:block;
      width:${width}px;
      height:${height}px;
      filter:drop-shadow(0 10px 22px rgba(227,10,23,0.22));
    ">
      <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 46 56" fill="none">
        <path d="M23 4C13.6 4 6 11.5 6 20.8c0 12.5 13.8 25.4 16 27.2.6.6 1.6.6 2.2 0C26.2 46.2 40 33.3 40 20.8 40 11.5 32.4 4 23 4Z" fill="#e30a17" stroke="#ffffff" stroke-width="3"/>
        <circle cx="23" cy="21" r="6" fill="#ffffff"/>
        <circle cx="23" cy="21" r="2.4" fill="#e30a17"/>
      </svg>
    </span>`,
    iconSize: [width, height],
    iconAnchor: [width / 2, height],
  });
}

function createClusterIcon(kind: "place" | "event", count: number): DivIcon {
  if (kind === "event") {
    return L.divIcon({
      className: "",
      html: `<span style="
        display:flex;
        align-items:center;
        justify-content:center;
        width:44px;
        height:44px;
        filter:drop-shadow(0 10px 24px rgba(17,24,39,0.18));
      ">
        <svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 44 44" fill="none">
          <rect x="8" y="8" width="28" height="28" rx="6" transform="rotate(45 22 22)" fill="#111827" stroke="#ffffff" stroke-width="3"/>
          <text x="22" y="27" text-anchor="middle" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" font-size="16" font-weight="700" fill="#ffffff">${count}</text>
        </svg>
      </span>`,
      iconSize: [44, 44],
      iconAnchor: [22, 22],
    });
  }

  return L.divIcon({
    className: "",
    html: `<span style="
      display:block;
      width:46px;
      height:56px;
      filter:drop-shadow(0 10px 24px rgba(227,10,23,0.24));
    ">
      <svg xmlns="http://www.w3.org/2000/svg" width="46" height="56" viewBox="0 0 46 56" fill="none">
        <path d="M23 4C13.6 4 6 11.5 6 20.8c0 12.5 13.8 25.4 16 27.2.6.6 1.6.6 2.2 0C26.2 46.2 40 33.3 40 20.8 40 11.5 32.4 4 23 4Z" fill="#e30a17" stroke="#ffffff" stroke-width="3"/>
        <text x="23" y="26" text-anchor="middle" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" font-size="15" font-weight="700" fill="#ffffff">${count}</text>
      </svg>
    </span>`,
    iconSize: [46, 56],
    iconAnchor: [23, 56],
  });
}

function createGermanyCityClusterIcon(cluster: GermanyCityClusterMarker): DivIcon {
  const w = 120;
  const h = 52;
  const safeName = cluster.label
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/"/g, "&quot;");
  return L.divIcon({
    className: "",
    html: `<div style="
      min-width:${w}px;
      max-width:200px;
      padding:8px 12px;
      border-radius:999px;
      background:#ffffff;
      border:2px solid #e30a17;
      box-shadow:0 12px 28px rgba(17,24,39,0.14);
      font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
      text-align:center;
      cursor:pointer;
    ">
      <div style="font-size:11px;font-weight:700;letter-spacing:0.06em;color:#e30a17;text-transform:uppercase;">${safeName}</div>
      <div style="margin-top:4px;font-size:12px;font-weight:600;color:#111827;">
        <span style="color:#e30a17">${cluster.placeCount}</span>
        <span style="color:#64748b;font-weight:500;margin:0 4px">·</span>
        <span style="color:#111827">${cluster.eventCount}</span>
      </div>
    </div>`,
    iconSize: [w, h],
    iconAnchor: [w / 2, h / 2],
  });
}

const userLocationIcon = L.divIcon({
  className: "",
  html: `<span style="
    display:block;
    width:16px;
    height:16px;
    background:#0284c7;
    border:2px solid #ffffff;
    border-radius:999px;
    box-shadow:0 0 0 7px rgba(2,132,199,0.16);
  "></span>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

function FitToMarkers({
  points,
  cityCenter,
  userLocation,
  germanyCityClusters,
  mapLayoutEpoch,
  mapMinZoom,
}: {
  points: CityMapPoint[];
  cityCenter: { latitude: number; longitude: number } | null;
  userLocation: { latitude: number; longitude: number } | null;
  germanyCityClusters?: GermanyCityClusterMarker[];
  mapLayoutEpoch?: number;
  /** Mindest-Zoom der Karte (fitBounds maxZoom bei 0 Pins darf nicht darunter liegen). */
  mapMinZoom: number;
}) {
  const map = useMap();

  const pointsFingerprint = useMemo(() => fingerprintMapPoints(points), [points]);
  const cityCenterKey = cityCenter
    ? `${cityCenter.latitude},${cityCenter.longitude}`
    : "";
  const userLocationKey = userLocation
    ? `${userLocation.latitude},${userLocation.longitude}`
    : "";
  const clusterFingerprint = useMemo(() => {
    if (!germanyCityClusters?.length) {
      return "";
    }
    return germanyCityClusters
      .map((c) => `${c.slug}:${c.latitude},${c.longitude}`)
      .sort()
      .join("|");
  }, [germanyCityClusters]);

  /* eslint-disable react-hooks/exhaustive-deps -- fingerprints stabilize points/cityCenter/userLocation */
  const bounds = useMemo<LatLngBoundsExpression | null>(() => {
    const coords = points.map(
      (point) => [point.latitude, point.longitude] as [number, number],
    );

    if (userLocation) {
      coords.push([userLocation.latitude, userLocation.longitude]);
    }

    if (coords.length === 0 && germanyCityClusters?.length) {
      return germanyCityClusters.map(
        (c) => [c.latitude, c.longitude] as [number, number],
      );
    }

    if (coords.length === 0 && cityCenter) {
      const { latitude, longitude } = cityCenter;
      return [
        [latitude - 0.035, longitude - 0.05],
        [latitude + 0.035, longitude + 0.05],
      ];
    }

    if (coords.length === 0) {
      return null;
    }

    if (coords.length === 1) {
      const [lat, lng] = coords[0];
      return [
        [lat - 0.02, lng - 0.02],
        [lat + 0.02, lng + 0.02],
      ];
    }

    return coords;
  }, [pointsFingerprint, cityCenterKey, userLocationKey, clusterFingerprint, mapLayoutEpoch]);
  /* eslint-enable react-hooks/exhaustive-deps */

  useEffect(() => {
    if (!bounds) {
      map.setView(DEFAULT_CENTER, 6, { animate: false });
      return;
    }

    const fitMaxZoomWhenNoPins = germanyCityClusters?.length
      ? 8
      : Math.max(8, mapMinZoom);

    map.fitBounds(bounds, {
      padding: [40, 40],
      maxZoom: points.length > 0 ? 14 : fitMaxZoomWhenNoPins,
      animate: false,
    });
  }, [bounds, map, points.length, germanyCityClusters?.length, mapMinZoom]);

  return null;
}

function PanToSelected({
  points,
  selectedId,
}: {
  points: CityMapPoint[];
  selectedId: string | null;
}) {
  const map = useMap();

  const pointsFingerprint = useMemo(() => fingerprintMapPoints(points), [points]);
  const activeTarget = useMemo(() => {
    if (!selectedId) {
      return null;
    }
    const point = points.find((entry) => entry.id === selectedId);
    if (!point) {
      return null;
    }
    return `${point.latitude},${point.longitude}`;
  }, [selectedId, pointsFingerprint]); // eslint-disable-line react-hooks/exhaustive-deps -- `points` read when fingerprint changes

  useEffect(() => {
    if (!activeTarget) {
      return;
    }

    const [lat, lng] = activeTarget.split(",").map(Number);
    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      return;
    }

    map.panTo([lat, lng], {
      animate: true,
      duration: 0.35,
    });
  }, [activeTarget, map]);

  return null;
}

function PanToUserLocation({
  userLocation,
}: {
  userLocation: { latitude: number; longitude: number } | null;
}) {
  const map = useMap();

  useEffect(() => {
    if (!userLocation) {
      return;
    }

    map.flyTo([userLocation.latitude, userLocation.longitude], Math.max(map.getZoom(), 13), {
      animate: true,
      duration: 0.5,
    });
  }, [map, userLocation]);

  return null;
}

function SyncMapViewConstraints({
  maxBounds,
  minZoom,
}: {
  maxBounds: LatLngBoundsExpression;
  minZoom: number;
}) {
  const map = useMap();
  useEffect(() => {
    map.setMaxBounds(maxBounds);
    map.setMinZoom(minZoom);
    if (map.getZoom() < minZoom) {
      map.setZoom(minZoom);
    }
  }, [map, maxBounds, minZoom]);
  return null;
}

function ViewportBoundsReporter({
  onBoundsChange,
}: {
  onBoundsChange?: (bounds: MapViewportBounds) => void;
}) {
  const map = useMap();

  useEffect(() => {
    if (!onBoundsChange) {
      return;
    }

    let cancelled = false;

    const report = () => {
      const b = map.getBounds();
      const next: MapViewportBounds = {
        south: b.getSouth(),
        west: b.getWest(),
        north: b.getNorth(),
        east: b.getEast(),
      };
      // Defer: Leaflet can fire moveend synchronously during a sibling's fitBounds effect.
      queueMicrotask(() => {
        if (!cancelled) {
          onBoundsChange(next);
        }
      });
    };

    report();
    map.on("moveend", report);
    map.on("zoomend", report);
    return () => {
      cancelled = true;
      map.off("moveend", report);
      map.off("zoomend", report);
    };
  }, [map, onBoundsChange]);

  return null;
}

export function CityDiscoveryLeafletMap({
  points,
  cityCenter,
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
  placePopupRatingCaption,
  viewEventLabel,
  myLocationLabel,
  onViewportBoundsChange,
  germanyCityClusters,
  onGermanyCityClusterClick,
  mapLayoutEpoch = 0,
  clusterLoadingSlug,
  clusterLoadingLabel,
  resultsCitiesUnitLabel,
  germanyClusterRevealLabel,
  restrictToCityRadiusKm = null,
}: CityDiscoveryLeafletMapProps) {
  const basemap = useMapBasemap();
  /**
   * Erst nach useEffect mounten: vermeidet unter React Strict Mode (Next.js dev) doppelte
   * Leaflet-Initialisierung auf demselben Container („Map container is already initialized“),
   * die oft als zwei Next-Issues / Console-Errors auftaucht.
   */
  const [isMapReady, setIsMapReady] = useState(false);
  useEffect(() => {
    setIsMapReady(true);
  }, []);

  /**
   * Stabile DivIcon-Referenzen: sonst erzeugt jedes Re-Render (z. B. Listen-Hover) neue Icons,
   * react-leaflet aktualisiert alle Marker → MarkerCluster bricht Spiderfy ab (Pins nicht klickbar).
   * Nur `selectedId` vergrößert das Icon, nicht Hover — Hover allein soll die Cluster-Geometrie nicht invalidieren.
   */
  const markerIcons = useMemo(() => {
    const m = new Map<string, DivIcon>();
    for (const p of points) {
      m.set(p.id, createMarkerIcon(p.kind, selectedId === p.id));
    }
    return m;
  }, [points, selectedId]);

  const placePoints = points.filter((point) => point.kind === "place");
  const eventPoints = points.filter((point) => point.kind === "event");
  const shouldClusterPlaces = placePoints.length > 1;
  const shouldClusterEvents = eventPoints.length > 1;

  const showGermanyClusters =
    points.length === 0 &&
    Boolean(germanyCityClusters?.length) &&
    Boolean(onGermanyCityClusterClick);

  const effectiveMaxBounds = useMemo<LatLngBoundsExpression>(() => {
    if (showGermanyClusters) {
      return DISCOVERY_MAP_MAX_BOUNDS;
    }
    if (
      restrictToCityRadiusKm != null &&
      restrictToCityRadiusKm > 0 &&
      cityCenter &&
      Number.isFinite(cityCenter.latitude) &&
      Number.isFinite(cityCenter.longitude)
    ) {
      return maxBoundsFromCenterRadiusKm(
        cityCenter.latitude,
        cityCenter.longitude,
        restrictToCityRadiusKm,
      );
    }
    return DISCOVERY_MAP_MAX_BOUNDS;
  }, [showGermanyClusters, restrictToCityRadiusKm, cityCenter]);

  const effectiveMinZoom = useMemo(() => {
    if (showGermanyClusters) {
      return DISCOVERY_MAP_MIN_ZOOM;
    }
    if (
      restrictToCityRadiusKm != null &&
      restrictToCityRadiusKm > 0 &&
      cityCenter &&
      Number.isFinite(cityCenter.latitude) &&
      Number.isFinite(cityCenter.longitude)
    ) {
      return CITY_DISCOVERY_MAP_MIN_ZOOM;
    }
    return DISCOVERY_MAP_MIN_ZOOM;
  }, [showGermanyClusters, restrictToCityRadiusKm, cityCenter]);

  const frameClassName =
    "relative isolate z-0 h-[36rem] overflow-hidden rounded-[1.9rem] border border-border/70 bg-[#f5f6f8] lg:h-[42rem]";

  if (!isMapReady) {
    return (
      <div className={frameClassName}>
        <div className="h-full w-full animate-pulse bg-muted/60" aria-hidden />
      </div>
    );
  }

  return (
    <div className={frameClassName}>
      <MapContainer
        center={DEFAULT_CENTER}
        zoom={6}
        minZoom={effectiveMinZoom}
        maxBounds={effectiveMaxBounds}
        maxBoundsViscosity={1}
        zoomControl={false}
        className="relative z-0 h-full w-full"
      >
        <MerhabaTileLayer />
        <SpiderfyMapClickGuard />
        <ZoomControl position="bottomright" />
        <SyncMapViewConstraints maxBounds={effectiveMaxBounds} minZoom={effectiveMinZoom} />
        <FitToMarkers
          points={points}
          cityCenter={cityCenter}
          userLocation={userLocation}
          germanyCityClusters={showGermanyClusters ? germanyCityClusters : undefined}
          mapLayoutEpoch={mapLayoutEpoch}
          mapMinZoom={effectiveMinZoom}
        />
        <ViewportBoundsReporter onBoundsChange={onViewportBoundsChange} />
        <PanToSelected points={points} selectedId={selectedId} />
        <PanToUserLocation userLocation={userLocation} />

        {showGermanyClusters && germanyCityClusters
          ? germanyCityClusters.map((cluster) => (
              <Marker
                key={`cluster-${cluster.slug}`}
                position={[cluster.latitude, cluster.longitude]}
                icon={createGermanyCityClusterIcon(cluster)}
              >
                <Popup>
                  <div className="min-w-[10rem] space-y-2 text-slate-900">
                    <p className="text-sm font-semibold">{cluster.label}</p>
                    <p className="text-xs text-slate-600">
                      {cluster.placeCount} {legendPlaces} · {cluster.eventCount} {legendEvents}
                    </p>
                    <button
                      type="button"
                      className="w-full rounded-full bg-[#e30a17] px-3 py-1.5 text-xs font-semibold text-white"
                      onClick={() => onGermanyCityClusterClick?.(cluster.slug)}
                    >
                      {germanyClusterRevealLabel ?? viewPlaceLabel}
                    </button>
                  </div>
                </Popup>
              </Marker>
            ))
          : null}

        {/* Ohne chunkedLoading: leaflet.markercluster ruft in addLayers vor jedem Chunk _unspiderfy() auf. */}
        {shouldClusterPlaces ? (
          <MarkerClusterGroup
            showCoverageOnHover={false}
            spiderfyOnMaxZoom
            spiderfyDistanceMultiplier={1.25}
            maxClusterRadius={48}
            iconCreateFunction={(cluster: { getChildCount(): number }) =>
              createClusterIcon("place", cluster.getChildCount())
            }
          >
            <ClusterReclickUnspiderfy />
            {placePoints.map((point) => (
              <Marker
                key={point.id}
                position={[point.latitude, point.longitude]}
                icon={
                  markerIcons.get(point.id) ??
                  createMarkerIcon(point.kind, selectedId === point.id)
                }
                eventHandlers={{
                  /* Kein mouseover/out im Cluster: weniger Re-Renders beim Weg zum Spider-Pin. */
                  click: (e) => {
                    stopPinClickFromClosingSpiderfy(e);
                    onSelectChange(point.id);
                  },
                }}
              >
                <MapEntityPopup
                  point={point}
                  ctaLabel={viewPlaceLabel}
                  placeRatingCaption={placePopupRatingCaption}
                />
              </Marker>
            ))}
          </MarkerClusterGroup>
        ) : (
          <>
            {placePoints.map((point) => (
              <Marker
                key={point.id}
                position={[point.latitude, point.longitude]}
                icon={
                  markerIcons.get(point.id) ??
                  createMarkerIcon(point.kind, selectedId === point.id)
                }
                eventHandlers={{
                  mouseover: () => onHoverChange(point.id),
                  click: (e) => {
                    stopPinClickFromClosingSpiderfy(e);
                    onSelectChange(point.id);
                  },
                  mouseout: () => onHoverChange(null),
                }}
              >
                <MapEntityPopup
                  point={point}
                  ctaLabel={viewPlaceLabel}
                  placeRatingCaption={placePopupRatingCaption}
                />
              </Marker>
            ))}
          </>
        )}

        {shouldClusterEvents ? (
          <MarkerClusterGroup
            showCoverageOnHover={false}
            spiderfyOnMaxZoom
            spiderfyDistanceMultiplier={1.25}
            maxClusterRadius={48}
            iconCreateFunction={(cluster: { getChildCount(): number }) =>
              createClusterIcon("event", cluster.getChildCount())
            }
          >
            <ClusterReclickUnspiderfy />
            {eventPoints.map((point) => (
              <Marker
                key={point.id}
                position={[point.latitude, point.longitude]}
                icon={
                  markerIcons.get(point.id) ??
                  createMarkerIcon(point.kind, selectedId === point.id)
                }
                eventHandlers={{
                  click: (e) => {
                    stopPinClickFromClosingSpiderfy(e);
                    onSelectChange(point.id);
                  },
                }}
              >
                <MapEntityPopup point={point} ctaLabel={viewEventLabel} />
              </Marker>
            ))}
          </MarkerClusterGroup>
        ) : (
          <>
            {eventPoints.map((point) => (
              <Marker
                key={point.id}
                position={[point.latitude, point.longitude]}
                icon={
                  markerIcons.get(point.id) ??
                  createMarkerIcon(point.kind, selectedId === point.id)
                }
                eventHandlers={{
                  mouseover: () => onHoverChange(point.id),
                  click: (e) => {
                    stopPinClickFromClosingSpiderfy(e);
                    onSelectChange(point.id);
                  },
                  mouseout: () => onHoverChange(null),
                }}
              >
                <MapEntityPopup point={point} ctaLabel={viewEventLabel} />
              </Marker>
            ))}
          </>
        )}

        {userLocation ? (
          <Marker
            position={[userLocation.latitude, userLocation.longitude]}
            icon={userLocationIcon}
          >
            <Popup>
              <div className="text-sm font-semibold text-slate-900">
                {myLocationLabel}
              </div>
            </Popup>
          </Marker>
        ) : null}
      </MapContainer>

      {points.length === 0 && !showGermanyClusters ? (
        <div className="pointer-events-none absolute inset-x-6 bottom-6 rounded-2xl bg-white/94 px-4 py-3 text-sm text-muted-foreground shadow-sm">
          {filtered ? noResultsLabel : emptyLabel}
        </div>
      ) : null}

      {clusterLoadingSlug ? (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-white/50 px-4 text-center text-sm font-medium text-foreground backdrop-blur-[2px]">
          {clusterLoadingLabel ?? "…"}
        </div>
      ) : null}

      <div className="pointer-events-none absolute left-5 top-5 z-20 flex flex-wrap items-center gap-2">
        <span className="rounded-full border border-slate-200/90 bg-white/88 px-3 py-1.5 text-xs font-semibold text-foreground shadow-md backdrop-blur-md">
          {basemap.provider === "maptiler" ? "MapTiler" : "OSM"}
        </span>
        <span className="rounded-full border border-slate-200/90 bg-white/88 px-3 py-1.5 text-xs text-muted-foreground shadow-md backdrop-blur-md">
          {showGermanyClusters && resultsCitiesUnitLabel
            ? `${germanyCityClusters?.length ?? 0} ${resultsCitiesUnitLabel}`
            : `${points.length} ${resultsSummaryUnitLabel}`}
        </span>
      </div>

      <div className="pointer-events-none absolute bottom-5 left-5 z-20 flex items-center gap-4 rounded-full border border-slate-200/90 bg-white/90 px-4 py-2 text-xs text-slate-700 shadow-lg backdrop-blur-md">
        <div className="flex items-center gap-2">
          <span
            className="box-border flex size-5 shrink-0 items-center justify-center overflow-visible"
            aria-hidden
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 46 56"
              fill="none"
              className="shrink-0"
              preserveAspectRatio="xMidYMid meet"
            >
              <path
                d="M23 4C13.6 4 6 11.5 6 20.8c0 12.5 13.8 25.4 16 27.2.6.6 1.6.6 2.2 0C26.2 46.2 40 33.3 40 20.8 40 11.5 32.4 4 23 4Z"
                fill="#e30a17"
                stroke="#ffffff"
                strokeWidth="3"
              />
              <circle cx="23" cy="21" r="6" fill="#ffffff" />
              <circle cx="23" cy="21" r="2.4" fill="#e30a17" />
            </svg>
          </span>
          <span>{legendPlaces}</span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="box-border flex size-5 shrink-0 items-center justify-center overflow-visible"
            aria-hidden
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 46 46"
              fill="none"
              className="shrink-0"
              preserveAspectRatio="xMidYMid meet"
            >
              <rect
                x="11"
                y="11"
                width="24"
                height="24"
                rx="5"
                transform="rotate(45 23 23)"
                fill="#111827"
                stroke="#ffffff"
                strokeWidth="3"
              />
              <rect
                x="18.5"
                y="18.5"
                width="9"
                height="9"
                rx="2"
                transform="rotate(45 23 23)"
                fill="#ffffff"
              />
            </svg>
          </span>
          <span>{legendEvents}</span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="box-border flex size-5 shrink-0 items-center justify-center overflow-visible"
            aria-hidden
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="shrink-0">
              <circle cx="10" cy="10" r="8" fill="#0284c7" stroke="#ffffff" strokeWidth="2" />
            </svg>
          </span>
          <span>{myLocationLabel}</span>
        </div>
      </div>
    </div>
  );
}
