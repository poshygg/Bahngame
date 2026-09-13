export type LabelPlate = {
  id: number;
  text: string;
  lines: string[];
  x: number;
  y: number;
  width: number;
  height: number;
};
type Box = { x: number; y: number; width: number; height: number };
const overlaps = (a: Box, b: Box) =>
  a.x < b.x + b.width + 5 &&
  a.x + a.width + 5 > b.x &&
  a.y < b.y + b.height + 5 &&
  a.y + a.height + 5 > b.y;

export function placeStationLabels(
  candidates: { id: number; text: string; x: number; y: number }[],
  width: number,
  height: number,
  occupied: Box[],
  insets: { top?: number; bottom?: number } = {},
): LabelPlate[] {
  const labels: LabelPlate[] = [];
  for (const candidate of candidates) {
    const text = candidate.text;
    const plateWidth = Math.min(
      width - 36,
      Math.max(72, text.length * 7.1 + 22),
    );
    const maxCharacters = Math.max(
      6,
      Math.floor((plateWidth - 22) / 7.1 + 1e-9),
    );
    const lines: string[] = [];
    let remaining = text;
    while (remaining.length > maxCharacters) {
      const space = remaining.lastIndexOf(" ", maxCharacters);
      const split = space > maxCharacters / 3 ? space : maxCharacters;
      lines.push(remaining.slice(0, split));
      remaining = remaining.slice(split).replace(/^ /, "");
    }
    if (remaining) lines.push(remaining);
    const plateHeight = Math.max(30, lines.length * 16 + 14);
    const top = insets.top ?? 67;
    const bottom = insets.bottom ?? 55;
    if (height - top - bottom < plateHeight) continue;
    const positions = [
      { x: candidate.x - plateWidth / 2, y: candidate.y - 55 },
      { x: candidate.x - plateWidth / 2, y: candidate.y + 29 },
      { x: candidate.x + 22, y: candidate.y - 16 },
      { x: candidate.x - plateWidth - 22, y: candidate.y - 16 },
      { x: candidate.x - plateWidth / 2, y: candidate.y - 91 },
      { x: candidate.x - plateWidth / 2, y: candidate.y + 65 },
    ];
    const match = positions
      .map((point) => ({
        x: Math.min(width - plateWidth - 12, Math.max(12, point.x)),
        y: Math.min(height - plateHeight - bottom, Math.max(top, point.y)),
        width: plateWidth,
        height: plateHeight,
      }))
      .find(
        (box) =>
          ![...occupied, ...labels].some((other) => overlaps(box, other)),
      );
    if (match) labels.push({ id: candidate.id, text, lines, ...match });
  }
  return labels;
}
