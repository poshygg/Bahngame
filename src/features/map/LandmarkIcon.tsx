import Svg, { Circle, G, Line, Path, Rect } from "react-native-svg";
import type { Landmark } from "../../data/geography";

/** Small original silhouettes, with recognizable details for prominent sights. */
export function LandmarkIcon({
  landmark,
  size = 27,
}: {
  landmark: Landmark;
  size?: number;
}) {
  let drawing;
  if (landmark.id === "berlin-tv")
    drawing = (
      <>
        <Path d="M14 28 15 17h2l1 11M16 2v7" />
        <Circle cx={16} cy={12} r={4.5} fill="#E4B77A" />
        <Path d="M12 12h8M10 29h12" />
      </>
    );
  else if (landmark.id === "berlin-reichstag")
    drawing = (
      <>
        <Path d="M3 28V14h26v14M11 14V12a5 5 0 0 1 10 0v2M16 7v7M11 11h10M3 14l13-4 13 4M2 29h28" />
        {[6, 11, 16, 21, 26].map((x) => (
          <Line key={x} x1={x} y1={18} x2={x} y2={25} />
        ))}
      </>
    );
  else if (landmark.id === "cologne-dom")
    drawing = (
      <>
        <Path d="M4 29V13l4-11 4 11v16M20 29V13l4-11 4 11v16M12 28V17l4-5 4 5v11M7 17v5M25 17v5M14 29v-6a2 2 0 0 1 4 0v6M2 29h28" />
      </>
    );
  else if (landmark.id === "hamburg-elphi")
    drawing = (
      <>
        <Path d="M3 28V11q4 4 7-7 5 15 10 3 5-7 9-3v24Z" fill="#F2D4AA" />
        <Path d="M3 18h26M3 23h26M8 19v8M14 19v8M20 19v8M26 19v8" />
      </>
    );
  else if (landmark.id === "munich-garden")
    drawing = (
      <>
        <Path d="M16 2 10 7h12ZM10 8v4M22 8v4M16 9 7 15h18ZM9 16v5M23 16v5M16 17 3 24h26ZM8 25v4M24 25v4M15 25v4M4 29h24" />
      </>
    );
  else
    switch (landmark.kind) {
      case "tower":
        drawing = (
          <>
            <Path d="M9 29V9h14v20M8 9l8-7 8 7M7 29h18M13 12v4M19 12v4M14 29v-7h4v7" />
          </>
        );
        break;
      case "church":
        drawing = (
          <>
            <Path d="M5 29V12l5-8 5 8v17M10 2v4M7 4h6M15 29V19l6-7 7 7v10M8 16h4M9 29v-7h3v7M20 21v5" />
          </>
        );
        break;
      case "park":
        drawing = (
          <>
            <Path d="M9 28V17M23 28V14M3 29h26M17 29q1-6-3-8" />
            <Circle cx={9} cy={13} r={6} fill="#C3D5AA" />
            <Circle cx={23} cy={10} r={6.5} fill="#C3D5AA" />
          </>
        );
        break;
      case "bridge":
        drawing = (
          <>
            <Path d="M2 23h28M3 22Q8 4 13 22M13 22Q21 2 29 22M4 17h24M5 24v5M27 24v5M2 30q3-3 6 0t6 0t6 0t6 0t5 0" />
          </>
        );
        break;
      case "waterfront":
        drawing = (
          <>
            <Path d="M3 20h26l-5 7H8ZM10 19V9h13v10M13 9V5h6v4M3 29q3-3 6 0t6 0t6 0t6 0M14 13h5" />
          </>
        );
        break;
      case "museum":
        drawing = (
          <>
            <Path d="m3 12 13-8 13 8ZM3 29h26M5 25h22" />
            {[7, 13, 19, 25].map((x) => (
              <Line key={x} x1={x} y1={14} x2={x} y2={24} />
            ))}
          </>
        );
        break;
      case "monument":
        drawing = (
          <>
            <Path d="M8 29h16M10 25h12M13 24V12h6v12M11 12h10M16 3v6M12 7l4-3 4 3" />
            <Circle cx={16} cy={3} r={1.7} fill="#E4B77A" />
          </>
        );
        break;
      case "art":
        drawing = (
          <>
            <Rect x={3} y={6} width={26} height={21} rx={1} fill="#F5D6C4" />
            <Path d="M11 6v21M21 6v21M3 16l8-6 10 14 8-8M3 28h26" />
            <Circle cx={24} cy={11} r={2} fill="#A4C6C2" />
          </>
        );
        break;
      default:
        drawing = (
          <>
            <Path d="M4 28V13l12-9 12 9v15M3 29h26M14 29v-8h5v8M8 15h3M8 21h3M22 15h3M15 13h3" />
          </>
        );
    }
  return (
    <Svg
      testID={`landmark-icon-${landmark.id}`}
      width={size}
      height={size}
      viewBox="0 0 32 32"
      accessibilityElementsHidden
    >
      <G
        fill="none"
        stroke="#9B6226"
        strokeWidth={1.7}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {drawing}
      </G>
    </Svg>
  );
}
