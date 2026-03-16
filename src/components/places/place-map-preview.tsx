import { DetailLocationMap } from "@/components/maps/detail-location-map";

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

export function PlaceMapPreview(props: PlaceMapPreviewProps) {
  return <DetailLocationMap {...props} />;
}
