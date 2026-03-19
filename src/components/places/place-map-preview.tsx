"use client";

import dynamic from "next/dynamic";

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

const DetailLocationMap = dynamic(
  () => import("@/components/maps/detail-location-map").then((mod) => mod.DetailLocationMap),
  { ssr: false },
);

export function PlaceMapPreview(props: PlaceMapPreviewProps) {
  return <DetailLocationMap {...props} />;
}
