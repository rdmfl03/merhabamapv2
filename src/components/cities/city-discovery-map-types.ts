export type MapViewportBounds = {
  south: number;
  west: number;
  north: number;
  east: number;
};

export type CityMapPoint = {
  id: string;
  kind: "place" | "event";
  label: string;
  href: string;
  description: string;
  latitude: number;
  longitude: number;
  categoryLabel: string;
  meta: string;
};
