import React, { useCallback, useMemo, useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import Svg, {
  Circle,
  G,
  Polyline,
  Rect,
  TSpan,
  Text as SvgText,
} from "react-native-svg";
import type { Stage } from "../../data/stages";
import type { RouteStop } from "../../data/geography";
import { useI18n } from "../../i18n";
import { C, F } from "../../theme";
import { fitViewport, project, toViewport, visibleTiles } from "./projection";
import { mapMessages } from "./messages";
import { MapTile } from "./MapTile";
import { MapAttribution } from "./MapAttribution";
import {
  createRoutePath,
  distanceAt,
  followViewport,
  routeFollowZoom,
  samplePath,
} from "./motion";
import { useJourneyMotion } from "./useJourneyMotion";
import { TrainMarker } from "./TrainMarker";
import { placeStationLabels } from "./labelLayout";
import { StationLookahead } from "./StationLookahead";
import { stationLookahead, typingRoutePosition } from "./readAhead";
import { LandmarkLayer } from "./LandmarkLayer";

export type RouteMapProps = {
  stage: Stage;
  stationIndex?: number;
  originPending?: boolean;
  stationProgress?: number;
  active?: boolean;
  compact?: boolean;
  preview?: boolean;
  mini?: boolean;
  height?: number;
  paused?: boolean;
  onVisualArrival?: () => void;
};

export function RouteMap(props: RouteMapProps) {
  return <GeographicRouteMap key={props.stage.id} {...props} />;
}

function GeographicRouteMap({
  stage,
  stationIndex = 0,
  originPending = false,
  stationProgress = 0,
  active = false,
  compact = false,
  preview = false,
  mini = false,
  height,
  paused = false,
  onVisualArrival,
}: RouteMapProps) {
  const { width: windowWidth } = useWindowDimensions();
  const { locale, t } = useI18n();
  const words = mapMessages[locale];
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [overview, setOverview] = useState(!active);
  const [zoomOffset, setZoomOffset] = useState(0);
  const [attempt, setAttempt] = useState(0);
  const [lookaheadHeight, setLookaheadHeight] = useState(mini ? 58 : 76);
  const [tileStates, setTileStates] = useState<
    Record<string, "loaded" | "error">
  >({});
  const route: RouteStop[] = stage.route ?? [];
  const overviewViewport = useMemo(
    () =>
      route.length && size.width && size.height
        ? fitViewport(
            route.map((stop) => stop.coordinate),
            size.width,
            size.height,
            14,
            zoomOffset,
          )
        : null,
    [route, size, zoomOffset],
  );
  const followZoom = useMemo(
    () =>
      routeFollowZoom(
        route.map((stop) => project(stop.coordinate, 0)),
        size.width,
        size.height,
      ),
    [route, size],
  );
  const zoom =
    overview && !mini
      ? (overviewViewport?.zoom ?? followZoom)
      : Math.max(3, Math.min(17, followZoom + (mini ? 0 : zoomOffset)));
  const path = useMemo(
    () => createRoutePath(route.map((stop) => project(stop.coordinate, zoom))),
    [route, zoom],
  );
  const fraction = Number.isFinite(stationProgress)
    ? Math.min(1, Math.max(0, stationProgress))
    : 0;
  const targetPosition = Math.min(
    Math.max(0, route.length - 1),
    typingRoutePosition(stationIndex, fraction, originPending),
  );
  const finalRequested =
    active &&
    stationIndex >= stage.stations.length &&
    stage.stations.length > 0;
  const motion = useJourneyMotion(
    path,
    active ? targetPosition : 0,
    paused || !active,
    finalRequested,
    onVisualArrival,
  );
  const completed = Math.min(
    Math.floor(motion.position + 1e-9),
    Math.max(0, route.length - 1),
  );
  const trainDistance = distanceAt(path, motion.position);
  const worldTrain = samplePath(path, trainDistance);
  const viewport = useMemo(() => {
    if (!overviewViewport || !path.points.length) return null;
    return overview && !mini
      ? overviewViewport
      : followViewport(
          path.points[0],
          worldTrain,
          size.width,
          size.height,
          zoom,
        );
  }, [
    overviewViewport,
    path,
    overview,
    mini,
    worldTrain.x,
    worldTrain.y,
    size,
    zoom,
  ]);
  const tiles = useMemo(
    () => (viewport ? visibleTiles(viewport) : []),
    [viewport],
  );
  const failed = tiles.some((tile) => tileStates[tile.key] === "error");
  const loading =
    tiles.length > 0 && tiles.every((tile) => !tileStates[tile.key]);
  const points = viewport
    ? route.map((stop) => toViewport(stop.coordinate, viewport))
    : [];
  const train = viewport
    ? { x: worldTrain.x - viewport.left, y: worldTrain.y - viewport.top }
    : { x: 0, y: 0 };
  const lookahead = stationLookahead(
    stage,
    stationIndex,
    viewport,
    originPending,
  );
  const narrowMap = size.width < 600;
  const topInset = active ? lookaheadHeight + (mini ? 16 : 28) : 67;
  const controlsTop = active && narrowMap ? topInset : 14;
  const rear = samplePath(path, trainDistance - (mini ? 70 : 88));
  const trainFootprint = {
    x: Math.min(train.x, rear.x - (viewport?.left ?? 0)) - 36,
    y: Math.min(train.y, rear.y - (viewport?.top ?? 0)) - 32,
    width: Math.abs(worldTrain.x - rear.x) + 72,
    height: Math.abs(worldTrain.y - rear.y) + 64,
  };
  const passed = [...points.slice(0, completed + 1), train]
    .map((point) => `${point.x},${point.y}`)
    .join(" ");
  const isVisible = (point: { x: number; y: number }, padding = 0) =>
    point.x >= padding &&
    point.y >= padding &&
    point.x <= size.width - padding &&
    point.y <= size.height - padding;
  const updateTile = useCallback(
    (key: string, state: "loaded" | "error") =>
      setTileStates((previous) =>
        previous[key] === state ? previous : { ...previous, [key]: state },
      ),
    [],
  );
  const updateLookaheadHeight = useCallback((next: number) => {
    setLookaheadHeight((previous) => (previous === next ? previous : next));
  }, []);
  const changeView = () => {
    setOverview((value) => !value);
    setZoomOffset(0);
  };
  const labelIndexes = [
    ...new Set([
      lookahead.current?.routeIndex ?? completed,
      lookahead.following?.routeIndex ?? completed,
      completed,
      ...(overview ? [0, route.length - 1] : []),
    ]),
  ];
  const labelPlates = !mini
    ? placeStationLabels(
        labelIndexes
          .filter((index) => points[index] && isVisible(points[index], 14))
          .map((index) => ({
            id: index,
            text: route[index].name,
            ...points[index],
          })),
        size.width,
        size.height,
        [
          { x: size.width - 66, y: controlsTop + 46, width: 60, height: 112 },
          trainFootprint,
        ],
        { top: topInset, bottom: 55 },
      )
    : [];
  const exclusions = [
    ...labelPlates,
    trainFootprint,
    { x: 0, y: 0, width: size.width, height: topInset },
    { x: size.width - 150, y: controlsTop, width: 150, height: mini ? 0 : 156 },
    {
      x: 0,
      y: size.height - (mini ? 26 : 52),
      width: size.width,
      height: mini ? 26 : 52,
    },
  ];

  return (
    <View
      testID="route-map"
      style={[
        s.map,
        preview && { aspectRatio: 2.4 },
        compact && { aspectRatio: windowWidth < 760 ? 1.8 : 2.7 },
        mini && { aspectRatio: undefined, height: 130, minHeight: 130 },
        height !== undefined && {
          aspectRatio: undefined,
          height,
          minHeight: height,
        },
      ]}
      onLayout={({ nativeEvent: { layout } }) => {
        const next = {
          width: Math.round(layout.width),
          height: Math.round(layout.height),
        };
        setSize((previous) =>
          previous.width === next.width && previous.height === next.height
            ? previous
            : next,
        );
      }}
    >
      <View
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        {tiles.map((tile) => (
          <MapTile
            key={`${tile.key}:${attempt}`}
            tile={tile}
            onStatus={updateTile}
          />
        ))}
      </View>
      {!!viewport && !!points.length && (
        <Svg
          width={size.width}
          height={size.height}
          style={StyleSheet.absoluteFill}
          accessibilityLabel={t("mapLabel", { city: stage.city })}
          pointerEvents="none"
        >
          <Polyline
            points={points.map((point) => `${point.x},${point.y}`).join(" ")}
            fill="none"
            stroke="#FFFFFF"
            strokeWidth={19}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Polyline
            points={points.map((point) => `${point.x},${point.y}`).join(" ")}
            fill="none"
            stroke="#173B5A"
            strokeWidth={10}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Polyline
            points={points.map((point) => `${point.x},${point.y}`).join(" ")}
            fill="none"
            stroke="#B4CBD8"
            strokeWidth={3}
            strokeDasharray="2 12"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {active && (
            <Polyline
              points={passed}
              fill="none"
              stroke="#0075DE"
              strokeWidth={10}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
          {points.map((point, index) => {
            if (!isVisible(point, 4)) return null;
            const relevant =
              index === completed ||
              index === lookahead.current?.routeIndex ||
              index === lookahead.following?.routeIndex;
            return (
              <G
                key={`${index}:${route[index].name}`}
                testID={`map-stop-${index}`}
                accessibilityLabel={route[index].name}
              >
                {motion.dwellMs > 0 && motion.arrivedAt === index && (
                  <Circle
                    cx={point.x}
                    cy={point.y}
                    r={24}
                    fill="#0075DE"
                    opacity={0.18}
                  />
                )}
                <Circle
                  cx={point.x}
                  cy={point.y}
                  r={relevant ? 11 : 8}
                  fill={active && index <= completed ? "#0075DE" : C.paper}
                  stroke={
                    active && index <= completed
                      ? "#FFFFFF"
                      : index === lookahead.current?.routeIndex
                        ? "#0075DE"
                        : "#173B5A"
                  }
                  strokeWidth={3.5}
                />
              </G>
            );
          })}
          {labelPlates.map((plate) => (
            <G key={plate.id}>
              <Rect
                x={plate.x}
                y={plate.y + 2}
                width={plate.width}
                height={plate.height}
                rx={7}
                fill="#173B5A"
                opacity={0.1}
              />
              <Rect
                x={plate.x}
                y={plate.y}
                width={plate.width}
                height={plate.height}
                rx={7}
                fill="#FFFFFF"
                stroke={
                  plate.id === lookahead.current?.routeIndex
                    ? "#0075DE"
                    : "#D9E0E2"
                }
                strokeWidth={1.5}
              />
              <SvgText
                x={plate.x + plate.width / 2}
                y={plate.y + 20}
                textAnchor="middle"
                fontFamily={F.bold}
                fontSize={12}
                fill="#173B5A"
              >
                {plate.lines.map((line, index) => (
                  <TSpan
                    key={index}
                    x={plate.x + plate.width / 2}
                    dy={index === 0 ? 0 : 16}
                  >
                    {line}
                  </TSpan>
                ))}
              </SvgText>
            </G>
          ))}
          {isVisible(train) && (
            <TrainMarker
              path={path}
              distance={trainDistance}
              viewport={viewport}
              label={words.current}
              mini={mini}
            />
          )}
        </Svg>
      )}
      {viewport && (
        <LandmarkLayer
          stage={stage}
          viewport={viewport}
          stationIndex={stationIndex}
          visualPosition={motion.position}
          mini={mini}
          exclusions={exclusions}
          topInset={topInset}
        />
      )}
      {active && (
        <StationLookahead
          current={lookahead.current}
          following={lookahead.following}
          mini={mini}
          narrow={narrowMap}
          onHeight={updateLookaheadHeight}
        />
      )}
      {!mini && (
        <View
          style={[
            s.topBar,
            { top: controlsTop },
            active && { justifyContent: "flex-end" },
          ]}
        >
          {!active && (
            <View style={s.cityPill}>
              <View style={[s.dot, { backgroundColor: stage.color }]} />
              <Text style={s.cityText} numberOfLines={1}>
                {motion.dwellMs > 0 && route[motion.arrivedAt]
                  ? `${locale === "de" ? "Ankunft" : "Arrived"} · ${route[motion.arrivedAt].name}`
                  : stage.city}
              </Text>
            </View>
          )}
          {active && (
            <Pressable
              accessibilityRole="button"
              onPress={changeView}
              style={s.viewButton}
              testID="map-view-toggle"
            >
              <Text style={s.viewText}>
                {overview ? words.follow : words.overview}
              </Text>
            </Pressable>
          )}
        </View>
      )}
      {!!viewport && !mini && (
        <View style={[s.zoomControls, { top: controlsTop + 56 }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={words.zoomIn}
            disabled={viewport.zoom >= 17}
            onPress={() => setZoomOffset((value) => value + 1)}
            style={s.zoomButton}
          >
            <Text style={s.zoomText}>+</Text>
          </Pressable>
          <View style={s.zoomDivider} />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={words.zoomOut}
            disabled={viewport.zoom <= (overview && !mini ? 2 : 3)}
            onPress={() => setZoomOffset((value) => value - 1)}
            style={s.zoomButton}
          >
            <Text style={s.zoomText}>−</Text>
          </Pressable>
        </View>
      )}
      {(!route.length || loading || failed) && (
        <View
          style={[
            s.status,
            { top: active ? topInset + 6 : 66 },
            mini && { right: 14 },
          ]}
          testID={failed ? "map-unavailable" : "map-loading"}
        >
          <Text style={s.statusText}>
            {!route.length
              ? words.noCoordinates
              : failed
                ? words.unavailable
                : words.loading}
          </Text>
          {failed && (
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                setTileStates({});
                setAttempt((value) => value + 1);
              }}
            >
              <Text style={s.retry}>{words.retry}</Text>
            </Pressable>
          )}
        </View>
      )}
      <View
        style={[
          s.footer,
          mini && { justifyContent: "flex-end", paddingVertical: 0 },
        ]}
      >
        {!mini && <Text style={s.routeNote}>{words.routeNote}</Text>}
        <MapAttribution mini={mini} />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  map: {
    width: "100%",
    aspectRatio: 1.83,
    minHeight: 230,
    overflow: "hidden",
    backgroundColor: "#F3F4EE",
  },
  topBar: {
    position: "absolute",
    top: 14,
    left: 14,
    right: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  cityPill: {
    minWidth: 0,
    flexShrink: 1,
    flexDirection: "row",
    gap: 7,
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.95)",
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 20,
  },
  dot: { width: 7, height: 7, borderRadius: 4 },
  cityText: { fontFamily: F.bold, color: C.ink, fontSize: 11, flexShrink: 1 },
  viewButton: {
    minHeight: 44,
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.96)",
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: C.line,
  },
  viewText: { fontFamily: F.medium, fontSize: 11, color: C.primary },
  zoomControls: {
    position: "absolute",
    right: 14,
    top: 70,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.96)",
    borderWidth: 1,
    borderColor: C.line,
    overflow: "hidden",
  },
  zoomButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  zoomText: {
    fontSize: 24,
    lineHeight: 26,
    fontFamily: F.medium,
    color: C.ink,
  },
  zoomDivider: { height: 1, backgroundColor: C.line, marginHorizontal: 8 },
  status: {
    position: "absolute",
    left: 14,
    right: 66,
    top: 66,
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  statusText: {
    color: C.muted,
    fontFamily: F.regular,
    fontSize: 11,
    lineHeight: 16,
  },
  retry: {
    fontFamily: F.bold,
    color: C.primary,
    fontSize: 11,
    paddingVertical: 8,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(255,255,255,0.93)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    alignItems: "center",
    columnGap: 12,
  },
  routeNote: {
    fontFamily: F.regular,
    color: C.muted,
    fontSize: 9,
    lineHeight: 14,
  },
});
