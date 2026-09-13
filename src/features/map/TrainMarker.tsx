import React from "react";
import { Circle, G, Line, Path, Rect } from "react-native-svg";
import type { MapViewport } from "./projection";
import { samplePath, sampleTrainPose, type RoutePath } from "./motion";

/** Original unbranded express train, with each carriage following the route. */
export function TrainMarker({
  path,
  distance,
  viewport,
  label,
  mini = false,
}: {
  path: RoutePath;
  distance: number;
  viewport: MapViewport;
  label: string;
  mini?: boolean;
}) {
  const scale = mini ? 0.78 : 1;
  const nose = samplePath(path, distance);
  const cab = sampleTrainPose(path, distance - 30 * scale, 32 * scale);
  const coach = sampleTrainPose(path, distance - 88 * scale, 32 * scale);
  const local = (point: typeof nose) => ({
    x: point.x - nose.x,
    y: point.y - nose.y,
  });
  const cabPoint = local(cab);
  const coachPoint = local(coach);
  return (
    <G
      transform={`translate(${nose.x - viewport.left},${nose.y - viewport.top})`}
      accessibilityLabel={label}
      testID="train-marker"
    >
      <Line
        x1={cabPoint.x}
        y1={cabPoint.y}
        x2={coachPoint.x}
        y2={coachPoint.y}
        stroke="#1B3346"
        strokeWidth={5 * scale}
      />
      <G
        transform={`translate(${coachPoint.x},${coachPoint.y}) rotate(${coach.heading}) scale(${scale})`}
      >
        <Rect
          x={-26}
          y={-16}
          width={52}
          height={34}
          rx={7}
          fill="#1B3346"
          opacity={0.15}
        />
        <Rect
          x={-25}
          y={-18}
          width={50}
          height={31}
          rx={6}
          fill="#FDFEFA"
          stroke="#FFFFFF"
          strokeWidth={6}
        />
        <Rect
          x={-25}
          y={-18}
          width={50}
          height={31}
          rx={6}
          fill="#FDFEFA"
          stroke="#173B5A"
          strokeWidth={2}
        />
        <Rect x={-22} y={3} width={44} height={6} rx={2} fill="#0075DE" />
        {[-17, -5, 7].map((x) => (
          <Rect
            key={x}
            x={x}
            y={-12}
            width={9}
            height={11}
            rx={2}
            fill="#173B5A"
          />
        ))}
        <Circle cx={-17} cy={14} r={4} fill="#173B5A" />
        <Circle cx={17} cy={14} r={4} fill="#173B5A" />
      </G>
      <G
        transform={`translate(${cabPoint.x},${cabPoint.y}) rotate(${cab.heading}) scale(${scale})`}
      >
        <Path
          d="M-28-18H8Q27-18 32 0L32 8Q31 14 24 14H-28Z"
          fill="#FFFFFF"
          stroke="#FFFFFF"
          strokeWidth={7}
          strokeLinejoin="round"
        />
        <Path
          d="M-28-18H8Q27-18 32 0L32 8Q31 14 24 14H-28Z"
          fill="#FDFEFA"
          stroke="#173B5A"
          strokeWidth={2}
          strokeLinejoin="round"
        />
        <Path d="M-25 3H30V9H-25Z" fill="#0075DE" />
        <Path d="M10-13Q22-12 26-2H10Z" fill="#173B5A" />
        <Rect x={-19} y={-12} width={11} height={11} rx={2} fill="#173B5A" />
        <Rect x={-5} y={-12} width={10} height={11} rx={2} fill="#173B5A" />
        <Rect x={-17} y={-21} width={28} height={3} rx={1.5} fill="#A8B6BC" />
        <Circle cx={-17} cy={15} r={4} fill="#173B5A" />
        <Circle cx={20} cy={15} r={4} fill="#173B5A" />
        <Circle cx={28} cy={7} r={2.3} fill="#FFCA61" />
      </G>
    </G>
  );
}
