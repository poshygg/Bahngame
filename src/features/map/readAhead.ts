import type { Stage } from "../../data/stages";
import { toViewport, type MapViewport, type PixelPoint } from "./projection";

export type StationPreview = {
  routeIndex: number;
  name: string;
  point?: PixelPoint;
  offscreenArrow?: string;
};

export function typingRoutePosition(
  stationIndex: number,
  fraction: number,
  originPending = false,
) {
  return originPending
    ? 0
    : stationIndex +
        (Number.isFinite(fraction) ? Math.max(0, Math.min(1, fraction)) : 0);
}

/** Read-ahead follows the typing cursor, independently of the animated train. */
export function stationLookahead(
  stage: Stage,
  stationIndex: number,
  viewport?: MapViewport | null,
  originPending = false,
) {
  const destination = (index: number): StationPreview | undefined => {
    const name = index === -1 ? stage.origin : stage.stations[index];
    if (name === undefined) return undefined;
    const stop = stage.route[index + 1];
    const point =
      stop && viewport ? toViewport(stop.coordinate, viewport) : undefined;
    let offscreenArrow: string | undefined;
    if (
      point &&
      viewport &&
      (point.x < 0 ||
        point.y < 0 ||
        point.x > viewport.width ||
        point.y > viewport.height)
    ) {
      const angle = Math.atan2(
        point.y - viewport.height / 2,
        point.x - viewport.width / 2,
      );
      const direction = ((Math.round(angle / (Math.PI / 4)) % 8) + 8) % 8;
      offscreenArrow = ["→", "↘", "↓", "↙", "←", "↖", "↑", "↗"][direction];
    }
    return { routeIndex: index + 1, name, point, offscreenArrow };
  };
  const index = originPending ? -1 : Math.max(0, Math.floor(stationIndex));
  return { current: destination(index), following: destination(index + 1) };
}
