import type { GeoPoint } from "../../data/geography";

export const TILE_SIZE = 256;
const MAX_LATITUDE = 85.05112878;

export type PixelPoint = { x: number; y: number };
export type MapViewport = {
  width: number;
  height: number;
  zoom: number;
  left: number;
  top: number;
};
export type VisibleTile = {
  key: string;
  x: number;
  y: number;
  z: number;
  left: number;
  top: number;
};

/** OSM's slippy-map grid uses spherical Web Mercator, north at the top. */
export function project(point: GeoPoint, zoom: number): PixelPoint {
  const size = TILE_SIZE * 2 ** zoom;
  const latitude = Math.max(
    -MAX_LATITUDE,
    Math.min(MAX_LATITUDE, point.latitude),
  );
  const sin = Math.sin((latitude * Math.PI) / 180);
  return {
    x: ((point.longitude + 180) / 360) * size,
    y: (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * size,
  };
}

export function fitViewport(
  coordinates: GeoPoint[],
  width: number,
  height: number,
  maxZoom = 15,
  zoomOffset = 0,
): MapViewport {
  const points = coordinates.map((point) => project(point, 0));
  const minX = Math.min(...points.map((point) => point.x));
  const maxX = Math.max(...points.map((point) => point.x));
  const minY = Math.min(...points.map((point) => point.y));
  const maxY = Math.max(...points.map((point) => point.y));
  const padding = Math.min(58, Math.min(width, height) / 4);
  const scaleX =
    Math.max(1, width - padding * 2) / Math.max(0.00001, maxX - minX);
  const scaleY =
    Math.max(1, height - padding * 2) / Math.max(0.00001, maxY - minY);
  const zoom = Math.max(
    2,
    Math.min(
      17,
      Math.min(maxZoom, Math.floor(Math.log2(Math.min(scaleX, scaleY)))) +
        zoomOffset,
    ),
  );
  const scale = 2 ** zoom;
  return {
    width,
    height,
    zoom,
    left: ((minX + maxX) / 2) * scale - width / 2,
    top: ((minY + maxY) / 2) * scale - height / 2,
  };
}

export function toViewport(point: GeoPoint, viewport: MapViewport): PixelPoint {
  const pixel = project(point, viewport.zoom);
  return { x: pixel.x - viewport.left, y: pixel.y - viewport.top };
}

/** Only tiles intersecting the screen; there is deliberately no prefetch ring. */
export function visibleTiles(viewport: MapViewport): VisibleTile[] {
  const count = 2 ** viewport.zoom;
  const firstX = Math.floor(viewport.left / TILE_SIZE);
  const lastX = Math.ceil((viewport.left + viewport.width) / TILE_SIZE) - 1;
  const firstY = Math.max(0, Math.floor(viewport.top / TILE_SIZE));
  const lastY = Math.min(
    count - 1,
    Math.ceil((viewport.top + viewport.height) / TILE_SIZE) - 1,
  );
  const tiles: VisibleTile[] = [];
  for (let x = firstX; x <= lastX; x++) {
    for (let y = firstY; y <= lastY; y++) {
      const wrappedX = ((x % count) + count) % count;
      tiles.push({
        key: `${viewport.zoom}/${wrappedX}/${y}`,
        x: wrappedX,
        y,
        z: viewport.zoom,
        left: x * TILE_SIZE - viewport.left,
        top: y * TILE_SIZE - viewport.top,
      });
    }
  }
  return tiles;
}

export function interpolate(
  from: PixelPoint,
  to: PixelPoint,
  progress: number,
): PixelPoint {
  const fraction = Math.max(
    0,
    Math.min(1, Number.isFinite(progress) ? progress : 0),
  );
  return {
    x: from.x + (to.x - from.x) * fraction,
    y: from.y + (to.y - from.y) * fraction,
  };
}
