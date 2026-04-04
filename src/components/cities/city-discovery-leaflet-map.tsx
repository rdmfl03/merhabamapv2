"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { CalendarDays, ChevronRight, Loader2, LocateFixed, MapPin, Star } from "lucide-react";
import type { LatLngBoundsExpression, Map as LeafletMap } from "leaflet";

import type { CityMapPoint, MapViewportBounds } from "@/components/cities/city-discovery-map-types";
import {
  CITY_DISCOVERY_MAP_MIN_ZOOM,
  maxBoundsFromCenterRadiusKm,
} from "@/lib/cities/city-map-max-bounds";
import { STADIA_ATTRIBUTION, STADIA_PROXY_TILE_URL } from "@/lib/map-config";
import { cn } from "@/lib/utils";
import { Link } from "@/i18n/navigation";

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
  emptyLabel: string;
  noResultsLabel: string;
  filtered: boolean;
  legendPlaces: string;
  legendEvents: string;
  resultsSummaryUnitLabel: string;
  viewPlaceLabel: string;
  /** Screenreader, wenn kein aggregierter Score vorliegt (Stern + „—“ sichtbar). */
  placePopupRatingUnavailableAria: string;
  viewEventLabel: string;
  locateMeLabel: string;
  locatingLabel: string;
  myLocationLabel: string;
  isGermanyNationalMap?: boolean;
  onViewportBoundsChange?: (bounds: MapViewportBounds) => void;
  germanyCityClusters?: GermanyCityClusterMarker[];
  onGermanyCityClusterClick?: (slug: string) => void;
  mapLayoutEpoch?: number;
  resultsCitiesUnitLabel?: string;
  germanyClusterRevealLabel?: string;
  restrictToCityRadiusKm?: number | null;
};

type ProjectedPoint = {
  point: CityMapPoint;
  screen: {
    x: number;
    y: number;
  };
};

type CityOverlayItem =
  | {
      type: "point";
      point: CityMapPoint;
      screen: {
        x: number;
        y: number;
      };
    }
  | {
      type: "cluster";
      kind: "place" | "event";
      count: number;
      screen: {
        x: number;
        y: number;
      };
      latitude: number;
      longitude: number;
      ids: string[];
      points: CityMapPoint[];
    };

type SpiderfiedCityPoint = Extract<CityOverlayItem, { type: "point" }> & {
  spiderfied: true;
  clusterKey: string;
  angle: number;
};

type RenderableCityOverlayItem = CityOverlayItem | SpiderfiedCityPoint;

const DEFAULT_CENTER: [number, number] = [51.1657, 10.4515];
const DISCOVERY_MAP_MAX_BOUNDS: LatLngBoundsExpression = [
  [47.05, 5.15],
  [55.25, 15.7],
];
const DISCOVERY_MAP_MIN_ZOOM = 5.6;
/** Germany cluster overview only: between DISCOVERY_MAP_MIN_ZOOM (too wide) and ~7.2 (too tight). */
const GERMANY_CLUSTER_OVERVIEW_MIN_ZOOM = 6.47;

type UserLocationPoint = {
  latitude: number;
  longitude: number;
  accuracy: number | null;
};

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

function GermanyClusterMapCard({
  cluster,
  legendPlaces,
  legendEvents,
  revealLabel,
  onOpenCity,
  onClose,
}: {
  cluster: GermanyCityClusterMarker;
  legendPlaces: string;
  legendEvents: string;
  revealLabel: string;
  onOpenCity: () => void;
  onClose: () => void;
}) {
  return (
    <div className="merhaba-map-cluster-popup relative rounded-[1.5rem] border border-white/85 bg-white/96 px-4 py-4 text-center shadow-[0_20px_48px_rgba(15,23,42,0.16)] backdrop-blur-md">
      <button
        type="button"
        onClick={onClose}
        aria-label="Close city preview"
        className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200/90 bg-white/90 text-slate-500 transition hover:bg-slate-50 hover:text-slate-700"
      >
        <span aria-hidden className="text-lg leading-none">×</span>
      </button>
      <h3 className="w-full px-10 text-center text-[1.05rem] font-semibold leading-tight tracking-tight text-slate-900">
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
      <button type="button" className={`${mapPopupCtaClassName} mt-4 w-full`} onClick={onOpenCity}>
        <span>{revealLabel}</span>
        <ChevronRight className="h-4 w-4 shrink-0 opacity-95" aria-hidden />
      </button>
    </div>
  );
}

function MapEntityCard({
  point,
  ctaLabel,
  placeRatingUnavailableAria,
  onClose,
}: {
  point: CityMapPoint;
  ctaLabel: string;
  placeRatingUnavailableAria: string;
  onClose: () => void;
}) {
  const descriptionLine = mapPopupDescriptionLine(point);
  const teaserLine =
    descriptionLine && descriptionLine.length > 88
      ? `${descriptionLine.slice(0, 85).trimEnd()}...`
      : descriptionLine;

  if (point.kind === "place") {
    const addressLine = point.mapAddressLine?.trim() || point.meta;
    const hasRating = Boolean(point.mapRatingLabel?.trim());
    return (
      <div className="merhaba-map-entity-popup merhaba-map-popup-surface relative min-w-[11.5rem] max-w-[22rem]">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close details"
          className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200/90 bg-white/90 text-slate-500 transition hover:bg-slate-50 hover:text-slate-700"
        >
          <span aria-hidden className="text-lg leading-none">×</span>
        </button>
        <div className="pr-10 space-y-3">
          <div className="space-y-3">
            <div className="space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#c90814]">
                {point.categoryLabel}
              </p>
              <div className="flex items-start justify-between gap-2">
                <h4 className="min-w-0 flex-1 pr-1 text-[0.98rem] font-semibold leading-tight tracking-tight text-slate-950">
                  {point.label}
                </h4>
                <p
                  className={cn(
                    "inline-flex max-w-[min(13rem,42vw)] shrink-0 flex-wrap items-center justify-end gap-x-1 gap-y-0.5 rounded-full border px-2 py-0.5 text-[11px] leading-tight",
                    hasRating
                      ? "border-amber-200 bg-amber-50/80 text-slate-700"
                      : "border-slate-200/90 bg-slate-50/90 text-slate-500",
                  )}
                  {...(!hasRating
                    ? { "aria-label": placeRatingUnavailableAria }
                    : {
                        "aria-label": [point.mapRatingLabel, point.mapRatingReviewsLine]
                          .filter(Boolean)
                          .join(" "),
                      })}
                >
                  <Star
                    className={cn(
                      "h-3.5 w-3.5 shrink-0",
                      hasRating
                        ? "fill-amber-400 text-amber-500"
                        : "fill-slate-200 text-slate-300",
                    )}
                    aria-hidden
                  />
                  <span
                    className={cn(
                      "font-semibold tabular-nums",
                      hasRating ? "text-slate-900" : "text-slate-500",
                    )}
                    {...(!hasRating ? { "aria-hidden": true } : {})}
                  >
                    {hasRating ? point.mapRatingLabel : "—"}
                  </span>
                  {hasRating && point.mapRatingReviewsLine ? (
                    <span className="font-normal text-slate-500">{point.mapRatingReviewsLine}</span>
                  ) : null}
                </p>
              </div>
              <p className="flex items-start gap-2 text-[12px] leading-5 text-slate-600">
                <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden />
                <span>{addressLine}</span>
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
      </div>
    );
  }

  return (
    <div className="merhaba-map-entity-popup merhaba-map-popup-surface relative min-w-[11.5rem] max-w-[22rem]">
      <button
        type="button"
        onClick={onClose}
        aria-label="Close details"
        className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200/90 bg-white/90 text-slate-500 transition hover:bg-slate-50 hover:text-slate-700"
      >
        <span aria-hidden className="text-lg leading-none">×</span>
      </button>
      <div className="pr-10 space-y-3">
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
    </div>
  );
}

function escapeClusterLabel(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/"/g, "&quot;");
}

function getMarkerMarkup(kind: "place" | "event", active: boolean): string {
  if (kind === "event") {
    const size = active ? 32 : 28;
    return `<span style="
        display:flex;
        align-items:center;
        justify-content:center;
        width:${size}px;
        height:${size}px;
        filter:drop-shadow(0 5px 12px rgba(15,23,42,0.12));
      ">
        <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 46 46" fill="none">
          <rect x="11" y="11" width="24" height="24" rx="5" transform="rotate(45 23 23)" fill="#111827" stroke="#ffffff" stroke-width="3"/>
          <rect x="18.5" y="18.5" width="9" height="9" rx="2" transform="rotate(45 23 23)" fill="#ffffff"/>
        </svg>
      </span>`;
  }

  const width = active ? 28 : 24;
  const height = active ? 34 : 30;
  return `<span style="
      display:block;
      width:${width}px;
      height:${height}px;
      filter:drop-shadow(0 5px 12px rgba(15,23,42,0.12));
    ">
      <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 46 56" fill="none">
        <path d="M23 4C13.6 4 6 11.5 6 20.8c0 12.5 13.8 25.4 16 27.2.6.6 1.6.6 2.2 0C26.2 46.2 40 33.3 40 20.8 40 11.5 32.4 4 23 4Z" fill="#e30a17" stroke="#ffffff" stroke-width="3"/>
        <circle cx="23" cy="21" r="6" fill="#ffffff"/>
        <circle cx="23" cy="21" r="2.4" fill="#e30a17"/>
      </svg>
    </span>`;
}

function getCityClusterMarkup(kind: "place" | "event", count: number, active = false): string {
  if (kind === "event") {
    const size = active ? 42 : 38;
    const fontSize = count >= 100 ? 11 : count >= 10 ? 12 : 13;
    return `<span style="
        display:flex;
        align-items:center;
        justify-content:center;
        width:${size}px;
        height:${size}px;
        filter:drop-shadow(0 6px 14px rgba(15,23,42,0.14));
      ">
        <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 46 46" fill="none" aria-hidden="true">
          <rect x="8.5" y="8.5" width="29" height="29" rx="7" transform="rotate(45 23 23)" fill="#111827" stroke="#ffffff" stroke-width="3"/>
          <text x="23" y="27" text-anchor="middle" font-family="system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" font-size="${fontSize}" font-weight="800" fill="#ffffff">${count}</text>
        </svg>
      </span>`;
  }

  const width = active ? 44 : 40;
  const height = active ? 54 : 49;
  const fontSize = count >= 100 ? 12 : count >= 10 ? 14 : 15;
  return `<span style="
      display:block;
      width:${width}px;
      height:${height}px;
      filter:drop-shadow(0 6px 14px rgba(15,23,42,0.14));
    ">
      <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 46 56" fill="none" aria-hidden="true">
        <path d="M23 4C13.6 4 6 11.5 6 20.8c0 12.5 13.8 25.4 16 27.2.6.6 1.6.6 2.2 0C26.2 46.2 40 33.3 40 20.8 40 11.5 32.4 4 23 4Z" fill="#fff4f5" stroke="#f3a6ad" stroke-width="2.5"/>
        <circle cx="23" cy="21" r="11" fill="#ffffff"/>
        <text x="23" y="26" text-anchor="middle" font-family="system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" font-size="${fontSize}" font-weight="800" fill="#d31622">${count}</text>
      </svg>
    </span>`;
}

function getGermanyCityClusterMarkup(cluster: GermanyCityClusterMarker, active = false): string {
  const placeDigits = String(cluster.placeCount).length;
  const pinWidth = Math.max(50, Math.min(58, 44 + placeDigits * 3));
  const pinHeight = Math.round(pinWidth * 1.18);
  const labelWidth = Math.max(pinWidth + 10, cluster.label.length * 7 + 22);
  const safeName = escapeClusterLabel(cluster.label);
  const eventBadge =
    cluster.eventCount > 0
      ? `<div style="
          position:absolute;
          top:-3px;
          right:-7px;
          width:24px;
          height:24px;
          display:flex;
          align-items:center;
          justify-content:center;
          transform:rotate(45deg);
          background:#0f172a;
          color:#ffffff;
          border:2px solid rgba(255,255,255,0.98);
          box-shadow:${active ? "0 8px 18px rgba(15,23,42,0.24)" : "0 5px 12px rgba(15,23,42,0.18)"};
          z-index:6;
        "><span style="
          display:block;
          transform:rotate(-45deg);
          font-size:10px;
          font-weight:700;
          line-height:1;
          font-variant-numeric:tabular-nums;
        ">${cluster.eventCount}</span></div>`
      : "";

  return `<div style="
      position:relative;
      width:${labelWidth}px;
      height:${pinHeight + 30}px;
      font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
      -webkit-font-smoothing:antialiased;
      cursor:pointer;
      transform:${active ? "translateY(-1px)" : "translateY(0)"};
      overflow:visible;
    ">
      <div style="
        position:absolute;
        left:50%;
        top:0;
        width:${pinWidth}px;
        height:${pinHeight}px;
        transform:translateX(-50%);
        display:flex;
        align-items:center;
        justify-content:center;
        filter:${active ? "drop-shadow(0 12px 22px rgba(227,10,23,0.24))" : "drop-shadow(0 10px 18px rgba(227,10,23,0.16))"};
        overflow:visible;
        z-index:1;
      ">
        <svg xmlns="http://www.w3.org/2000/svg" width="${pinWidth}" height="${pinHeight}" viewBox="0 0 46 56" fill="none" aria-hidden="true" style="position:relative; z-index:1; overflow:visible;">
          <path d="M23 4C13.6 4 6 11.5 6 20.8c0 12.5 13.8 25.4 16 27.2.6.6 1.6.6 2.2 0C26.2 46.2 40 33.3 40 20.8 40 11.5 32.4 4 23 4Z"
            fill="url(#cluster-pin-fill-${cluster.slug})"
            stroke="${active ? "rgba(227,10,23,0.55)" : "rgba(227,10,23,0.32)"}"
            stroke-width="2.5"/>
          <circle cx="23" cy="21" r="11" fill="rgba(255,255,255,0.96)"/>
          <text x="23" y="26" text-anchor="middle" font-family="system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" font-size="${placeDigits >= 4 ? 12 : 14}" font-weight="800" fill="#d31622" letter-spacing="-0.02em">${cluster.placeCount}</text>
          <defs>
            <radialGradient id="cluster-pin-fill-${cluster.slug}" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(17 14) rotate(55) scale(34 31)">
              <stop stop-color="rgba(255,255,255,0.99)"/>
              <stop offset="0.44" stop-color="rgba(255,246,247,0.98)"/>
              <stop offset="1" stop-color="${active ? "rgba(255,229,232,0.98)" : "rgba(255,240,242,0.97)"}"/>
            </radialGradient>
          </defs>
        </svg>
        ${eventBadge}
      </div>
      <div style="
        position:absolute;
        left:50%;
        top:${pinHeight - 2}px;
        transform:translateX(-50%);
        width:${labelWidth}px;
        padding:6px 9px 5px;
        border-radius:999px;
        background:rgba(255,255,255,0.96);
        border:1px solid ${active ? "rgba(227,10,23,0.2)" : "rgba(227,10,23,0.12)"};
        box-shadow:${active ? "0 8px 18px rgba(15,23,42,0.12)" : "0 4px 12px rgba(15,23,42,0.07)"};
        backdrop-filter:blur(8px);
        z-index:2;
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
    </div>`;
}

function getGermanyClusterIconDimensions(cluster: GermanyCityClusterMarker) {
  const placeDigits = String(cluster.placeCount).length;
  const pinWidth = Math.max(50, Math.min(58, 44 + placeDigits * 3));
  const pinHeight = Math.round(pinWidth * 1.18);
  const labelWidth = Math.max(pinWidth + 10, cluster.label.length * 7 + 22);
  return {
    width: labelWidth,
    height: pinHeight + 30,
  };
}

function fingerprintMapPoints(points: CityMapPoint[]): string {
  if (points.length === 0) {
    return "";
  }
  return points
    .map((p) => `${p.id}:${p.latitude},${p.longitude}`)
    .sort()
    .join("|");
}

function expandViewportBounds(bounds: MapViewportBounds, factor = 0.18): MapViewportBounds {
  const latPad = (bounds.north - bounds.south) * factor;
  const lngPad = (bounds.east - bounds.west) * factor;
  return {
    south: bounds.south - latPad,
    west: bounds.west - lngPad,
    north: bounds.north + latPad,
    east: bounds.east + lngPad,
  };
}

function markerRenderLimitsForZoom(zoom: number | null) {
  if (zoom == null || zoom < 12) {
    return { places: 320, events: 60 };
  }
  if (zoom < 13) {
    return { places: 650, events: 90 };
  }
  if (zoom < 14) {
    return { places: 1200, events: 120 };
  }
  return { places: Number.POSITIVE_INFINITY, events: Number.POSITIVE_INFINITY };
}

function cityClusterRadiusForZoom(kind: "place" | "event", zoom: number | null) {
  if (zoom == null) {
    return kind === "event" ? 38 : 34;
  }
  if (zoom < 11) {
    return kind === "event" ? 40 : 36;
  }
  if (zoom < 12.5) {
    return kind === "event" ? 34 : 30;
  }
  if (zoom < 14) {
    return kind === "event" ? 28 : 24;
  }
  return kind === "event" ? 22 : 20;
}

function clusterProjectedPoints(
  projectedPoints: ProjectedPoint[],
  zoom: number | null,
  selectedId: string | null,
): CityOverlayItem[] {
  const singles = projectedPoints.filter(({ point }) => point.id === selectedId);
  const remaining = projectedPoints.filter(({ point }) => point.id !== selectedId);
  const overlayItems: CityOverlayItem[] = singles.map(({ point, screen }) => ({
    type: "point",
    point,
    screen,
  }));

  (["place", "event"] as const).forEach((kind) => {
    const pointsOfKind = remaining.filter(({ point }) => point.kind === kind);
    const radius = cityClusterRadiusForZoom(kind, zoom);
    const clusters: Array<{
      kind: "place" | "event";
      items: ProjectedPoint[];
      centerX: number;
      centerY: number;
      latSum: number;
      lngSum: number;
    }> = [];

    pointsOfKind.forEach((entry) => {
      const match = clusters.find((cluster) => {
        const dx = cluster.centerX - entry.screen.x;
        const dy = cluster.centerY - entry.screen.y;
        return Math.hypot(dx, dy) <= radius;
      });

      if (!match) {
        clusters.push({
          kind,
          items: [entry],
          centerX: entry.screen.x,
          centerY: entry.screen.y,
          latSum: entry.point.latitude,
          lngSum: entry.point.longitude,
        });
        return;
      }

      match.items.push(entry);
      match.latSum += entry.point.latitude;
      match.lngSum += entry.point.longitude;
      match.centerX = match.items.reduce((sum, item) => sum + item.screen.x, 0) / match.items.length;
      match.centerY = match.items.reduce((sum, item) => sum + item.screen.y, 0) / match.items.length;
    });

    clusters.forEach((cluster) => {
      if (cluster.items.length === 1) {
        const [{ point, screen }] = cluster.items;
        overlayItems.push({
          type: "point",
          point,
          screen,
        });
        return;
      }

      overlayItems.push({
        type: "cluster",
        kind: cluster.kind,
        count: cluster.items.length,
        screen: {
          x: cluster.centerX,
          y: cluster.centerY,
        },
        latitude: cluster.latSum / cluster.items.length,
        longitude: cluster.lngSum / cluster.items.length,
        ids: cluster.items.map(({ point }) => point.id),
        points: cluster.items.map(({ point }) => point),
      });
    });
  });

  return overlayItems;
}

function cityClusterKey(cluster: Extract<CityOverlayItem, { type: "cluster" }>) {
  return `${cluster.kind}:${cluster.ids.join(",")}`;
}

function shouldSpiderfyCityCluster(
  cluster: Extract<CityOverlayItem, { type: "cluster" }>,
  zoom: number | null,
) {
  if (cluster.count <= 1) {
    return false;
  }

  if (zoom != null && zoom >= 15) {
    return true;
  }

  const latitudes = cluster.points.map((point) => point.latitude);
  const longitudes = cluster.points.map((point) => point.longitude);
  const latSpan = Math.max(...latitudes) - Math.min(...latitudes);
  const lngSpan = Math.max(...longitudes) - Math.min(...longitudes);

  return latSpan <= 0.00018 && lngSpan <= 0.00018;
}

function spiderfyClusterPoints(
  cluster: Extract<CityOverlayItem, { type: "cluster" }>,
): SpiderfiedCityPoint[] {
  const clusterKey = cityClusterKey(cluster);
  const count = cluster.points.length;
  const radius = count <= 4 ? 34 : count <= 6 ? 40 : 48;
  const angleStep = (Math.PI * 2) / count;

  return cluster.points.map((point, index) => {
    const angle = -Math.PI / 2 + index * angleStep;
    return {
      type: "point" as const,
      point,
      screen: {
        x: cluster.screen.x + Math.cos(angle) * radius,
        y: cluster.screen.y + Math.sin(angle) * radius,
      },
      spiderfied: true as const,
      clusterKey,
      angle,
    };
  });
}

function computeFitBounds(args: {
  points: CityMapPoint[];
  cityCenter: { latitude: number; longitude: number } | null;
  germanyCityClusters?: GermanyCityClusterMarker[];
}): LatLngBoundsExpression | null {
  const { points, cityCenter, germanyCityClusters } = args;
  const coords = points.map((point) => [point.latitude, point.longitude] as [number, number]);

  if (coords.length === 0 && germanyCityClusters?.length) {
    return germanyCityClusters.map((c) => [c.latitude, c.longitude] as [number, number]);
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
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function pointInBounds(lat: number, lng: number, bounds: MapViewportBounds): boolean {
  return lat >= bounds.south && lat <= bounds.north && lng >= bounds.west && lng <= bounds.east;
}

function boundsExpressionToViewportBounds(
  bounds: LatLngBoundsExpression,
): MapViewportBounds {
  const [a, b] = bounds as [[number, number], [number, number]];
  return {
    south: Math.min(a[0], b[0]),
    west: Math.min(a[1], b[1]),
    north: Math.max(a[0], b[0]),
    east: Math.max(a[1], b[1]),
  };
}

function computePopupOverlayPosition(args: {
  anchor: { x: number; y: number } | null;
  mapSize: { width: number; height: number } | null;
  cardWidth: number;
  cardHeight: number;
  gap?: number;
  inset?: number;
  aboveAnchorOffsetY?: number;
  belowAnchorOffsetY?: number;
}) {
  const {
    anchor,
    mapSize,
    cardWidth,
    cardHeight,
    gap = 18,
    inset = 20,
    aboveAnchorOffsetY = 0,
    belowAnchorOffsetY = 0,
  } = args;
  if (!anchor || !mapSize) {
    return {
      left: inset,
      top: inset,
      width: cardWidth,
    };
  }

  const maxWidth = Math.max(240, mapSize.width - inset * 2);
  const width = Math.min(cardWidth, maxWidth);
  const left = clamp(anchor.x - width / 2, inset, Math.max(inset, mapSize.width - width - inset));

  const aboveAnchorY = anchor.y + aboveAnchorOffsetY;
  const belowAnchorY = anchor.y + belowAnchorOffsetY;
  const aboveTop = aboveAnchorY - cardHeight - gap;
  const canFitAbove = aboveTop >= inset;
  const belowTop = belowAnchorY + gap;
  const top = canFitAbove
    ? aboveTop
    : clamp(belowTop, inset, Math.max(inset, mapSize.height - cardHeight - inset));
  const placement = canFitAbove ? "above" : "below";
  const arrowLeft = clamp(anchor.x - left, 24, Math.max(24, width - 24));

  return { left, top, width, placement, arrowLeft };
}

const mapChromeFloating =
  "border border-slate-200/90 bg-white/95 text-slate-800 shadow-lg backdrop-blur-md";

export function CityDiscoveryLeafletMap({
  points,
  cityCenter,
  selectedId,
  onHoverChange,
  onSelectChange,
  emptyLabel,
  noResultsLabel,
  filtered,
  legendPlaces,
  legendEvents,
  resultsSummaryUnitLabel: _resultsSummaryUnitLabel,
  viewPlaceLabel,
  placePopupRatingUnavailableAria,
  viewEventLabel,
  locateMeLabel,
  locatingLabel,
  myLocationLabel,
  isGermanyNationalMap = false,
  onViewportBoundsChange,
  germanyCityClusters,
  onGermanyCityClusterClick,
  mapLayoutEpoch = 0,
  resultsCitiesUnitLabel: _resultsCitiesUnitLabel,
  germanyClusterRevealLabel,
  restrictToCityRadiusKm = null,
}: CityDiscoveryLeafletMapProps) {
  const mapHostRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const germanyPopupRef = useRef<HTMLDivElement | null>(null);
  const pointPopupRef = useRef<HTMLDivElement | null>(null);
  const locationWatchIdRef = useRef<number | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const [renderBounds, setRenderBounds] = useState<MapViewportBounds | null>(null);
  const [renderZoom, setRenderZoom] = useState<number | null>(null);
  const [viewVersion, setViewVersion] = useState(0);
  const [activeGermanyClusterSlug, setActiveGermanyClusterSlug] = useState<string | null>(null);
  const [spiderfiedCityClusterKey, setSpiderfiedCityClusterKey] = useState<string | null>(null);
  const [pointPopupMeasuredHeight, setPointPopupMeasuredHeight] = useState<number | null>(null);
  const [userLocation, setUserLocation] = useState<UserLocationPoint | null>(null);
  const [locateMeLoading, setLocateMeLoading] = useState(false);

  const cityScopedDiscovery =
    restrictToCityRadiusKm != null && restrictToCityRadiusKm > 0 && Boolean(cityCenter);

  const showGermanyClusters =
    points.length === 0 &&
    Boolean(germanyCityClusters?.length) &&
    Boolean(onGermanyCityClusterClick);

  useEffect(() => {
    if (!showGermanyClusters) {
      setActiveGermanyClusterSlug(null);
    }
  }, [showGermanyClusters]);

  useEffect(() => {
    setSpiderfiedCityClusterKey(null);
  }, [viewVersion, showGermanyClusters]);

  useEffect(() => {
    let cancelled = false;
    let mapInstance: LeafletMap | null = null;
    let frameHandle: number | null = null;

    async function initMap() {
      const L = await import("leaflet");
      if (cancelled || !mapHostRef.current || mapRef.current) {
        return;
      }

      mapInstance = L.map(mapHostRef.current, {
        center: DEFAULT_CENTER,
        zoom: 6,
        zoomControl: false,
        inertia: false,
        zoomAnimation: false,
        fadeAnimation: false,
        markerZoomAnimation: false,
        preferCanvas: true,
        maxBounds: DISCOVERY_MAP_MAX_BOUNDS,
        maxBoundsViscosity: 1,
        worldCopyJump: false,
      });

      L.tileLayer(STADIA_PROXY_TILE_URL, {
        attribution: STADIA_ATTRIBUTION,
        noWrap: true,
      }).addTo(mapInstance);

      mapInstance.attributionControl?.setPrefix(false);

      const report = () => {
        const b = mapInstance!.getBounds();
        const next: MapViewportBounds = {
          south: b.getSouth(),
          west: b.getWest(),
          north: b.getNorth(),
          east: b.getEast(),
        };
        setRenderBounds(next);
        setRenderZoom(mapInstance!.getZoom());
        onViewportBoundsChange?.(next);
        setViewVersion((value) => value + 1);
      };

      const reportDuringInteraction = () => {
        if (frameHandle != null) {
          return;
        }
        frameHandle = window.requestAnimationFrame(() => {
          frameHandle = null;
          report();
        });
      };

      mapInstance.on("move zoom", reportDuringInteraction);
      mapInstance.on("moveend zoomend resize", report);
      report();

      mapRef.current = mapInstance;
      setIsMapReady(true);
    }

    void initMap();

    return () => {
      cancelled = true;
      setIsMapReady(false);
      setRenderBounds(null);
      setRenderZoom(null);
      if (frameHandle != null) {
        window.cancelAnimationFrame(frameHandle);
        frameHandle = null;
      }
      if (mapInstance) {
        mapInstance.off();
        mapInstance.remove();
      }
      mapRef.current = null;
    };
  }, [onViewportBoundsChange]);

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

  const allowedLocationBounds = useMemo(
    () => boundsExpressionToViewportBounds(effectiveMaxBounds),
    [effectiveMaxBounds],
  );

  const clearLocationWatch = useCallback(() => {
    if (
      locationWatchIdRef.current != null &&
      typeof navigator !== "undefined" &&
      "geolocation" in navigator
    ) {
      navigator.geolocation.clearWatch(locationWatchIdRef.current);
    }
    locationWatchIdRef.current = null;
  }, []);

  const applyLocationPosition = useCallback(
    (position: GeolocationPosition, centerMap: boolean) => {
      const map = mapRef.current;
      const nextLocation: UserLocationPoint = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy:
          typeof position.coords.accuracy === "number"
            ? position.coords.accuracy
            : null,
      };

      if (
        !pointInBounds(
          nextLocation.latitude,
          nextLocation.longitude,
          allowedLocationBounds,
        )
      ) {
        setLocateMeLoading(false);
        setUserLocation(null);
        return;
      }

      setUserLocation(nextLocation);
      setLocateMeLoading(false);

      if (!map || !centerMap) {
        return;
      }

      const targetZoom = showGermanyClusters
        ? Math.max(map.getZoom(), 11)
        : Math.max(map.getZoom(), 13);

      map.setView([nextLocation.latitude, nextLocation.longitude], targetZoom, {
        animate: false,
      });
      map.panInsideBounds(effectiveMaxBounds, { animate: false });
    },
    [allowedLocationBounds, effectiveMaxBounds, showGermanyClusters],
  );

  const handleLocateMe = useCallback(() => {
    if (
      typeof navigator === "undefined" ||
      !("geolocation" in navigator) ||
      !mapRef.current
    ) {
      return;
    }

    setLocateMeLoading(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        applyLocationPosition(position, true);
        if (locationWatchIdRef.current == null) {
          locationWatchIdRef.current = navigator.geolocation.watchPosition(
            (nextPosition) => {
              applyLocationPosition(nextPosition, false);
            },
            () => {
              // Keep the last known valid location visible; no UI error state for now.
            },
            {
              enableHighAccuracy: true,
              maximumAge: 0,
              timeout: 15000,
            },
          );
        }
      },
      () => {
        setLocateMeLoading(false);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 15000,
      },
    );
  }, [applyLocationPosition]);

  useEffect(() => {
    return () => {
      clearLocationWatch();
    };
  }, [clearLocationWatch]);

  useEffect(() => {
    if (
      userLocation &&
      !pointInBounds(userLocation.latitude, userLocation.longitude, allowedLocationBounds)
    ) {
      setUserLocation(null);
    }
  }, [allowedLocationBounds, userLocation]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) {
      return;
    }
    map.setMaxBounds(effectiveMaxBounds);
    map.options.maxBoundsViscosity = 1;
    const lockedMinZoom =
      showGermanyClusters || cityScopedDiscovery
        ? Math.max(
            showGermanyClusters ? GERMANY_CLUSTER_OVERVIEW_MIN_ZOOM : effectiveMinZoom,
            map.getBoundsZoom(effectiveMaxBounds, false),
          )
        : effectiveMinZoom;
    map.setMinZoom(lockedMinZoom);
    if (map.getZoom() < lockedMinZoom) {
      map.setZoom(lockedMinZoom);
    }
    map.panInsideBounds(effectiveMaxBounds, { animate: false });
  }, [effectiveMaxBounds, effectiveMinZoom, showGermanyClusters, cityScopedDiscovery, isMapReady]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) {
      return;
    }
    map.scrollWheelZoom.enable();
    map.doubleClickZoom.enable();
    map.touchZoom.enable();
    map.boxZoom.enable();
    map.keyboard.enable();
  }, [showGermanyClusters, isMapReady]);

  const pointsFingerprint = useMemo(() => fingerprintMapPoints(points), [points]);
  const clusterFingerprint = useMemo(() => {
    if (!germanyCityClusters?.length) {
      return "";
    }
    return germanyCityClusters
      .map((cluster) => `${cluster.slug}:${cluster.latitude},${cluster.longitude}`)
      .sort()
      .join("|");
  }, [germanyCityClusters]);
  const cityCenterKey = cityCenter ? `${cityCenter.latitude},${cityCenter.longitude}` : "";
  useEffect(() => {
    const map = mapRef.current;
    if (!map) {
      return;
    }
    const lockViewportToAllowedBounds = showGermanyClusters || cityScopedDiscovery;
    const bounds = lockViewportToAllowedBounds
        ? effectiveMaxBounds
        : computeFitBounds({
          points,
          cityCenter,
          germanyCityClusters: showGermanyClusters ? germanyCityClusters : undefined,
        });

    if (!bounds) {
      map.setView(DEFAULT_CENTER, 6, { animate: false });
      return;
    }

    const padding = showGermanyClusters
      ? [14, 17]
      : cityScopedDiscovery
        ? [22, 22]
        : [24, 28];
    const lockedMinZoom = lockViewportToAllowedBounds
      ? Math.max(
          showGermanyClusters ? GERMANY_CLUSTER_OVERVIEW_MIN_ZOOM : effectiveMinZoom,
          map.getBoundsZoom(effectiveMaxBounds, false),
        )
      : effectiveMinZoom;
    const fitMaxZoomWhenNoPins = showGermanyClusters
      ? Math.max(lockedMinZoom, 7.45)
      : germanyCityClusters?.length
        ? 7.4
        : Math.max(8, effectiveMinZoom);
    const maxZoomWithPins = cityScopedDiscovery ? 15 : 14;

    map.fitBounds(bounds, {
      padding: padding as [number, number],
      maxZoom: points.length > 0 ? maxZoomWithPins : fitMaxZoomWhenNoPins,
      animate: false,
    });

    if (cityScopedDiscovery && points.length > 0 && cityCenter) {
      queueMicrotask(() => {
        if (map.getZoom() < 12) {
          map.setView([cityCenter.latitude, cityCenter.longitude], 12, { animate: false });
        }
        map.panInsideBounds(effectiveMaxBounds, { animate: false });
        map.setMinZoom(Math.max(map.getZoom(), lockedMinZoom));
      });
      return;
    }

    if (lockViewportToAllowedBounds) {
      queueMicrotask(() => {
        if (showGermanyClusters) {
          map.panInsideBounds(effectiveMaxBounds, { animate: false });
          map.setMinZoom(lockedMinZoom);
        } else {
          map.panInsideBounds(effectiveMaxBounds, { animate: false });
          map.setMinZoom(Math.max(map.getZoom(), lockedMinZoom));
        }
      });
    }
  }, [
    pointsFingerprint,
    clusterFingerprint,
    cityCenterKey,
    mapLayoutEpoch,
    cityScopedDiscovery,
    effectiveMinZoom,
    germanyCityClusters,
    showGermanyClusters,
    points,
    cityCenter,
    effectiveMaxBounds,
    showGermanyClusters,
    isMapReady,
  ]);

  const renderedPoints = useMemo(() => {
    if (!cityScopedDiscovery || !renderBounds) {
      return points;
    }

    const expandedBounds = expandViewportBounds(renderBounds);
    const visiblePlaces = points.filter(
      (point) =>
        point.kind === "place" &&
        point.latitude >= expandedBounds.south &&
        point.latitude <= expandedBounds.north &&
        point.longitude >= expandedBounds.west &&
        point.longitude <= expandedBounds.east,
    );
    const visibleEvents = points.filter(
      (point) =>
        point.kind === "event" &&
        point.latitude >= expandedBounds.south &&
        point.latitude <= expandedBounds.north &&
        point.longitude >= expandedBounds.west &&
        point.longitude <= expandedBounds.east,
    );

    const limits = markerRenderLimitsForZoom(renderZoom);
    const next = [
      ...visiblePlaces.slice(0, limits.places),
      ...visibleEvents.slice(0, limits.events),
    ];

    if (selectedId && !next.some((point) => point.id === selectedId)) {
      const selectedPoint = points.find((point) => point.id === selectedId);
      if (selectedPoint) {
        next.push(selectedPoint);
      }
    }

    return next;
  }, [cityScopedDiscovery, points, renderBounds, renderZoom, selectedId]);

  const projectedClusters = useMemo(() => {
    const map = mapRef.current;
    if (!map || !showGermanyClusters || !germanyCityClusters?.length) {
      return [];
    }
    return germanyCityClusters.map((cluster) => ({
      cluster,
      point: map.latLngToContainerPoint([cluster.latitude, cluster.longitude]),
    }));
  }, [germanyCityClusters, showGermanyClusters, viewVersion]);

  const projectedPoints = useMemo<ProjectedPoint[]>(() => {
    const map = mapRef.current;
    if (!map || showGermanyClusters) {
      return [];
    }
    return renderedPoints.map((point) => ({
      point,
      screen: map.latLngToContainerPoint([point.latitude, point.longitude]),
    }));
  }, [renderedPoints, showGermanyClusters, viewVersion]);

  const projectedUserLocation = useMemo(() => {
    const map = mapRef.current;
    if (!map || !userLocation) {
      return null;
    }
    return map.latLngToContainerPoint([userLocation.latitude, userLocation.longitude]);
  }, [userLocation, viewVersion]);

  const cityDisplayItems = useMemo(
    () => clusterProjectedPoints(projectedPoints, renderZoom, selectedId),
    [projectedPoints, renderZoom, selectedId],
  );

  const renderableCityItems = useMemo<RenderableCityOverlayItem[]>(() => {
    if (!spiderfiedCityClusterKey) {
      return cityDisplayItems;
    }

    return cityDisplayItems.flatMap((item) => {
      if (item.type !== "cluster" || cityClusterKey(item) !== spiderfiedCityClusterKey) {
        return [item];
      }
      return spiderfyClusterPoints(item);
    });
  }, [cityDisplayItems, spiderfiedCityClusterKey]);

  const activeGermanyCluster = useMemo(
    () =>
      activeGermanyClusterSlug && germanyCityClusters
        ? germanyCityClusters.find((cluster) => cluster.slug === activeGermanyClusterSlug) ?? null
        : null,
    [activeGermanyClusterSlug, germanyCityClusters],
  );

  const selectedPoint = useMemo(
    () => (selectedId ? points.find((point) => point.id === selectedId) ?? null : null),
    [points, selectedId],
  );

  const mapViewportSize = useMemo(() => {
    const map = mapRef.current;
    if (!map) {
      return null;
    }
    const size = map.getSize();
    return {
      width: size.x,
      height: size.y,
    };
  }, [viewVersion, isMapReady]);

  const activeGermanyClusterAnchor = useMemo(
    () =>
      activeGermanyClusterSlug
        ? projectedClusters.find(({ cluster }) => cluster.slug === activeGermanyClusterSlug)?.point ?? null
        : null,
    [activeGermanyClusterSlug, projectedClusters],
  );

  const selectedPointAnchor = useMemo(
    () =>
      selectedId
        ? (() => {
            const selectedItem = renderableCityItems.find(
              (item): item is Extract<RenderableCityOverlayItem, { type: "point" }> =>
                item.type === "point" && item.point.id === selectedId,
            );

            if (!selectedItem) {
              return null;
            }

            return {
              x: selectedItem.screen.x,
              y: selectedItem.screen.y,
            };
          })()
        : null,
    [renderableCityItems, selectedId],
  );

  useLayoutEffect(() => {
    if (!selectedPoint || !pointPopupRef.current) {
      setPointPopupMeasuredHeight(null);
      return;
    }

    const node = pointPopupRef.current;

    const measure = () => {
      const nextHeight = Math.round(node.getBoundingClientRect().height);
      setPointPopupMeasuredHeight((current) =>
        current != null && Math.abs(current - nextHeight) <= 1 ? current : nextHeight,
      );
    };

    measure();

    const observer = new ResizeObserver(() => {
      measure();
    });
    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, [selectedPoint, mapViewportSize?.width]);

  const germanyClusterPopupPosition = useMemo(
    () =>
      computePopupOverlayPosition({
        anchor: activeGermanyClusterAnchor,
        mapSize: mapViewportSize,
        cardWidth: 304,
        cardHeight: 196,
        gap: 26,
      }),
    [activeGermanyClusterAnchor, mapViewportSize],
  );

  const pointPopupPosition = useMemo(
    () =>
      computePopupOverlayPosition({
        anchor: selectedPointAnchor,
        mapSize: mapViewportSize,
        cardWidth: 352,
        cardHeight:
          pointPopupMeasuredHeight ??
          (selectedPoint?.kind === "event" ? 236 : 268),
        gap: 7,
        aboveAnchorOffsetY:
          selectedPoint?.kind === "event"
            ? -16
            : selectedPoint?.kind === "place"
              ? -34
              : 0,
        belowAnchorOffsetY: selectedPoint?.kind === "event" ? 16 : 0,
      }),
    [selectedPoint, selectedPointAnchor, mapViewportSize, pointPopupMeasuredHeight],
  );

  const frameClassName = isGermanyNationalMap
    ? "relative isolate z-0 h-[44rem] overflow-hidden rounded-[1.9rem] border border-border/70 bg-[#f5f6f8] lg:h-[58rem] xl:h-[64rem]"
    : "relative isolate z-0 h-[36rem] overflow-hidden rounded-[1.9rem] border border-border/70 bg-[#f5f6f8] lg:h-[42rem]";

  const effectiveZoomOutFloor =
    showGermanyClusters ? GERMANY_CLUSTER_OVERVIEW_MIN_ZOOM : effectiveMinZoom;

  useEffect(() => {
    if (!activeGermanyCluster && !selectedPoint) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (!target) {
        return;
      }

      if (activeGermanyCluster && germanyPopupRef.current?.contains(target)) {
        return;
      }

      if (selectedPoint && pointPopupRef.current?.contains(target)) {
        return;
      }

      if (activeGermanyCluster) {
        setActiveGermanyClusterSlug(null);
      }
      if (spiderfiedCityClusterKey) {
        setSpiderfiedCityClusterKey(null);
      }
      if (selectedPoint) {
        onSelectChange(null);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown, true);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown, true);
    };
  }, [activeGermanyCluster, selectedPoint, spiderfiedCityClusterKey, onSelectChange]);

  return (
    <div className="space-y-4">
      <div className={frameClassName}>
        <div
          ref={mapHostRef}
          className={cn(
            "merhaba-discovery-map relative z-0 h-full w-full",
            isGermanyNationalMap && "merhaba-discovery-map--national",
          )}
        />

        <div
          className={cn(
            mapChromeFloating,
            "pointer-events-auto absolute bottom-[max(1.4rem,calc(1.4rem+env(safe-area-inset-bottom,0px)))] right-[max(1.8rem,calc(1.8rem+env(safe-area-inset-right,0px)))] z-[1100] flex w-10 flex-col overflow-hidden rounded-2xl p-0",
          )}
        >
          <button
            type="button"
            className="flex h-9 w-full items-center justify-center border-b border-slate-200/80 text-[1.05rem] font-medium leading-none transition-colors hover:bg-slate-50/90"
            aria-label="Zoom in"
            onClick={() => mapRef.current?.zoomIn()}
          >
            +
          </button>
          <button
            type="button"
            className={cn(
              "flex h-9 w-full items-center justify-center text-[1.05rem] font-medium leading-none transition-colors hover:bg-slate-50/90",
              "border-b border-slate-200/80",
            )}
            aria-label="Zoom out"
            onClick={() => {
              const map = mapRef.current;
              if (!map) {
                return;
              }
              const nextZoom = map.getZoom() - 1;
              map.setZoom(Math.max(nextZoom, effectiveZoomOutFloor), { animate: false });
            }}
          >
            −
          </button>
          <button
            type="button"
            className="flex h-10 w-full items-center justify-center text-slate-700 transition-colors hover:bg-slate-50/90"
            aria-label={locateMeLoading ? locatingLabel : locateMeLabel}
            title={locateMeLoading ? locatingLabel : locateMeLabel}
            onClick={handleLocateMe}
          >
            {locateMeLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <LocateFixed className="h-4 w-4" aria-hidden />
            )}
          </button>
        </div>

        {projectedUserLocation ? (
          <div
            className="pointer-events-none absolute inset-0 z-[979]"
            aria-label={myLocationLabel}
            role="img"
          >
            <div
              className="pointer-events-none absolute"
              style={{
                left: projectedUserLocation.x,
                top: projectedUserLocation.y,
                transform: "translate(-50%, -50%)",
              }}
            >
              <span className="merhaba-location-marker block">
                <span className="merhaba-location-marker__pulse" aria-hidden />
                <span
                  className="merhaba-location-marker__pulse merhaba-location-marker__pulse--delayed"
                  aria-hidden
                />
                <span className="merhaba-location-marker__glow" aria-hidden />
                <span className="merhaba-location-marker__dot" aria-hidden>
                  <span className="merhaba-location-marker__core" aria-hidden />
                </span>
              </span>
            </div>
          </div>
        ) : null}

        {showGermanyClusters ? (
          <div className="pointer-events-none absolute inset-0 z-[950]">
            {projectedClusters.map(({ cluster, point }) => {
              const active = activeGermanyClusterSlug === cluster.slug;
              const markup = getGermanyCityClusterMarkup(cluster, active);
              const dimensions = getGermanyClusterIconDimensions(cluster);
              return (
                <button
                  key={cluster.slug}
                  type="button"
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    setActiveGermanyClusterSlug(cluster.slug);
                  }}
                  className={cn(
                    "pointer-events-auto absolute -translate-x-1/2 -translate-y-1/2 border-0 bg-transparent p-0 transition-[transform,z-index] duration-150 hover:z-[1100] hover:scale-[1.02]",
                    active ? "z-[1101]" : "z-[951]",
                  )}
                  style={{
                    left: point.x,
                    top: point.y,
                    width: dimensions.width,
                    height: dimensions.height,
                  }}
                  aria-label={cluster.label}
                >
                  <span dangerouslySetInnerHTML={{ __html: markup }} />
                </button>
              );
            })}
          </div>
        ) : (
          <div className="pointer-events-none absolute inset-0 z-[980]">
            {renderableCityItems.map((item) => {
              if (item.type === "cluster") {
                const clusterKey = cityClusterKey(item);
                return (
                  <button
                    key={clusterKey}
                    type="button"
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      onHoverChange(null);
                      onSelectChange(null);
                      if (shouldSpiderfyCityCluster(item, renderZoom)) {
                        setSpiderfiedCityClusterKey((current) =>
                          current === clusterKey ? null : clusterKey,
                        );
                        return;
                      }
                      setSpiderfiedCityClusterKey(null);
                      const map = mapRef.current;
                      if (!map) {
                        return;
                      }
                      const currentZoom = map.getZoom() ?? 12;
                      const nextZoom = item.kind === "event" ? currentZoom + 2 : currentZoom + 1;
                      map.setView(
                        [item.latitude, item.longitude],
                        Math.min(nextZoom, 15),
                        { animate: false },
                      );
                    }}
                    className="pointer-events-auto absolute z-[982] border-0 bg-transparent p-0 transition-transform duration-150 hover:scale-[1.03]"
                    style={{
                      left: item.screen.x,
                      top: item.screen.y,
                      transform: item.kind === "place" ? "translate(-50%, -100%)" : "translate(-50%, -50%)",
                    }}
                    aria-label={`${item.count} ${item.kind === "place" ? legendPlaces : legendEvents}`}
                  >
                    <span
                      dangerouslySetInnerHTML={{
                        __html: getCityClusterMarkup(item.kind, item.count, spiderfiedCityClusterKey === clusterKey),
                      }}
                    />
                  </button>
                );
              }

              const active = selectedId === item.point.id;
              const isPlace = item.point.kind === "place";
              const isSpiderfied = "spiderfied" in item && item.spiderfied;
              return (
                <div
                  key={item.point.id}
                  className="pointer-events-none absolute z-[981]"
                  style={{
                    left: item.screen.x,
                    top: item.screen.y,
                  }}
                >
                  {isSpiderfied ? (
                    <span
                      className="absolute left-0 top-0 block origin-top-left bg-slate-300/75"
                      style={{
                        width: 1,
                        height: 34,
                        transform: `rotate(${("angle" in item ? item.angle : 0) + Math.PI / 2}rad)`,
                      }}
                      aria-hidden
                    />
                  ) : null}
                  <button
                    type="button"
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      setSpiderfiedCityClusterKey(null);
                      onSelectChange(item.point.id);
                    }}
                    onMouseEnter={() => onHoverChange(item.point.id)}
                    onMouseLeave={() => onHoverChange(null)}
                    className="pointer-events-auto absolute left-0 top-0 border-0 bg-transparent p-0"
                    style={{
                      transform: isPlace ? "translate(-50%, -100%)" : "translate(-50%, -50%)",
                    }}
                    aria-label={item.point.label}
                  >
                    <span dangerouslySetInnerHTML={{ __html: getMarkerMarkup(item.point.kind, active) }} />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {points.length === 0 && !showGermanyClusters ? (
          <div className="pointer-events-none absolute inset-x-6 bottom-6 rounded-2xl bg-white/94 px-4 py-3 text-sm text-muted-foreground shadow-sm">
            {filtered ? noResultsLabel : emptyLabel}
          </div>
        ) : null}

        <div className="pointer-events-none absolute bottom-5 left-5 z-[1120] flex max-w-[min(100%-2.5rem,20rem)] flex-wrap items-center gap-3 rounded-2xl border border-slate-200/90 bg-white/95 px-3 py-2.5 text-xs font-medium text-slate-700 shadow-lg backdrop-blur-md">
          <div className="flex items-center gap-2">
            <span
              className="box-border flex size-5 shrink-0 items-center justify-center overflow-visible"
              aria-hidden
            >
              <svg width="20" height="20" viewBox="0 0 46 56" fill="none" className="shrink-0">
                <path
                  d="M23 4C13.6 4 6 11.5 6 20.8c0 12.5 13.8 25.4 16 27.2.6.6 1.6.6 2.2 0C26.2 46.2 40 33.3 40 20.8 40 11.5 32.4 4 23 4Z"
                  fill="#e30a17"
                  stroke="#fff"
                  strokeWidth="3"
                />
                <circle cx="23" cy="21" r="6" fill="#fff" />
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
              <svg width="20" height="20" viewBox="0 0 46 46" fill="none" className="shrink-0">
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
        {showGermanyClusters && activeGermanyCluster ? (
          <div
            className="pointer-events-none absolute z-[1200]"
            style={{
              left: germanyClusterPopupPosition.left,
              top: germanyClusterPopupPosition.top,
              width: germanyClusterPopupPosition.width,
            }}
          >
            <div ref={germanyPopupRef} className="pointer-events-auto">
              <GermanyClusterMapCard
                cluster={activeGermanyCluster}
                legendPlaces={legendPlaces}
                legendEvents={legendEvents}
                revealLabel={germanyClusterRevealLabel ?? ""}
                onOpenCity={() => onGermanyCityClusterClick?.(activeGermanyCluster.slug)}
                onClose={() => setActiveGermanyClusterSlug(null)}
              />
            </div>
          </div>
        ) : null}

        {!showGermanyClusters && selectedPoint ? (
          <div
            className="pointer-events-none absolute z-[1200]"
            style={{
              left: pointPopupPosition.left,
              top: pointPopupPosition.top,
              width: pointPopupPosition.width,
            }}
          >
            <div ref={pointPopupRef} className="pointer-events-auto relative">
              <span
                aria-hidden
                className="absolute h-4 w-4 rotate-45 border border-slate-200/80 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.08)]"
                style={{
                  left: (pointPopupPosition.arrowLeft ?? pointPopupPosition.width / 2) - 8,
                  [pointPopupPosition.placement === "above" ? "bottom" : "top"]: -7,
                }}
              />
              <MapEntityCard
                point={selectedPoint}
                ctaLabel={selectedPoint.kind === "place" ? viewPlaceLabel : viewEventLabel}
                placeRatingUnavailableAria={placePopupRatingUnavailableAria}
                onClose={() => onSelectChange(null)}
              />
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
