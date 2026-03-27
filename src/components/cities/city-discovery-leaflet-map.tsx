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
  const placePoints = points.filter((point) => point.kind === "place");
  const eventPoints = points.filter((point) => point.kind === "event");
  const shouldClusterPlaces = placePoints.length > 1;
  const shouldClusterEvents = eventPoints.length > 1;

  return (
    <div className="relative isolate z-0 h-[36rem] overflow-hidden rounded-[1.9rem] border border-border/70 bg-[#f5f6f8] lg:h-[42rem]">
      <MapContainer
        center={DEFAULT_CENTER}
        zoom={6}
        zoomControl={false}
        className="relative z-0 h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ZoomControl position="bottomright" />
        <FitToMarkers points={points} cityCenter={cityCenter} userLocation={userLocation} />
        <PanToActive points={points} activeId={selectedId} />
        <PanToUserLocation userLocation={userLocation} />

        {shouldClusterPlaces ? (
          <MarkerClusterGroup
            chunkedLoading
            showCoverageOnHover={false}
            spiderfyOnMaxZoom
            maxClusterRadius={48}
            iconCreateFunction={(cluster: { getChildCount(): number }) =>
              createClusterIcon("place", cluster.getChildCount())
            }
          >
            {placePoints.map((point) => (
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
                      {viewPlaceLabel}
                    </Link>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MarkerClusterGroup>
        ) : (
          <>
            {placePoints.map((point) => (
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
                      {viewPlaceLabel}
                    </Link>
                  </div>
                </Popup>
              </Marker>
            ))}
          </>
        )}

        {shouldClusterEvents ? (
          <MarkerClusterGroup
            chunkedLoading
            showCoverageOnHover={false}
            spiderfyOnMaxZoom
            maxClusterRadius={48}
            iconCreateFunction={(cluster: { getChildCount(): number }) =>
              createClusterIcon("event", cluster.getChildCount())
            }
          >
            {eventPoints.map((point) => (
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
                      {viewEventLabel}
                    </Link>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MarkerClusterGroup>
        ) : (
          <>
            {eventPoints.map((point) => (
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
                      {viewEventLabel}
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

      <div className="pointer-events-none absolute left-5 top-5 z-20 flex flex-wrap items-center gap-2">
        <span className="rounded-full border border-border/80 bg-white/94 px-3 py-1.5 text-xs font-semibold text-foreground shadow-sm">
          OSM
        </span>
        <span className="rounded-full border border-border/80 bg-white/94 px-3 py-1.5 text-xs text-muted-foreground shadow-sm">
          {points.length} {resultsSummaryUnitLabel}
        </span>
      </div>

      <div className="pointer-events-none absolute bottom-5 left-5 z-20 flex items-center gap-4 rounded-full border border-slate-200 bg-white/98 px-4 py-2 text-xs text-slate-700 shadow-lg backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <svg
            aria-hidden="true"
            width="12"
            height="14"
            viewBox="0 0 46 56"
            className="shrink-0"
          >
            <path
              d="M23 4C13.6 4 6 11.5 6 20.8c0 12.5 13.8 25.4 16 27.2.6.6 1.6.6 2.2 0C26.2 46.2 40 33.3 40 20.8 40 11.5 32.4 4 23 4Z"
              fill="#e30a17"
            />
          </svg>
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
