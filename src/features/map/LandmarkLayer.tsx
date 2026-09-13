import { useEffect, useMemo, useRef, useState } from "react";
import {
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Svg, { Circle, Line } from "react-native-svg";
import type { Stage } from "../../data/stages";
import type { Landmark } from "../../data/geography";
import { useI18n } from "../../i18n";
import { F } from "../../theme";
import { toViewport, type MapViewport } from "./projection";
import {
  findFreeMapBox,
  placeLandmarkLabels,
  wrapMapText,
  type MapBox,
} from "./landmarkLayout";
import { LandmarkIcon } from "./LandmarkIcon";

export type LandmarkLayerProps = {
  stage: Stage;
  viewport: MapViewport;
  stationIndex: number;
  visualPosition: number;
  mini?: boolean;
  exclusions?: MapBox[];
  topInset?: number;
};

/** Named, geographic sights live on the map, independently of typing state. */
export function LandmarkLayer({
  stage,
  viewport,
  stationIndex,
  visualPosition,
  mini = false,
  exclusions = [],
  topInset = mini ? 88 : 112,
}: LandmarkLayerProps) {
  const { l, t } = useI18n();
  const layerRef = useRef<View>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  useEffect(() => {
    if (Platform.OS !== "web") return;
    const element = layerRef.current as unknown as HTMLElement | null;
    if (!element?.addEventListener) return;
    const preserveInput = (event: MouseEvent) => {
      if (
        document.activeElement?.getAttribute("data-testid") ===
          "station-input" &&
        event.target instanceof Element &&
        event.target.closest('[data-testid^="landmark-label-"]')
      )
        event.preventDefault();
    };
    // Capture the browser's focus default before React Native's press responder.
    // Preventing its synthetic onPressIn alone happens too late on the web.
    element.addEventListener("mousedown", preserveInput, true);
    return () => element.removeEventListener("mousedown", preserveInput, true);
  }, []);
  const entries = useMemo(() => {
    const unique = new Map<
      string,
      { landmark: Landmark; stopIndexes: number[] }
    >();
    stage.route.forEach((stop, index) =>
      stop.landmarks?.forEach((landmark) => {
        const existing = unique.get(landmark.id);
        if (existing) existing.stopIndexes.push(index);
        else unique.set(landmark.id, { landmark, stopIndexes: [index] });
      }),
    );
    return [...unique.values()];
  }, [stage.route]);
  const candidates = entries.map(({ landmark, stopIndexes }) => ({
    id: landmark.id,
    name: l(landmark.name),
    point: toViewport(landmark.coordinate, viewport),
    priority:
      (selectedId === landmark.id ? -100 : 0) +
      Math.min(
        ...stopIndexes.map(
          (index) =>
            Math.abs(index - visualPosition) -
            (index >= stationIndex && index <= stationIndex + 2 ? 0.5 : 0),
        ),
      ),
  }));
  const labels = placeLandmarkLabels(
    candidates,
    viewport.width,
    viewport.height,
    exclusions,
    { mini, topInset },
  );
  const byId = new Map(
    entries.map((entry) => [entry.landmark.id, entry.landmark]),
  );
  const activeLabel =
    labels.find((label) => label.id === selectedId) ?? labels[0];
  const active = activeLabel ? byId.get(activeLabel.id) : undefined;

  // The automatic card appears only where it fits. In the compact keyboard map
  // the full name and accessible description remain available without a popup
  // covering the train; tapping never pauses the run or dismisses the keyboard.
  let detail: { box: MapBox; name: string[]; description: string[] } | null =
    null;
  if (
    active &&
    activeLabel &&
    !mini &&
    (viewport.width >= 600 || selectedId === active.id)
  ) {
    const bounds = {
      x: 12,
      y: topInset,
      width: viewport.width - 24,
      height: viewport.height - topInset - 36,
    };
    for (const width of [
      Math.min(310, bounds.width),
      Math.min(250, bounds.width),
      Math.min(205, bounds.width),
    ]) {
      const name = wrapMapText(l(active.name), Math.floor((width - 24) / 6.6));
      const description = wrapMapText(
        l(active.description),
        Math.floor((width - 24) / 5.8),
      );
      const height = 56 + name.length * 17 + description.length * 16;
      const box = findFreeMapBox(activeLabel.point, width, height, bounds, [
        ...exclusions,
        ...labels,
      ]);
      if (box) {
        detail = { box, name, description };
        break;
      }
    }
  }
  const holdTypingFocus = (event: { preventDefault(): void }) => {
    if (Platform.OS === "web") event.preventDefault();
  };
  return (
    <View
      ref={layerRef}
      testID="map-landmarks"
      pointerEvents="box-none"
      style={StyleSheet.absoluteFill}
    >
      <Svg
        width={viewport.width}
        height={viewport.height}
        pointerEvents="none"
        style={StyleSheet.absoluteFill}
      >
        {labels.map((label) => {
          const endX = Math.max(
            label.x,
            Math.min(label.x + label.width, label.point.x),
          );
          const endY = Math.max(
            label.y,
            Math.min(label.y + label.height, label.point.y),
          );
          return (
            <Line
              key={`${label.id}-leader`}
              x1={label.point.x}
              y1={label.point.y}
              x2={endX}
              y2={endY}
              stroke="#AB7C43"
              strokeWidth={1.4}
              strokeDasharray="3 3"
              opacity={0.8}
            />
          );
        })}
        {labels.map((label) => (
          <Circle
            key={label.id}
            cx={label.point.x}
            cy={label.point.y}
            r={4}
            fill="#BD7D37"
            stroke="#FFFDF8"
            strokeWidth={2}
          />
        ))}
      </Svg>
      {labels.map((label) => {
        const landmark = byId.get(label.id)!;
        return (
          <Pressable
            key={label.id}
            testID={`landmark-label-${label.id}`}
            accessibilityRole="button"
            accessibilityLabel={l(landmark.name)}
            accessibilityHint={l(landmark.description)}
            onPressIn={holdTypingFocus}
            onPress={() => setSelectedId(label.id)}
            hitSlop={
              label.minimal ? { top: 12, bottom: 12, left: 2, right: 2 } : 0
            }
            style={[
              s.label,
              {
                left: label.x,
                top: label.y,
                width: label.width,
                height: label.height,
              },
              active?.id === label.id && s.activeLabel,
              label.minimal && s.minimalLabel,
            ]}
          >
            {!label.minimal && <LandmarkIcon landmark={landmark} />}
            <Text style={[s.labelText, label.minimal && s.minimalText]}>
              {label.lines.join("\n")}
            </Text>
          </Pressable>
        );
      })}
      {detail && active && (
        <View
          testID="map-landmark-detail"
          style={[
            s.detail,
            {
              left: detail.box.x,
              top: detail.box.y,
              width: detail.box.width,
              height: detail.box.height,
            },
          ]}
        >
          <Text testID="map-landmark-name" style={s.detailName}>
            {detail.name.join("\n")}
          </Text>
          <Text testID="map-landmark-description" style={s.description}>
            {detail.description.join("\n")}
          </Text>
          <Pressable
            accessibilityRole="link"
            onPressIn={holdTypingFocus}
            onPress={() => {
              void Linking.openURL(active.sourceUrl).catch(() => {});
            }}
            hitSlop={8}
            style={s.source}
          >
            <Text style={s.sourceText}>{t("sightSource")} ↗</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  label: {
    position: "absolute",
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#D7B994",
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 6,
    backgroundColor: "#FFFCF5",
    boxShadow: "0 1px 3px #342A1912",
  },
  activeLabel: { borderColor: "#B57E3C", backgroundColor: "#FFF7E8" },
  labelText: {
    flex: 1,
    minWidth: 0,
    fontFamily: F.medium,
    fontSize: 11,
    lineHeight: 15,
    color: "#745024",
  },
  minimalLabel: { borderRadius: 5, paddingVertical: 3, paddingHorizontal: 7 },
  minimalText: { fontSize: 10, lineHeight: 13 },
  detail: {
    position: "absolute",
    borderRadius: 9,
    padding: 12,
    backgroundColor: "#FFFCF5",
    borderWidth: 1,
    borderColor: "#D7B994",
    boxShadow: "0 2px 8px #342A1917",
  },
  detailName: {
    fontFamily: F.medium,
    fontSize: 12,
    lineHeight: 17,
    color: "#745024",
  },
  description: {
    fontFamily: F.regular,
    fontSize: 11,
    lineHeight: 16,
    color: "#635D55",
    marginTop: 4,
  },
  source: {
    minHeight: 22,
    justifyContent: "center",
    alignSelf: "flex-start",
    marginTop: 4,
  },
  sourceText: {
    fontFamily: F.medium,
    fontSize: 9,
    lineHeight: 14,
    color: "#876132",
  },
});
