import type { PixelPoint } from "./projection";

export type MapBox = { x: number; y: number; width: number; height: number };
export type LandmarkCandidate = {
  id: string;
  name: string;
  point: PixelPoint;
  priority: number;
};
export type LandmarkLabel = MapBox &
  LandmarkCandidate & { lines: string[]; minimal?: boolean };

export const boxesOverlap = (a: MapBox, b: MapBox, gap = 5): boolean =>
  a.x < b.x + b.width + gap &&
  a.x + a.width + gap > b.x &&
  a.y < b.y + b.height + gap &&
  a.y + a.height + gap > b.y;

/** Wrap the complete proper name; long landmark names are never ellipsized. */
export function wrapMapText(text: string, maxCharacters: number): string[] {
  const lines: string[] = [];
  let line = "";
  for (const word of text.trim().split(/\s+/)) {
    if (line && line.length + word.length + 1 > maxCharacters) {
      lines.push(line);
      line = "";
    }
    // Keep complete words: a long German compound can use its own wider line.
    line = line ? `${line} ${word}` : word;
  }
  if (line) lines.push(line);
  return lines;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export function findFreeMapBox(
  point: PixelPoint,
  boxWidth: number,
  boxHeight: number,
  bounds: MapBox,
  occupied: MapBox[],
): MapBox | null {
  if (boxWidth > bounds.width || boxHeight > bounds.height) return null;
  const raw = [
    { x: point.x + 19, y: point.y - boxHeight / 2 },
    { x: point.x - boxWidth - 19, y: point.y - boxHeight / 2 },
    { x: point.x - boxWidth / 2, y: point.y - boxHeight - 20 },
    { x: point.x - boxWidth / 2, y: point.y + 20 },
  ];
  // When streets are dense, attach a short leader to the nearest free slot.
  for (let y = bounds.y; y <= bounds.y + bounds.height - boxHeight; y += 20)
    for (let x = bounds.x; x <= bounds.x + bounds.width - boxWidth; x += 24)
      raw.push({ x, y });
  const options = raw.map((position) => ({
    x: clamp(position.x, bounds.x, bounds.x + bounds.width - boxWidth),
    y: clamp(position.y, bounds.y, bounds.y + bounds.height - boxHeight),
    width: boxWidth,
    height: boxHeight,
  }));
  options.sort(
    (a, b) =>
      Math.hypot(a.x + a.width / 2 - point.x, a.y + a.height / 2 - point.y) -
      Math.hypot(b.x + b.width / 2 - point.x, b.y + b.height / 2 - point.y),
  );
  return (
    options.find(
      (box) => !occupied.some((other) => boxesOverlap(box, other)),
    ) ?? null
  );
}

export function placeLandmarkLabels(
  candidates: LandmarkCandidate[],
  width: number,
  height: number,
  occupied: MapBox[],
  {
    mini = false,
    topInset = mini ? 88 : 112,
    bottomInset = 34,
  }: {
    mini?: boolean;
    topInset?: number;
    bottomInset?: number;
  } = {},
): LandmarkLabel[] {
  const bounds = {
    x: 10,
    y: topInset,
    width: width - 20,
    height: height - topInset - bottomInset,
  };
  if (bounds.width < 85 || bounds.height < 44) return [];
  const labels: LandmarkLabel[] = [];
  const limit = mini ? 1 : width < 600 ? 2 : 5;
  const ordered = [...candidates].sort(
    (a, b) => a.priority - b.priority || a.id.localeCompare(b.id),
  );
  for (const candidate of ordered) {
    if (labels.length >= limit) break;
    if (
      candidate.point.x < 0 ||
      candidate.point.x > width ||
      candidate.point.y < 0 ||
      candidate.point.y > height - bottomInset
    )
      continue;
    const longestWord = Math.max(
      ...candidate.name.split(/\s+/).map((word) => word.length),
    );
    const preferred = Math.min(
      bounds.width,
      Math.max(
        138,
        Math.min(232, candidate.name.length * 5.9 + 54),
        longestWord * 6 + 54,
      ),
    );
    for (const labelWidth of [
      ...new Set([
        preferred,
        Math.min(preferred, 180),
        Math.min(preferred, 150),
      ]),
    ]) {
      // Never squeeze a full compound place name into an unreadable column.
      if (longestWord * 5.8 > labelWidth - 50) continue;
      const lines = wrapMapText(
        candidate.name,
        Math.floor((labelWidth - 50) / 6.1),
      );
      const labelHeight = Math.max(44, lines.length * 15 + 14);
      const box = findFreeMapBox(
        candidate.point,
        labelWidth,
        labelHeight,
        bounds,
        [...occupied, ...labels],
      );
      if (box) {
        labels.push({ ...candidate, ...box, lines });
        break;
      }
    }
  }
  if (mini && !labels.length) {
    for (const candidate of ordered) {
      if (
        candidate.point.x < 0 ||
        candidate.point.x > width ||
        candidate.point.y < 0 ||
        candidate.point.y > height - bottomInset
      )
        continue;
      const longest = Math.max(
        ...candidate.name.split(/\s+/).map((word) => word.length),
      );
      const widths = [
        Math.min(bounds.width, Math.max(96, candidate.name.length * 5.4 + 16)),
        Math.min(bounds.width, Math.max(96, longest * 5.4 + 16)),
        bounds.width,
      ];
      for (const labelWidth of widths) {
        const lines = wrapMapText(
          candidate.name,
          Math.floor((labelWidth - 16) / 5.4),
        );
        const box = findFreeMapBox(
          candidate.point,
          labelWidth,
          lines.length * 13 + 8,
          bounds,
          occupied,
        );
        if (box) {
          labels.push({ ...candidate, ...box, lines, minimal: true });
          return labels;
        }
      }
    }
  }
  return labels;
}
