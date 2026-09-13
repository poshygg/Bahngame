import { VectorTile } from "@mapbox/vector-tile";
import { PbfReader } from "pbf";

export const calmMapPalette = {
  ground: "#F3F4EE",
  park: "#DEE6D7",
  water: "#C8DDE1",
  road: "#D6DAD3",
  majorRoad: "#FFFFFF",
  rail: "#ACB6AF",
} as const;
export type MapShape = {
  d: string;
  fill: string;
  stroke?: string;
  width?: number;
};
type Properties = Record<string, string | number | boolean>;

/** An original, deliberately quiet style over real OpenMapTiles geometry. */
export function styleFeature(
  layer: string,
  properties: Properties,
  type: number,
) {
  const kind = String(properties.class ?? "");
  if (type === 3 && layer === "water") return { fill: calmMapPalette.water };
  if (
    type === 3 &&
    (layer === "park" ||
      (layer === "landcover" && ["wood", "grass"].includes(kind)))
  )
    return { fill: calmMapPalette.park };
  if (type === 2 && layer === "waterway")
    return { fill: "none", stroke: calmMapPalette.water, width: 1.5 };
  if (type === 2 && layer === "transportation") {
    if (["rail", "transit"].includes(kind))
      return { fill: "none", stroke: calmMapPalette.rail, width: 1 };
    if (["motorway", "trunk", "primary", "secondary"].includes(kind))
      return { fill: "none", stroke: calmMapPalette.majorRoad, width: 3 };
    if (["tertiary", "minor"].includes(kind))
      return { fill: "none", stroke: calmMapPalette.road, width: 0.9 };
  }
  // Buildings, address labels, retail POIs and service paths obscure the game.
  return null;
}

export function decodeMapTile(bytes: Uint8Array): MapShape[] {
  const tile = new VectorTile(new PbfReader(bytes));
  const shapes: MapShape[] = [];
  for (const layerName of [
    "landcover",
    "park",
    "water",
    "waterway",
    "transportation",
  ]) {
    const layer = tile.layers[layerName];
    if (!layer) continue;
    for (let index = 0; index < layer.length; index++) {
      const feature = layer.feature(index);
      const style = styleFeature(layerName, feature.properties, feature.type);
      if (!style) continue;
      const scale = 256 / feature.extent;
      const d = feature
        .loadGeometry()
        .map((ring) => {
          if (!ring.length) return "";
          return (
            ring
              .map(
                (point, i) =>
                  `${i ? "L" : "M"}${(point.x * scale).toFixed(2)},${(point.y * scale).toFixed(2)}`,
              )
              .join("") + (feature.type === 3 ? "Z" : "")
          );
        })
        .join("");
      if (d) shapes.push({ d, ...style });
    }
  }
  return shapes;
}

/** Viewports above provider maxzoom use the correct quadrant of a parent tile. */
export function parentTile(
  tile: { z: number; x: number; y: number },
  maxZoom: number,
) {
  const z = Math.min(tile.z, maxZoom);
  const factor = 2 ** (tile.z - z);
  const size = 256 / factor;
  return {
    z,
    x: Math.floor(tile.x / factor),
    y: Math.floor(tile.y / factor),
    viewBox: `${(tile.x % factor) * size} ${(tile.y % factor) * size} ${size} ${size}`,
  };
}
