import { useKeyboardVisibility } from "../hooks/useKeyboardVisibility";
import { TypingCard } from "../features/typing/TypingCard";
import { JourneyResult } from "../features/journey/JourneyResult";
import { useI18n } from "../i18n";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { InputProfile, Stage } from "../data/stages";
import {
  currentStation,
  inputTarget,
  Run,
  runStats,
  typingTargets,
} from "../game/engine";
import { useGame } from "../hooks/useGame";
import { C, F } from "../theme";
import { RouteMap } from "./RouteMap";
import { Button, Eyebrow, Icon, IconButton, Star } from "./ui";

type Props = {
  stage: Stage;
  profile: InputProfile;
  onFinish: (run: Run) => void;
  onHome: () => void;
  onRetry: () => void;
  onNext?: () => void;
};

export function GameScreen({
  stage,
  profile,
  onFinish,
  onHome,
  onRetry,
  onNext,
}: Props) {
  const { width, height } = useWindowDimensions();
  const mobile = width < 760;
  const { run, input, pause, resume, hasStarted } = useGame(stage, profile);
  const { t, l, n } = useI18n();
  const stats = runStats(run, stage);
  const inputRef = useRef<TextInput>(null);
  const reported = useRef(false);
  const keyboardOpen = useKeyboardVisibility();
  const focusedMobile = mobile && keyboardOpen;
  const [stopsOpen, setStopsOpen] = useState(false);
  const [visualArrivalComplete, setVisualArrivalComplete] = useState(false);
  const visualArrived = useCallback(() => setVisualArrivalComplete(true), []);
  const waitingForArrival =
    run.finishReason === "arrived" && !visualArrivalComplete;
  const showResult = run.status === "finished" && !waitingForArrival;
  const current = currentStation(stage, run);
  const activeRouteIndex = run.originCompleted ? run.stationIndex + 1 : 0;
  const target = inputTarget(current);
  const mapHeight = mobile
    ? focusedMobile
      ? 190
      : Math.max(260, Math.min(320, height * 0.38))
    : Math.max(360, Math.min(560, height - 300));

  // Scoring ends on the real last keystroke. Only presentation waits for the
  // train to reach the final platform; the clock and saved score never change.
  useEffect(() => {
    if (run.status === "finished" && !reported.current) {
      reported.current = true;
      onFinish(run);
    }
  }, [run, onFinish]);
  useEffect(() => {
    if (showResult) Keyboard.dismiss();
  }, [showResult]);
  if (showResult)
    return (
      <JourneyResult
        stage={stage}
        run={run}
        onHome={onHome}
        onRetry={onRetry}
        onNext={stats.passed ? onNext : undefined}
      />
    );

  const remaining = Math.max(
    0,
    Math.ceil(stats.seconds - run.elapsedMs / 1000),
  );
  const nextStar = stats.thresholds.find(
    (threshold) => threshold > stats.score,
  );
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        testID="game-screen"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[s.page, mobile && s.mobilePage]}
      >
        <View style={s.top}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("pauseExit")}
            onPress={run.status === "finished" ? onHome : pause}
            style={s.back}
          >
            <Icon name="back" size={19} />
            {!mobile && <Text style={s.backText}>{t("journeyMap")}</Text>}
          </Pressable>
          <View style={s.titleBlock}>
            <Text numberOfLines={1} style={[s.title, mobile && s.mobileTitle]}>
              {l(stage.title)}
            </Text>
            {!focusedMobile && (
              <Text style={s.subtitle}>
                {t("route")} {stage.line} ·{" "}
                {stage.areaName ? l(stage.areaName) : stage.city}
                {!mobile
                  ? ` · ${t(profile === "touch" ? "touchFull" : "keyboardFull")}`
                  : ""}
              </Text>
            )}
          </View>
          <Text style={s.tripFraction}>
            {String(run.stationIndex + Number(run.originCompleted)).padStart(
              2,
              "0",
            )}{" "}
            / {String(typingTargets(stage).length).padStart(2, "0")}
          </Text>
          {run.status !== "finished" && (
            <IconButton name="pause" label={t("pause")} onPress={pause} />
          )}
        </View>
        <View style={[s.statsRow, focusedMobile && s.focusedStats]}>
          {[
            { label: t("score"), value: n(stats.score), test: "live-score" },
            {
              label: t("accuracy"),
              value: `${Math.round(stats.accuracy * 100)}%`,
              test: "live-accuracy",
            },
            {
              label: t("typingSpeed"),
              value: stats.cpm.toString(),
              unit: t("cpm"),
              test: "live-cpm",
            },
            {
              label: t("remaining"),
              value: `${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, "0")}`,
              alert: remaining <= 10,
              test: "live-time",
            },
          ].map((stat, index) => (
            <View key={stat.test} style={[s.stat, index > 0 && s.statBorder]}>
              <Text numberOfLines={1} style={s.statLabel}>
                {stat.label}
              </Text>
              <View style={s.statValueRow}>
                <Text
                  testID={stat.test}
                  style={[
                    s.statValue,
                    mobile && s.mobileStatValue,
                    stat.alert && { color: C.danger },
                  ]}
                >
                  {stat.value}
                </Text>
                {stat.unit && !mobile && (
                  <Text style={s.statUnit}>{stat.unit}</Text>
                )}
              </View>
            </View>
          ))}
        </View>

        <View testID="game-map-frame" style={s.mapFrame}>
          <RouteMap
            stage={stage}
            active
            mini={focusedMobile}
            height={mapHeight}
            paused={run.status === "paused"}
            stationIndex={run.stationIndex}
            originPending={!run.originCompleted}
            stationProgress={target ? run.cursor / target.length : 0}
            onVisualArrival={visualArrived}
          />
          <View
            style={[s.progressLine, { backgroundColor: `${stage.color}22` }]}
          >
            <View
              style={{
                height: "100%",
                width: `${stats.progress * 100}%`,
                backgroundColor: stage.color,
              }}
            />
          </View>
        </View>

        {waitingForArrival && (
          <View testID="arrival-transition" style={s.arrival}>
            <Icon name="train" color={C.primary} size={20} />
            <Text style={s.arrivalText}>{t("arrivingAtDestination")}</Text>
          </View>
        )}
        <TypingCard
          stage={stage}
          run={run}
          input={input}
          pause={pause}
          inputRef={inputRef}
          compact={focusedMobile}
        />

        {!focusedMobile && (
          <View style={s.journeyMeta}>
            <Text style={s.mapCaption}>
              {hasStarted ? t("moving") : t("firstKey")}
            </Text>
            <Text style={s.progressText}>
              {Math.round(stats.progress * 100)}%
            </Text>
          </View>
        )}
        <View style={[s.detailsRow, mobile && { flexDirection: "column" }]}>
          {!focusedMobile && (
            <View style={[s.starTrack, !mobile && { width: 290 }]}>
              <View style={s.starValues}>
                {stats.thresholds.map((threshold) => (
                  <View key={threshold} style={s.starValue}>
                    <Star filled={stats.score >= threshold} size={15} />
                    <Text style={s.starScore}>{n(threshold)}</Text>
                  </View>
                ))}
              </View>
              <Text style={s.nextStar}>
                {nextStar
                  ? t("nextStar", {
                      score: n(Math.max(0, nextStar - stats.score)),
                    })
                  : t("threeReached")}
              </Text>
            </View>
          )}
        </View>
        {!focusedMobile && (
          <>
            <Pressable
              testID="journey-stops-toggle"
              accessibilityRole="button"
              accessibilityState={{ expanded: stopsOpen }}
              aria-expanded={stopsOpen}
              onPress={() => setStopsOpen((value) => !value)}
              style={s.stopsToggle}
            >
              <Icon name="map" size={17} color={C.muted} />
              <Text style={s.stopsTitle}>{t("routeList")}</Text>
              <Text style={s.stopsAction}>{stopsOpen ? "−" : "+"}</Text>
            </Pressable>
            {stopsOpen && (
              <View testID="journey-stops" style={s.stopsPanel}>
                {[stage.origin, ...stage.stations].map((station, index) => (
                  <View key={index} style={s.routeStop}>
                    <View
                      style={[
                        s.stopDot,
                        index < activeRouteIndex && {
                          borderColor: stage.color,
                          backgroundColor: stage.color,
                        },
                      ]}
                    />
                    <Text
                      style={[
                        s.stopName,
                        index === activeRouteIndex && {
                          color: stage.color,
                        },
                      ]}
                    >
                      {station}
                    </Text>
                    <Text style={s.stopStatus}>
                      {index === 0
                        ? t("origin")
                        : index < activeRouteIndex
                          ? t("arrived")
                          : index === activeRouteIndex
                            ? t("upcoming")
                            : t("stop")}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
      {run.status === "paused" && (
        <View style={s.overlay}>
          <View accessibilityViewIsModal style={s.pauseCard}>
            <View style={s.pauseIcon}>
              <Icon name="pause" size={28} />
            </View>
            <Eyebrow>{t("pauseTag")}</Eyebrow>
            <Text style={s.pauseTitle}>{t("pauseTitle")}</Text>
            <Text style={s.pauseBody}>{t("pauseBody")}</Text>
            <Button
              title={t("resume")}
              icon="play"
              onPress={() => {
                resume();
                setTimeout(() => inputRef.current?.focus(), 60);
              }}
            />
            <Button
              title={t("restart")}
              secondary
              icon="repeat"
              onPress={onRetry}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t("leave")}
              onPress={onHome}
              style={s.leaveButton}
            >
              <Text style={s.leaveText}>{t("leave")}</Text>
            </Pressable>
          </View>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  page: {
    maxWidth: 1440,
    width: "100%",
    alignSelf: "center",
    padding: 24,
    paddingTop: 10,
    paddingBottom: 32,
  },
  mobilePage: { padding: 12, paddingTop: 4, paddingBottom: 20 },
  top: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 8,
    minHeight: 48,
  },
  back: {
    flexDirection: "row",
    gap: 7,
    alignItems: "center",
    minHeight: 44,
    minWidth: 32,
  },
  backText: { fontFamily: F.medium, fontSize: 11, color: C.muted },
  titleBlock: { flex: 1, minWidth: 0 },
  title: {
    fontFamily: F.medium,
    fontSize: 21,
    color: C.ink,
    letterSpacing: -0.5,
  },
  mobileTitle: { fontSize: 16 },
  subtitle: {
    fontFamily: F.regular,
    fontSize: 10,
    color: C.muted,
    marginTop: 3,
  },
  tripFraction: { fontFamily: F.medium, fontSize: 12, color: C.muted },
  statsRow: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: C.line,
    backgroundColor: C.paper,
    borderRadius: 10,
    paddingVertical: 7,
    marginBottom: 10,
  },
  focusedStats: { paddingVertical: 4, marginBottom: 8 },
  stat: { flex: 1, paddingHorizontal: 12 },
  statBorder: { borderLeftWidth: 1, borderColor: C.line },
  statLabel: {
    fontFamily: F.regular,
    fontSize: 9,
    color: C.muted,
    marginBottom: 2,
  },
  statValueRow: { flexDirection: "row", alignItems: "baseline", gap: 5 },
  statValue: {
    fontSize: 23,
    lineHeight: 27,
    fontFamily: F.medium,
    color: C.ink,
    letterSpacing: -0.7,
  },
  mobileStatValue: { fontSize: 19, lineHeight: 23 },
  statUnit: { fontFamily: F.regular, fontSize: 9, color: C.muted },
  mapFrame: {
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 10,
  },
  progressLine: { height: 4 },
  journeyMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 9,
    paddingHorizontal: 2,
  },
  mapCaption: { flex: 1, fontFamily: F.regular, fontSize: 10, color: C.muted },
  progressText: { fontFamily: F.medium, fontSize: 10, color: C.green },
  arrival: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    backgroundColor: "#EDF4FC",
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  arrivalText: { fontFamily: F.medium, fontSize: 12, color: C.primary },
  detailsRow: { flexDirection: "row", justifyContent: "flex-end", gap: 14 },
  starTrack: { paddingHorizontal: 8, paddingTop: 10, paddingBottom: 12 },
  starValues: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 14,
  },
  starValue: { flexDirection: "row", gap: 5, alignItems: "center" },
  starScore: { fontFamily: F.regular, fontSize: 10, color: C.muted },
  nextStar: {
    fontFamily: F.regular,
    fontSize: 10,
    color: C.green,
    marginTop: 9,
    textAlign: "center",
  },
  stopsToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    minHeight: 44,
    borderTopWidth: 1,
    borderColor: C.line,
    paddingHorizontal: 4,
  },
  stopsTitle: { fontFamily: F.medium, fontSize: 12, color: C.muted, flex: 1 },
  stopsAction: { fontSize: 21, color: C.muted, paddingHorizontal: 10 },
  stopsPanel: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 10,
    backgroundColor: C.paper,
  },
  routeStop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    minHeight: 41,
  },
  stopDot: {
    width: 9,
    height: 9,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: C.line,
  },
  stopName: { flex: 1, fontFamily: F.medium, fontSize: 12, color: C.muted },
  stopStatus: { fontFamily: F.regular, fontSize: 9, color: C.muted },
  overlay: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: "#19191870",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  pauseCard: {
    backgroundColor: C.bg,
    borderRadius: 20,
    padding: 30,
    width: "100%",
    maxWidth: 410,
    gap: 12,
  },
  pauseIcon: {
    width: 54,
    height: 54,
    borderRadius: 15,
    backgroundColor: C.sage,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  pauseTitle: {
    fontSize: 27,
    fontFamily: F.bold,
    color: C.ink,
    letterSpacing: -1,
  },
  pauseBody: {
    fontFamily: F.regular,
    fontSize: 12,
    lineHeight: 22,
    color: C.muted,
    marginBottom: 15,
  },
  leaveButton: { padding: 13, alignItems: "center" },
  leaveText: {
    fontFamily: F.regular,
    fontSize: 11,
    color: C.muted,
    textDecorationLine: "underline",
  },
});
