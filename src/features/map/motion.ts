import type { PixelPoint, MapViewport } from "./projection";

export type RoutePath = {
  points: PixelPoint[];
  lengths: number[];
  cumulative: number[];
  total: number;
};
export type JourneyMotion = {
  position: number;
  dwellMs: number;
  arrivedAt: number;
};
export const initialMotion = (): JourneyMotion => ({
  position: 0,
  dwellMs: 0,
  arrivedAt: 0,
});

export function createRoutePath(points: PixelPoint[]): RoutePath {
  const lengths = points
    .slice(1)
    .map((point, index) =>
      Math.hypot(point.x - points[index].x, point.y - points[index].y),
    );
  const cumulative = [0];
  for (const length of lengths)
    cumulative.push(cumulative[cumulative.length - 1] + length);
  return {
    points,
    lengths,
    cumulative,
    total: cumulative[cumulative.length - 1],
  };
}

export function distanceAt(path: RoutePath, position: number): number {
  if (!path.lengths.length) return 0;
  const bounded = Math.max(0, Math.min(path.lengths.length, position));
  const segment = Math.min(path.lengths.length - 1, Math.floor(bounded));
  return path.cumulative[segment] + (bounded - segment) * path.lengths[segment];
}

/** Cars are sampled along the polyline independently, so they follow its bends. */
export function samplePath(
  path: RoutePath,
  distance: number,
): PixelPoint & { heading: number } {
  if (path.points.length < 2)
    return { ...(path.points[0] ?? { x: 0, y: 0 }), heading: 0 };
  let segment = 0;
  while (
    segment < path.lengths.length - 1 &&
    path.cumulative[segment + 1] < distance
  )
    segment++;
  const from = path.points[segment];
  const to = path.points[segment + 1];
  const length = path.lengths[segment];
  const fraction =
    length > 0 ? (distance - path.cumulative[segment]) / length : 0;
  return {
    x: from.x + (to.x - from.x) * fraction,
    y: from.y + (to.y - from.y) * fraction,
    heading: (Math.atan2(to.y - from.y, to.x - from.x) * 180) / Math.PI,
  };
}

export function sampleTrainPose(
  path: RoutePath,
  distance: number,
  wheelbase = 32,
) {
  const position = samplePath(path, distance);
  const back = samplePath(path, distance - wheelbase / 2);
  const front = samplePath(path, distance + wheelbase / 2);
  return {
    ...position,
    heading: (Math.atan2(front.y - back.y, front.x - back.x) * 180) / Math.PI,
  };
}

/** One step can reach one station, but can never skip a route vertex. */
export function advanceMotion(
  state: JourneyMotion,
  targetPosition: number,
  path: RoutePath,
  elapsedMs: number,
): JourneyMotion {
  const dt = Math.max(0, Math.min(50, elapsedMs));
  const target = Math.max(
    state.position,
    Math.min(path.lengths.length, targetPosition),
  );
  if (state.dwellMs > 0)
    return { ...state, dwellMs: Math.max(0, state.dwellMs - dt) };
  if (state.position >= target || !path.lengths.length) return state;
  const segment = Math.min(
    path.lengths.length - 1,
    Math.floor(state.position + 1e-9),
  );
  const boundary = segment + 1;
  const distance = distanceAt(path, state.position);
  const lag = distanceAt(path, target) - distance;
  const speed = Math.max(180, lag * 8);
  const advance =
    path.lengths[segment] > 0 ? (speed * dt) / 1000 / path.lengths[segment] : 1;
  const position = Math.min(target, boundary, state.position + advance);
  if (position >= boundary) {
    const backlog = target - boundary;
    return {
      position: boundary,
      arrivedAt: boundary,
      dwellMs: boundary === path.lengths.length ? 360 : backlog > 1 ? 45 : 260,
    };
  }
  return { ...state, position };
}

/** Continuous dead-zone following: station index never changes the camera. */
export function followViewport(
  start: PixelPoint,
  train: PixelPoint,
  width: number,
  height: number,
  zoom: number,
): MapViewport {
  const initialLeft = start.x - width * 0.35;
  const initialTop = start.y - height * 0.5;
  return {
    width,
    height,
    zoom,
    left: Math.min(
      Math.max(initialLeft, train.x - width * 0.64),
      train.x - width * 0.34,
    ),
    top: Math.min(
      Math.max(initialTop, train.y - height * 0.6),
      train.y - height * 0.36,
    ),
  };
}

export function routeFollowZoom(
  pointsAtZoomZero: PixelPoint[],
  width: number,
  height: number,
): number {
  const lengths = createRoutePath(pointsAtZoomZero)
    .lengths.filter((length) => length > 0)
    .sort((a, b) => a - b);
  const typicalLength = lengths[Math.floor(lengths.length / 2)] ?? 0.001;
  const desiredLength = Math.max(100, Math.min(width * 0.42, height * 0.8));
  return Math.max(
    3,
    Math.min(15, Math.round(Math.log2(desiredLength / typicalLength))),
  );
}
