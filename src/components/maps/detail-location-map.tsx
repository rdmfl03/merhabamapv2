"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import { ExternalLink } from "lucide-react";
import mapboxgl, { type Map as MapboxMap } from "mapbox-gl";
import { MapContainer, Marker, TileLayer, ZoomControl } from "react-leaflet";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type DetailLocationMapProps = {
  latitude: number | null;
  longitude: number | null;
  address: string;
  labels: {
    title: string;
    description: string;
    openMap: string;
    unavailable: string;
  };
};

const markerIcon = L.divIcon({
  className: "",
  html: `<span style="
    position:relative;
    display:block;
    width:20px;
    height:20px;
    background:#e30a17;
    border:2px solid #ffffff;
    border-radius:999px;
    box-shadow:0 10px 24px rgba(227,10,23,0.18),0 0 0 7px rgba(227,10,23,0.14);
  "><span style="
    position:absolute;
    inset:5px;
    background:#ffffff;
    border-radius:999px;
  "></span></span>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

const defaultCenter: [number, number] = [51.1657, 10.4515];

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
      // ignore non-writable symbol layers
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

        if (layerId.includes("building") || layerId.includes("settlement")) {
          map.setPaintProperty(layer.id, "fill-color", "#f1f3f5");
          map.setPaintProperty(layer.id, "fill-opacity", 0.7);
        }
      }

      if (layer.type === "line") {
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

        if (layerId.includes("water")) {
          map.setPaintProperty(layer.id, "line-color", "#d5dae1");
          continue;
        }

        if (layerId.includes("boundary") || layerId.includes("admin")) {
          map.setPaintProperty(layer.id, "line-color", "#c5cbd3");
        }
      }
    } catch {
      // ignore non-writable layers
    }
  }
}

function DetailLocationMapbox({
  latitude,
  longitude,
}: {
  latitude: number;
  longitude: number;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapboxMap | null>(null);
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  useEffect(() => {
    if (!containerRef.current || !token || mapRef.current) {
      return;
    }

    mapboxgl.accessToken = token;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: [longitude, latitude],
      zoom: 14.8,
      attributionControl: false,
    });

    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "bottom-right");
    map.addControl(new mapboxgl.AttributionControl({ compact: true }), "bottom-right");

    map.on("style.load", () => {
      applyGermanLabels(map);
      applyNeutralGrayTheme(map);

      new mapboxgl.Marker({
        color: "#e30a17",
        scale: 1.1,
      })
        .setLngLat([longitude, latitude])
        .addTo(map);
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [latitude, longitude, token]);

  return <div ref={containerRef} className="h-full w-full" />;
}

export function DetailLocationMap({
  latitude,
  longitude,
  address,
  labels,
}: DetailLocationMapProps) {
  const hasCoordinates = latitude !== null && longitude !== null;
  const useMapbox =
    process.env.NEXT_PUBLIC_MAP_PROVIDER === "mapbox" &&
    Boolean(process.env.NEXT_PUBLIC_MAPBOX_TOKEN);
  const mapUrl = hasCoordinates
    ? `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;

  return (
    <Card className="overflow-hidden">
      <div className="space-y-5 bg-white p-6">
        <div>
          <h2 className="font-display text-2xl text-foreground">{labels.title}</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            {hasCoordinates ? labels.description : labels.unavailable}
          </p>
        </div>

        <div className="overflow-hidden rounded-[1.75rem] border border-border/70">
          <div className="h-72 bg-[#f3f4f6] sm:h-80">
            {hasCoordinates ? (
              useMapbox ? (
                <DetailLocationMapbox latitude={latitude} longitude={longitude} />
              ) : (
                <MapContainer
                  center={[latitude, longitude]}
                  zoom={15}
                  zoomControl={false}
                  className="h-full w-full"
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <ZoomControl position="bottomright" />
                  <Marker position={[latitude, longitude]} icon={markerIcon} />
                </MapContainer>
              )
            ) : (
              <div className="flex h-full items-center justify-center px-6 text-center text-sm text-muted-foreground">
                {labels.unavailable}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">{address}</p>
          <Button variant="outline" asChild>
            <a href={mapUrl} target="_blank" rel="noreferrer">
              {labels.openMap}
              <ExternalLink className="ml-2 h-4 w-4" />
            </a>
          </Button>
        </div>
      </div>

      <CardContent className="border-t border-border bg-white text-sm text-muted-foreground">
        {useMapbox ? "Mapbox-Karte" : "OpenStreetMap-Karte"}
      </CardContent>
    </Card>
  );
}
