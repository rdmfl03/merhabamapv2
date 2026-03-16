import { DetailLocationMap } from "@/components/maps/detail-location-map";

type EventMapPreviewProps = {
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

export function EventMapPreview(props: EventMapPreviewProps) {
  return <DetailLocationMap {...props} />;
}
