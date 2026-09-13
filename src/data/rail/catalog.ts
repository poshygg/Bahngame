import type { RailCatalog } from "./types";
import snapshot from "./catalog.generated.json";

// Generated and validated by build-catalog.mjs; the game makes no Overpass calls.
export const RAIL_CATALOG = snapshot as RailCatalog;

export const RAIL_STATIONS = RAIL_CATALOG.stations;
export const RAIL_LINES = RAIL_CATALOG.lines;
export type { RailCatalog, RailCity, RailLine, RailStation, RailState } from "./types";
