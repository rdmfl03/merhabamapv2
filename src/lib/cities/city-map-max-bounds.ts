import type { LatLngBoundsExpression } from "leaflet";

/** Näherungsweise Kilometer pro Grad Breitengrad (mittlere Breite DE). */
const KM_PER_DEG_LAT = 111;

/**
 * Rechteckige Leaflet-maxBounds, die ungefähr einen Kreis mit dem gegebenen Radius (km)
 * um den Mittelpunkt umschließt (für Stadt-Maps, Pan-Begrenzung).
 */
export function maxBoundsFromCenterRadiusKm(
  latitude: number,
  longitude: number,
  radiusKm: number,
): LatLngBoundsExpression {
  const latDelta = radiusKm / KM_PER_DEG_LAT;
  const cosLat = Math.cos((latitude * Math.PI) / 180);
  const safeCos = Math.max(Math.abs(cosLat), 0.2);
  const lngDelta = radiusKm / (KM_PER_DEG_LAT * safeCos);
  return [
    [latitude - latDelta, longitude - lngDelta],
    [latitude + latDelta, longitude + lngDelta],
  ];
}

/** Pan-/Zoom-Rahmen für einzelne Städte: typischer Großstadt-Umland-Radius. */
export const CITY_DISCOVERY_MAP_RADIUS_KM = 42;

/** Nicht weiter als „Stadt-Region“ herauszoomen (Deutschland-Übersicht bleibt bei globalem minZoom). */
export const CITY_DISCOVERY_MAP_MIN_ZOOM = 10;
