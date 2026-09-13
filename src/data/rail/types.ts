import type { GeoPoint } from "../geography";
import type { Localized } from "../types";

export type RailServiceKind =
  | "ICE"
  | "IC"
  | "EC"
  | "RE"
  | "RB"
  | "S"
  | "U"
  | "tram"
  | "rail";

export type RailStation = {
  id: string;
  name: string;
  coordinate: GeoPoint;
  sourceUrl: string;
  /** Objects grouped by an actual OSM stop area, not geographic proximity. */
  osmIds: string[];
  aliases?: string[];
  stateId?: string;
  cityId?: string;
};

/** One source-mapped direction/variant. Only consecutive stationIds form edges. */
export type RailLine = {
  id: string;
  stateIds: string[];
  cityIds: string[];
  ref: string;
  service: RailServiceKind;
  operator?: string;
  network?: string;
  from: string;
  to: string;
  stationIds: string[];
  /** Source relation member that introduced each canonical stop, in order. */
  sourceStopIds?: string[];
  sourceUrl: string;
  checkedAt: string;
  bidirectional: boolean;
  dbOperator?: boolean;
  officialSourceUrl?: string;
};

export type RailState = { id: string; name: Localized };
export type RailCity = {
  id: string;
  stateId: string;
  name: Localized;
  coordinate: GeoPoint;
};

export type RailCatalog = {
  stations: RailStation[];
  lines: RailLine[];
  states: RailState[];
  cities: RailCity[];
  checkedAt: string;
  sourceTimestamp?: string;
  license: { name: string; url: string; attribution: string; sourceUrl: string };
};
