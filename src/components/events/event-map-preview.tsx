"use client";

import dynamic from "next/dynamic";

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

const DetailLocationMap = dynamic(
  () => import("@/components/maps/detail-location-map").then((mod) => mod.DetailLocationMap),
  { ssr: false },
);

export function EventMapPreview(props: EventMapPreviewProps) {
  return <DetailLocationMap {...props} />;
}
