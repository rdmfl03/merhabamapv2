"use client";

import L from "leaflet";
import { ExternalLink } from "lucide-react";
import { MapContainer, Marker, ZoomControl } from "react-leaflet";

import { MerhabaTileLayer } from "@/components/maps/merhaba-tile-layer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MAP_CONFIG } from "@/lib/map-config";

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

export function DetailLocationMap({
  latitude,
  longitude,
  address,
  labels,
}: DetailLocationMapProps) {
  const hasCoordinates = latitude !== null && longitude !== null;
  const mapUrl = hasCoordinates
    ? `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;

  const mapSourceLabel =
    MAP_CONFIG.provider === "maptiler"
      ? "MapTiler / OpenStreetMap"
      : "OpenStreetMap";

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
              <MapContainer
                center={[latitude, longitude]}
                zoom={15}
                zoomControl={false}
                className="h-full w-full"
              >
                <MerhabaTileLayer />
                <ZoomControl position="bottomright" />
                <Marker position={[latitude, longitude]} icon={markerIcon} />
              </MapContainer>
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
        Kartenkacheln: {mapSourceLabel}
      </CardContent>
    </Card>
  );
}
