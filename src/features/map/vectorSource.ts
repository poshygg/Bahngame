import { mapProvider, tileUrl } from "./provider";
import { decodeMapTile, parentTile, type MapShape } from "./vectorStyle";

type Source = { template: string; maxZoom: number };
let source: Promise<Source> | null = null;
const cache = new Map<string, MapShape[]>();
const inFlight = new Map<string, Promise<MapShape[]>>();
const MAX_CACHED_TILES = 48;

async function request<T>(
  url: string,
  read: (response: Response) => Promise<T>,
): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw new Error(`Map request failed: ${response.status}`);
    return await read(response);
  } finally {
    clearTimeout(timeout);
  }
}
function getSource(): Promise<Source> {
  if (!source) {
    source = request(mapProvider.tileJsonUrl, (response) => response.json())
      .then((data) => {
        const template = data.tiles?.[0];
        if (
          typeof template !== "string" ||
          !template.startsWith("https://tiles.openfreemap.org/") ||
          !["{z}", "{x}", "{y}"].every((token) => template.includes(token))
        )
          throw new Error("Invalid map source");
        return {
          template,
          maxZoom: Math.max(0, Math.min(14, Number(data.maxzoom) || 14)),
        };
      })
      .catch((error) => {
        source = null;
        throw error;
      });
  }
  return source;
}
export async function loadMapTile(tile: { z: number; x: number; y: number }) {
  const config = await getSource();
  const parent = parentTile(tile, config.maxZoom);
  const url = tileUrl(parent, config.template);
  let shapes = cache.get(url);
  if (shapes) {
    cache.delete(url);
    cache.set(url, shapes);
  } else {
    let pending = inFlight.get(url);
    if (!pending) {
      pending = request(url, (response) => response.arrayBuffer())
        .then((bytes) => {
          const decoded = decodeMapTile(new Uint8Array(bytes));
          cache.set(url, decoded);
          if (cache.size > MAX_CACHED_TILES)
            cache.delete(cache.keys().next().value!);
          return decoded;
        })
        .finally(() => inFlight.delete(url));
      inFlight.set(url, pending);
    }
    shapes = await pending;
  }
  return { shapes, viewBox: parent.viewBox };
}
