"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { CalendarDays, ChevronRight, Crosshair, Loader2, MapPin, Star } from "lucide-react";
import L, {
  type DivIcon,
  type LatLngBoundsExpression,
  type LatLngExpression,
  type LeafletMouseEvent,
} from "leaflet";
import { useLeafletContext } from "@react-leaflet/core";
import { MapContainer, Marker, Popup, useMap } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";

import { MerhabaTileLayer } from "@/components/maps/merhaba-tile-layer";
import { Link } from "@/i18n/navigation";
import type { CityMapPoint, MapViewportBounds } from "@/components/cities/city-discovery-map-types";
import {
  CITY_DISCOVERY_MAP_MIN_ZOOM,
  maxBoundsFromCenterRadiusKm,
} from "@/lib/cities/city-map-max-bounds";
import { cn } from "@/lib/utils";

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
  /** Beschriftung / aria für den Standort-Button unten rechts. */
  locateMeLabel: string;
  isGermanyNationalMap?: boolean;
  onLocateMe?: () => void;
  locateMeLoading?: boolean;
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
 * Pan- und Zoom-Rahmen: Deutschland mit kleinem Sicherheitsrand.
 * Verhindert weites Herauszoomen; Fokus bleibt klar auf Deutschland.
 */
const DISCOVERY_MAP_MAX_BOUNDS: LatLngBoundsExpression = [
  [47.05, 5.15],
  [55.25, 15.7],
];

/** Unterhalb dieses Zooms wird die Deutschland-Ansicht zu weit. */
const DISCOVERY_MAP_MIN_ZOOM = 5.6;

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
  const desc = point.description
    .replace(/&#10;|&#13;|&#xa;|&#x0d;/gi, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim();
  return desc || null;
}

const mapPopupCtaClassName =
  "merhaba-map-popup-cta inline-flex items-center justify-center gap-1.5 rounded-full bg-[#e30a17] px-3 py-2 text-xs font-semibold text-white shadow-[0_6px_14px_rgba(227,10,23,0.18)] transition-[transform,background-color,box-shadow] duration-200 hover:bg-[#cc0915] hover:shadow-[0_8px_18px_rgba(227,10,23,0.24)] active:scale-[0.98]";

function GermanyClusterMapPopup({
  cluster,
  legendPlaces,
  legendEvents,
  revealLabel,
  onOpenCity,
}: {
  cluster: GermanyCityClusterMarker;
  legendPlaces: string;
  legendEvents: string;
  revealLabel: string;
  onOpenCity: () => void;
}) {
  return (
    <Popup>
      <div className="merhaba-map-cluster-popup min-w-[12.5rem] max-w-[min(16rem,calc(100vw-2.5rem))] rounded-[1.25rem] border border-white/85 bg-white/95 px-3 py-3 text-center shadow-[0_14px_38px_rgba(15,23,42,0.14)] backdrop-blur-md">
        <h3 className="text-[1.05rem] font-semibold leading-tight tracking-tight text-slate-900">
          {cluster.label}
        </h3>
        <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
          <span className="inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold leading-tight text-slate-700">
            <MapPin className="h-3 w-3 shrink-0 text-[#e30a17]" aria-hidden />
            <span className="tabular-nums text-slate-900">{cluster.placeCount}</span>
            <span className="font-medium text-slate-500">{legendPlaces}</span>
          </span>
          <span className="inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold leading-tight text-slate-700">
            <CalendarDays className="h-3 w-3 shrink-0 text-slate-600" aria-hidden />
            <span className="tabular-nums text-slate-900">{cluster.eventCount}</span>
            <span className="font-medium text-slate-500">{legendEvents}</span>
          </span>
        </div>
        <button type="button" className={`${mapPopupCtaClassName} mt-3 w-full`} onClick={onOpenCity}>
          <span>{revealLabel}</span>
          <ChevronRight className="h-4 w-4 shrink-0 opacity-95" aria-hidden />
        </button>
      </div>
    </Popup>
  );
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
  const teaserLine =
    descriptionLine && descriptionLine.length > 88
      ? `${descriptionLine.slice(0, 85).trimEnd()}...`
      : descriptionLine;

  if (point.kind === "place") {
    const addressLine = point.mapAddressLine?.trim() || point.meta;
    const ratingAria = placeRatingCaption?.trim()
      ? `${placeRatingCaption}: ${point.mapRatingLabel ?? ""}`
      : (point.mapRatingLabel ?? undefined);
    return (
      <Popup>
        <div className="merhaba-map-entity-popup merhaba-map-popup-surface min-w-[11.5rem] max-w-[16rem]">
          <div className="space-y-3">
            <div className="space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#c90814]">
                {point.categoryLabel}
              </p>
              <h4 className="text-[0.98rem] font-semibold leading-tight tracking-tight text-slate-950">
                {point.label}
              </h4>
              <p className="flex items-start gap-2 text-[12px] leading-5 text-slate-600">
                <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden />
                <span>{addressLine}</span>
              </p>
            </div>

            {point.mapRatingLabel ? (
              <p
                className="inline-flex max-w-full flex-wrap items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50/80 px-2.5 py-1 text-[11px] text-slate-700"
                aria-label={ratingAria}
              >
                <Star className="h-3.5 w-3.5 shrink-0 fill-amber-400 text-amber-500" aria-hidden />
                {placeRatingCaption ? (
                  <span className="font-medium text-slate-600">{placeRatingCaption}</span>
                ) : null}
                <span className="font-semibold tabular-nums text-slate-900">{point.mapRatingLabel}</span>
              </p>
            ) : null}

            {teaserLine ? (
              <p className="line-clamp-3 text-[12px] leading-5 text-slate-600">
                {teaserLine}
              </p>
            ) : null}

            <div className="pt-0.5">
              <Link href={point.href} className={mapPopupCtaClassName}>
                <span>{ctaLabel}</span>
                <ChevronRight className="h-4 w-4 shrink-0 opacity-95" aria-hidden />
              </Link>
            </div>
          </div>
        </div>
      </Popup>
    );
  }

  return (
    <Popup>
      <div className="merhaba-map-entity-popup merhaba-map-popup-surface min-w-[11.5rem] max-w-[16rem]">
        <div className="space-y-3">
          <div className="space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#c90814]">
              {point.categoryLabel}
            </p>
            <h4 className="text-[0.98rem] font-semibold leading-tight tracking-tight text-slate-950">
              {point.label}
            </h4>
            <p className="flex items-start gap-2 text-[12px] leading-5 text-slate-600">
              <CalendarDays className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden />
              <span>{point.meta}</span>
            </p>
          </div>

          {teaserLine ? (
            <p className="line-clamp-3 text-[12px] leading-5 text-slate-600">
              {teaserLine}
            </p>
          ) : null}

          <div className="pt-0.5">
            <Link href={point.href} className={mapPopupCtaClassName}>
              <span>{ctaLabel}</span>
              <ChevronRight className="h-4 w-4 shrink-0 opacity-95" aria-hidden />
            </Link>
          </div>
        </div>
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

function escapeClusterLabel(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/"/g, "&quot;");
}

function createGermanyCityClusterIcon(cluster: GermanyCityClusterMarker): DivIcon {
  const placeDigits = String(cluster.placeCount).length;
  const pinWidth = Math.max(48, Math.min(58, 44 + placeDigits * 3));
  const pinHeight = Math.round(pinWidth * 1.22);
  const labelWidth = Math.max(pinWidth + 8, cluster.label.length * 7 + 18);
  const safeName = escapeClusterLabel(cluster.label);
  const eventBadge =
    cluster.eventCount > 0
      ? `<div style="
          position:absolute;
          top:-4px;
          right:-4px;
          width:20px;
          height:20px;
          display:flex;
          align-items:center;
          justify-content:center;
          background:#0f172a;
          color:#ffffff;
          border:2px solid rgba(255,255,255,0.95);
          box-shadow:0 5px 12px rgba(15,23,42,0.18);
          font-size:9px;
          font-weight:700;
          line-height:1;
          font-variant-numeric:tabular-nums;
          transform:rotate(45deg);
          border-radius:4px;
          z-index:8;
        "><span style="transform:rotate(-45deg); display:block; position:relative; z-index:9;">${cluster.eventCount}</span></div>`
      : "";

  return L.divIcon({
    className: "merhaba-germany-city-cluster-icon",
    html: `<div style="
      position:relative;
      width:${labelWidth}px;
      height:${pinHeight + 28}px;
      font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
      -webkit-font-smoothing:antialiased;
      cursor:pointer;
    ">
      <div style="
        position:absolute;
        left:50%;
        top:0;
        width:${pinWidth}px;
        height:${pinHeight}px;
        transform:translateX(-50%);
        filter:drop-shadow(0 10px 18px rgba(15,23,42,0.12));
        z-index:2;
      ">
        <svg xmlns="http://www.w3.org/2000/svg" width="${pinWidth}" height="${pinHeight}" viewBox="0 0 56 68" fill="none" aria-hidden="true" style="display:block; position:absolute; inset:0; z-index:1;">
          <path d="M28 4C16.2 4 6.5 13.3 6.5 25c0 15.7 17.1 31.8 20 34.1.8.7 2.1.7 2.9 0 2.9-2.3 20-18.4 20-34.1C49.5 13.3 39.8 4 28 4Z" fill="url(#merhaba-germany-cluster-pin-fill)" stroke="#f1a3aa" stroke-width="2"/>
          <defs>
            <radialGradient id="merhaba-germany-cluster-pin-fill" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(18 16) rotate(55) scale(46 44)">
              <stop stop-color="#ffffff"/>
              <stop offset="0.38" stop-color="#fff8f8"/>
              <stop offset="1" stop-color="#ffedef"/>
            </radialGradient>
          </defs>
        </svg>
        <div style="
          position:relative;
          z-index:4;
          width:100%;
          height:100%;
          display:flex;
          align-items:flex-start;
          justify-content:center;
          padding-top:18px;
          pointer-events:none;
        ">
          <span style="
            display:inline-flex;
            align-items:center;
            padding:0 2px;
            color:#d31622;
            font-size:${placeDigits >= 4 ? 12 : 14}px;
            font-weight:800;
            line-height:1;
            font-variant-numeric:tabular-nums;
            letter-spacing:-0.02em;
            text-shadow:0 1px 0 rgba(255,255,255,0.7);
            justify-content:center;
          ">
            <span>${cluster.placeCount}</span>
          </span>
        </div>
        ${eventBadge}
      </div>
      <div style="
        position:absolute;
        left:50%;
        top:${pinHeight - 6}px;
        transform:translateX(-50%);
        width:${labelWidth}px;
        padding:6px 9px 5px;
        border-radius:999px;
        background:rgba(255,255,255,0.96);
        border:1px solid rgba(227,10,23,0.12);
        box-shadow:0 4px 12px rgba(15,23,42,0.07);
        backdrop-filter:blur(8px);
      ">
        <div style="
          color:#b91c1c;
          font-size:9px;
          font-weight:800;
          line-height:1.1;
          letter-spacing:0.05em;
          text-transform:uppercase;
          white-space:nowrap;
          text-align:center;
        ">${safeName}</div>
      </div>
    </div>`,
    iconSize: [labelWidth, pinHeight + 28],
    iconAnchor: [labelWidth / 2, pinHeight - 4],
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

const mapChromeFloating =
  "border border-slate-200/90 bg-white/95 text-slate-800 shadow-lg backdrop-blur-md";

function DiscoveryMapFloatingControls({
  onLocateMe,
  locateMeLoading,
  locateMeButtonLabel,
}: {
  onLocateMe?: () => void;
  locateMeLoading: boolean;
  locateMeButtonLabel: string;
}) {
  const map = useMap();
  const [mountNode, setMountNode] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setMountNode(map.getContainer());
  }, [map]);

  if (!mountNode) {
    return null;
  }

  const segment =
    "flex h-9 w-full items-center justify-center text-[1.05rem] font-medium leading-none transition-colors hover:bg-slate-50/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-slate-400/35 disabled:pointer-events-none disabled:opacity-55";

  return createPortal(
    <div
      className={cn(
        mapChromeFloating,
        "pointer-events-auto z-[1100] flex w-10 flex-col overflow-hidden rounded-2xl p-0",
      )}
      style={{
        position: "absolute",
        /* Über der bündig unten rechts stehenden Attribution */
        bottom:
          "max(1.4rem, calc(1.4rem + env(safe-area-inset-bottom, 0px)))",
        right: "max(1.8rem, calc(1.8rem + env(safe-area-inset-right, 0px)))",
      }}
    >
      <button
        type="button"
        className={cn(segment, "border-b border-slate-200/80")}
        aria-label="Zoom in"
        onClick={() => {
          map.zoomIn();
        }}
      >
        +
      </button>
      <button
        type="button"
        className={cn(
          segment,
          onLocateMe ? "border-b border-slate-200/80" : undefined,
        )}
        aria-label="Zoom out"
        onClick={() => {
          map.zoomOut();
        }}
      >
        −
      </button>
      {onLocateMe ? (
        <button
          type="button"
          className={segment}
          onClick={onLocateMe}
          disabled={locateMeLoading}
          title={locateMeButtonLabel}
          aria-label={locateMeButtonLabel}
        >
          {locateMeLoading ? (
            <Loader2 className="h-4 w-4 shrink-0 animate-spin text-slate-700" aria-hidden />
          ) : (
            <Crosshair className="h-4 w-4 shrink-0 text-slate-700" aria-hidden />
          )}
        </button>
      ) : null}
    </div>,
    mountNode,
  );
}

function FitToMarkers({
  points,
  cityCenter,
  userLocation,
  germanyCityClusters,
  mapLayoutEpoch,
  mapMinZoom,
  cityScopedDiscovery,
  selectedId,
}: {
  points: CityMapPoint[];
  cityCenter: { latitude: number; longitude: number } | null;
  userLocation: { latitude: number; longitude: number } | null;
  germanyCityClusters?: GermanyCityClusterMarker[];
  mapLayoutEpoch?: number;
  /** Mindest-Zoom der Karte (fitBounds maxZoom bei 0 Pins darf nicht darunter liegen). */
  mapMinZoom: number;
  cityScopedDiscovery: boolean;
  selectedId: string | null;
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

    if (cityScopedDiscovery && cityCenter && !selectedId && !userLocation) {
      map.setView([cityCenter.latitude, cityCenter.longitude], 12, { animate: false });
      return;
    }

    const fitMaxZoomWhenNoPins = germanyCityClusters?.length
      ? 7.4
      : Math.max(8, mapMinZoom);

    const padding = cityScopedDiscovery ? [22, 22] : [24, 28];
    const maxZoomWithPins = cityScopedDiscovery ? 15 : 14;

    map.fitBounds(bounds, {
      padding: padding as [number, number],
      maxZoom: points.length > 0 ? maxZoomWithPins : fitMaxZoomWhenNoPins,
      animate: false,
    });

    if (cityScopedDiscovery && points.length > 0 && cityCenter) {
      queueMicrotask(() => {
        if (map.getZoom() < 12) {
          map.setView([cityCenter.latitude, cityCenter.longitude], 12, {
            animate: false,
          });
        }
      });
    }
  }, [
    bounds,
    map,
    points.length,
    germanyCityClusters?.length,
    mapMinZoom,
    cityScopedDiscovery,
    cityCenter,
    userLocation,
    selectedId,
  ]);

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
  resultsSummaryUnitLabel: _resultsSummaryUnitLabel,
  viewPlaceLabel,
  placePopupRatingCaption,
  viewEventLabel,
  myLocationLabel,
  locateMeLabel,
  isGermanyNationalMap = false,
  onViewportBoundsChange,
  germanyCityClusters,
  onGermanyCityClusterClick,
  mapLayoutEpoch = 0,
  clusterLoadingSlug,
  clusterLoadingLabel,
  resultsCitiesUnitLabel: _resultsCitiesUnitLabel,
  germanyClusterRevealLabel,
  restrictToCityRadiusKm = null,
  onLocateMe,
  locateMeLoading = false,
}: CityDiscoveryLeafletMapProps) {
  const cityScopedDiscovery =
    restrictToCityRadiusKm != null && restrictToCityRadiusKm > 0 && Boolean(cityCenter);
  /**
   * Erst nach useEffect mounten: vermeidet unter React Strict Mode (Next.js dev) doppelte
   * Leaflet-Initialisierung auf demselben Container („Map container is already initialized“),
   * die oft als zwei Next-Issues / Console-Errors auftaucht.
   */
  const [isMapReady, setIsMapReady] = useState(false);
  const [hoveredGermanyClusterSlug, setHoveredGermanyClusterSlug] = useState<string | null>(null);
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

  const frameClassName = isGermanyNationalMap
    ? "relative isolate z-0 h-[44rem] overflow-hidden rounded-[1.9rem] border border-border/70 bg-[#f5f6f8] lg:h-[58rem] xl:h-[64rem]"
    : "relative isolate z-0 h-[36rem] overflow-hidden rounded-[1.9rem] border border-border/70 bg-[#f5f6f8] lg:h-[42rem]";

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
        className={cn(
          "merhaba-discovery-map relative z-0 h-full w-full",
          isGermanyNationalMap && "merhaba-discovery-map--national",
        )}
      >
        <MerhabaTileLayer />
        <SpiderfyMapClickGuard />
        <SyncMapViewConstraints maxBounds={effectiveMaxBounds} minZoom={effectiveMinZoom} />
        <FitToMarkers
          points={points}
          cityCenter={cityCenter}
          userLocation={userLocation}
          germanyCityClusters={showGermanyClusters ? germanyCityClusters : undefined}
          mapLayoutEpoch={mapLayoutEpoch}
          mapMinZoom={effectiveMinZoom}
          cityScopedDiscovery={cityScopedDiscovery}
          selectedId={selectedId}
        />
        <DiscoveryMapFloatingControls
          onLocateMe={onLocateMe}
          locateMeLoading={locateMeLoading}
          locateMeButtonLabel={locateMeLabel}
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
                zIndexOffset={hoveredGermanyClusterSlug === cluster.slug ? 1000 : 0}
                eventHandlers={{
                  mouseover: () => setHoveredGermanyClusterSlug(cluster.slug),
                  mouseout: () => {
                    setHoveredGermanyClusterSlug((current) =>
                      current === cluster.slug ? null : current,
                    );
                  },
                  popupopen: () => setHoveredGermanyClusterSlug(cluster.slug),
                  popupclose: () => {
                    setHoveredGermanyClusterSlug((current) =>
                      current === cluster.slug ? null : current,
                    );
                  },
                }}
              >
                <GermanyClusterMapPopup
                  cluster={cluster}
                  legendPlaces={legendPlaces}
                  legendEvents={legendEvents}
                  revealLabel={germanyClusterRevealLabel ?? viewPlaceLabel}
                  onOpenCity={() => onGermanyCityClusterClick?.(cluster.slug)}
                />
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

      <div className="pointer-events-none absolute bottom-5 left-5 z-20 flex max-w-[min(100%-2.5rem,20rem)] flex-wrap items-center gap-3 rounded-2xl border border-slate-200/90 bg-white/95 px-3 py-2.5 text-xs font-medium text-slate-700 shadow-lg backdrop-blur-md">
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
        <div className="h-4 w-px shrink-0 bg-slate-200/90" aria-hidden />
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
      </div>
    </div>
  );
}
