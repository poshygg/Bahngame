import type { VisibleTile } from "./projection";

/** Keep provider details together when moving to a production tile service. */
export const mapProvider = {
  tileJsonUrl: "https://tiles.openfreemap.org/planet",
  attribution: "OpenFreeMap · © OpenMapTiles · OpenStreetMap",
  attributionUrl: "https://openfreemap.org/",
  policyUrl: "https://openfreemap.org/tos/",
  appUserAgent: "Bahnreise/0.5.0 (com.bahnreise.game)",
} as const;

export function tileUrl(
  tile: Pick<VisibleTile, "z" | "x" | "y">,
  template: string,
): string {
  return template
    .replace("{z}", String(tile.z))
    .replace("{x}", String(tile.x))
    .replace("{y}", String(tile.y));
}
