import type { Localized } from "./types";

/** WGS84 coordinates, shared by every country pack and every map renderer. */
export type GeoPoint = { latitude: number; longitude: number };

/** Reusable map icon categories, independent of country or landmark identity. */
export type LandmarkKind =
  | "monument"
  | "museum"
  | "tower"
  | "church"
  | "park"
  | "bridge"
  | "waterfront"
  | "building"
  | "art";

export type Landmark = {
  id: string;
  kind?: LandmarkKind;
  name: Localized;
  description: Localized;
  coordinate: GeoPoint;
  sourceUrl: string;
  coordinateSourceUrl?: string;
};

export type RouteStop = {
  name: string;
  coordinate: GeoPoint;
  landmarks?: Landmark[];
  /** Link to the geographic feature used to position this stop. */
  sourceUrl?: string;
};

/** Geography is authored once; typing targets are derived from its destinations. */
export function routeNames(route: RouteStop[]) {
  if (route.length < 2)
    throw new Error("A journey needs an origin and a destination.");
  for (const stop of route) {
    const { latitude, longitude } = stop.coordinate;
    if (
      !stop.name.trim() ||
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude) ||
      Math.abs(latitude) > 85.051129 ||
      Math.abs(longitude) > 180
    ) {
      throw new Error(`Invalid route stop: ${stop.name}`);
    }
  }
  return {
    origin: route[0].name,
    stations: route.slice(1).map((stop) => stop.name),
  };
}
