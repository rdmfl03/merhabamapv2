"use client";

import { useEffect, useMemo } from "react";
import L, { type DivIcon, type LatLngBoundsExpression, type LatLngExpression } from "leaflet";
import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  ZoomControl,
  useMap,
} from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";

import { Link } from "@/i18n/navigation";
import type { CityMapPoint } from "@/components/cities/city-discovery-map-types";

type CityDiscoveryLeafletMapProps = {
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

const DEFAULT_CENTER: LatLngExpression = [51.1657, 10.4515];
const SMALL_DATASET_CLUSTER_THRESHOLD = 8;

function createMarkerIcon(kind: "place" | "event", active: boolean): DivIcon {
  if (kind === "event") {
    return L.divIcon({
      className: "",
      html: `<span style="
        display:flex;
        align-items:center;
        justify-content:center;
        width:${active ? 24 : 20}px;
        height:${active ? 24 : 20}px;
        background:#111827;
        border:2px solid #ffffff;
        border-radius:6px;
        transform:rotate(45deg);
        box-shadow:0 10px 24px rgba(17,24,39,0.18),0 0 0 ${active ? 8 : 6}px rgba(17,24,39,0.12);
      "><span style="
        width:7px;
        height:7px;
        background:#ffffff;
        border-radius:999px;
        transform:rotate(-45deg);
      "></span></span>`,
      iconSize: [active ? 24 : 20, active ? 24 : 20],
      iconAnchor: [active ? 12 : 10, active ? 12 : 10],
    });
  }

  return L.divIcon({
    className: "",
    html: `<span style="
      position:relative;
      display:block;
      width:${active ? 22 : 18}px;
      height:${active ? 22 : 18}px;
      background:#e30a17;
      border:2px solid #ffffff;
      border-radius:999px;
      box-shadow:0 10px 24px rgba(227,10,23,0.18),0 0 0 ${active ? 8 : 6}px rgba(227,10,23,0.16);
    "><span style="
      position:absolute;
      inset:5px;
      background:#ffffff;
      border-radius:999px;
    "></span></span>`,
    iconSize: [active ? 22 : 18, active ? 22 : 18],
    iconAnchor: [active ? 11 : 9, active ? 11 : 9],
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
}: {
  points: CityMapPoint[];
  cityCenter: { latitude: number; longitude: number } | null;
  userLocation: { latitude: number; longitude: number } | null;
}) {
  const map = useMap();

  const bounds = useMemo<LatLngBoundsExpression | null>(() => {
    const coords = points.map(
      (point) => [point.latitude, point.longitude] as [number, number],
    );

    if (userLocation) {
      coords.push([userLocation.latitude, userLocation.longitude]);
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
  }, [cityCenter, points, userLocation]);

  useEffect(() => {
    if (!bounds) {
      map.setView(DEFAULT_CENTER, 6, { animate: false });
      return;
    }

    map.fitBounds(bounds, {
      padding: [40, 40],
      maxZoom: 14,
      animate: false,
    });
  }, [bounds, map]);

  return null;
}

function PanToActive({
  points,
  activeId,
}: {
  points: CityMapPoint[];
  activeId: string | null;
}) {
  const map = useMap();

  useEffect(() => {
    if (!activeId) {
      return;
    }

    const point = points.find((entry) => entry.id === activeId);

    if (!point) {
      return;
    }

    map.panTo([point.latitude, point.longitude], {
      animate: true,
      duration: 0.35,
    });
  }, [activeId, map, points]);

  return null;
}

export function CityDiscoveryLeafletMap({
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
}: CityDiscoveryLeafletMapProps) {
  const shouldCluster = points.length > SMALL_DATASET_CLUSTER_THRESHOLD;

  return (
    <div className="relative h-[36rem] overflow-hidden rounded-[1.9rem] border border-border/70 bg-[#f5f6f8] lg:h-[42rem]">
      <MapContainer
        center={DEFAULT_CENTER}
        zoom={6}
        zoomControl={false}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ZoomControl position="bottomright" />
        <FitToMarkers points={points} cityCenter={cityCenter} userLocation={userLocation} />
        <PanToActive points={points} activeId={selectedId} />

        {shouldCluster ? (
          <MarkerClusterGroup
            chunkedLoading
            showCoverageOnHover={false}
            spiderfyOnMaxZoom
            maxClusterRadius={48}
          >
            {points.map((point) => (
              <Marker
                key={point.id}
                position={[point.latitude, point.longitude]}
                icon={createMarkerIcon(point.kind, activeId === point.id)}
                eventHandlers={{
                  mouseover: () => onHoverChange(point.id),
                  click: () => onSelectChange(point.id),
                  mouseout: () => onHoverChange(null),
                }}
              >
                <Popup>
                  <div className="space-y-1.5 min-w-[12rem]">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#e30a17]">
                      {point.categoryLabel}
                    </p>
                    <h4 className="text-sm font-semibold text-slate-900">{point.label}</h4>
                    <p className="text-xs font-medium text-slate-500">{point.meta}</p>
                    <p className="text-xs leading-5 text-slate-600">
                      {point.description || point.meta}
                    </p>
                    <Link
                      href={point.href}
                      className="inline-block rounded-full bg-[#e30a17] px-3 py-1.5 text-xs font-semibold"
                      style={{ color: "#ffffff", textDecoration: "none" }}
                    >
                      {point.kind === "place" ? viewPlaceLabel : viewEventLabel}
                    </Link>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MarkerClusterGroup>
        ) : (
          <>
            {points.map((point) => (
              <Marker
                key={point.id}
                position={[point.latitude, point.longitude]}
                icon={createMarkerIcon(point.kind, activeId === point.id)}
                eventHandlers={{
                  mouseover: () => onHoverChange(point.id),
                  click: () => onSelectChange(point.id),
                  mouseout: () => onHoverChange(null),
                }}
              >
                <Popup>
                  <div className="space-y-1.5 min-w-[12rem]">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#e30a17]">
                      {point.categoryLabel}
                    </p>
                    <h4 className="text-sm font-semibold text-slate-900">{point.label}</h4>
                    <p className="text-xs font-medium text-slate-500">{point.meta}</p>
                    <p className="text-xs leading-5 text-slate-600">
                      {point.description || point.meta}
                    </p>
                    <Link
                      href={point.href}
                      className="inline-block rounded-full bg-[#e30a17] px-3 py-1.5 text-xs font-semibold"
                      style={{ color: "#ffffff", textDecoration: "none" }}
                    >
                      {point.kind === "place" ? viewPlaceLabel : viewEventLabel}
                    </Link>
                  </div>
                </Popup>
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

      {points.length === 0 ? (
        <div className="pointer-events-none absolute inset-x-6 bottom-6 rounded-2xl bg-white/94 px-4 py-3 text-sm text-muted-foreground shadow-sm">
          {filtered ? noResultsLabel : emptyLabel}
        </div>
      ) : null}

      <div className="pointer-events-none absolute left-5 top-5 flex flex-wrap items-center gap-2">
        <span className="rounded-full border border-border/80 bg-white/94 px-3 py-1.5 text-xs font-semibold text-foreground shadow-sm">
          OSM
        </span>
        <span className="rounded-full border border-border/80 bg-white/94 px-3 py-1.5 text-xs text-muted-foreground shadow-sm">
          {points.length} {resultsSummaryUnitLabel}
        </span>
      </div>

      <div className="pointer-events-none absolute bottom-5 left-5 flex items-center gap-4 rounded-full border border-border/80 bg-white/94 px-4 py-2 text-xs text-muted-foreground shadow-sm">
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-brand" />
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
