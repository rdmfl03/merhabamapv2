import { ExternalLink, MapPin } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type PlaceMapPreviewProps = {
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

export function PlaceMapPreview({
  latitude,
  longitude,
  address,
  labels,
}: PlaceMapPreviewProps) {
  const hasCoordinates = latitude !== null && longitude !== null;
  const mapUrl = hasCoordinates
    ? `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=17/${latitude}/${longitude}`
    : `https://www.openstreetmap.org/search?query=${encodeURIComponent(address)}`;

  return (
    <Card className="overflow-hidden">
      <div className="flex min-h-64 items-center justify-center bg-brand-soft">
        <div className="space-y-3 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white text-brand shadow-soft">
            <MapPin className="h-6 w-6" />
          </div>
          <div>
            <p className="font-semibold text-foreground">{labels.title}</p>
            <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
              {hasCoordinates ? labels.description : labels.unavailable}
            </p>
          </div>
          <Button variant="outline" asChild>
            <a href={mapUrl} target="_blank" rel="noreferrer">
              {labels.openMap}
              <ExternalLink className="ml-2 h-4 w-4" />
            </a>
          </Button>
        </div>
      </div>
      <CardContent className="border-t border-border bg-white text-sm text-muted-foreground">
        {address}
      </CardContent>
    </Card>
  );
}
