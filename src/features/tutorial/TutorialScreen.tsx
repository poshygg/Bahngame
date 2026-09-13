import { useKeyboardVisibility } from "../../hooks/useKeyboardVisibility";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import type { InputProfile } from "../../data/stages";
import {
  createRun,
  currentStation,
  inputTarget,
  runStats,
  typeCharacter,
  typingTargets,
} from "../../game/engine";
import { RouteMap } from "../../components/RouteMap";
import { Button, Eyebrow, IconButton } from "../../components/ui";
import { TypingCard } from "../typing/TypingCard";
import { useI18n } from "../../i18n";
import { C, F } from "../../theme";
import { TUTORIAL_STAGE as stage } from "./tutorialStage";

export function TutorialScreen({
  profile,
  onComplete,
  onExit,
}: {
  profile: InputProfile;
  onComplete: () => void;
  onExit: () => void;
}) {
  const { t, n } = useI18n();
  const { width, height } = useWindowDimensions();
  const mobile = width < 760;
  const [started, setStarted] = useState(false);
  const [run, setRun] = useState(() => createRun(stage, profile));
  const inputRef = useRef<TextInput>(null);
  const keyboardOpen = useKeyboardVisibility();
  const focusedMobile = mobile && keyboardOpen;
  const stats = runStats(run, stage);
  const [visualArrivalComplete, setVisualArrivalComplete] = useState(false);
  const visualArrived = useCallback(() => setVisualArrivalComplete(true), []);
  const waitingForArrival = run.status === "finished" && !visualArrivalComplete;
  const finished = run.status === "finished" && visualArrivalComplete;
  useEffect(() => {
    if (finished) Keyboard.dismiss();
  }, [finished]);
  const target = inputTarget(currentStation(stage, run));
  const input = (char: string) =>
    setRun((previous) => typeCharacter(previous, stage, char));
  const mapHeight = mobile
    ? focusedMobile
      ? 190
      : 280
    : Math.max(350, Math.min(460, height - 340));

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        testID="tutorial-screen"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[s.page, mobile && { padding: 12 }]}
      >
        <View style={s.top}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Eyebrow>{t("tutorialTag")}</Eyebrow>
            <Text numberOfLines={1} style={s.title}>
              {t(finished ? "tutorialDone" : "tutorialWelcome")}
            </Text>
          </View>
          <IconButton
            name="close"
            label={t("closeTutorial")}
            onPress={onExit}
          />
        </View>
        {(!started || finished) && (
          <Text style={s.intro}>
            {t(finished ? "tutorialDoneBody" : "tutorialIntro")}
          </Text>
        )}
        <View testID="tutorial-map-frame" style={s.map}>
          <RouteMap
            stage={stage}
            active={started}
            mini={focusedMobile}
            height={mapHeight}
            stationIndex={run.stationIndex}
            originPending={!run.originCompleted}
            stationProgress={target ? run.cursor / target.length : 0}
            onVisualArrival={visualArrived}
          />
        </View>
        {!started ? (
          <View style={s.lesson}>
            <Text style={s.lessonTitle}>{t("tutorialBeforeTitle")}</Text>
            <Text style={s.body}>{t("tutorialBeforeBody")}</Text>
            <Button
              testID="tutorial-begin"
              title={t("tutorialBegin")}
              icon="play"
              onPress={() => setStarted(true)}
              style={{ marginTop: 16 }}
            />
          </View>
        ) : finished ? (
          <View testID="tutorial-complete" style={s.lesson}>
            <Text style={s.lessonTitle}>{t("tutorialStarsTitle")}</Text>
            <Text style={s.body}>{t("tutorialStarsBody")}</Text>
            <Text style={s.bonus}>
              {t("bonusEarned", {
                score: n(stats.originalBonus),
                count: run.originalCharacters,
              })}
            </Text>
            {run.originalCharacters === 0 && (
              <Text style={s.body}>{t("tutorialBonusOptional")}</Text>
            )}
            <Text style={s.body}>{t("tutorialNoRecord")}</Text>
            <Button
              testID="tutorial-finish"
              title={t("tutorialFinish")}
              onPress={() => {
                Keyboard.dismiss();
                onComplete();
              }}
              style={{ marginTop: 16 }}
            />
          </View>
        ) : (
          <>
            {waitingForArrival && (
              <Text testID="tutorial-arrival-transition" style={s.arrival}>
                {t("arrivingAtDestination")}
              </Text>
            )}
            <TypingCard
              stage={stage}
              run={run}
              input={input}
              inputRef={inputRef}
              compact={focusedMobile}
            />
            {!waitingForArrival && (
              <View
                testID="tutorial-lesson"
                style={[s.lesson, { marginTop: 12 }]}
              >
                <Eyebrow>
                  {t("tutorialStep", {
                    step: run.stationIndex + 1 + Number(run.originCompleted),
                    total: typingTargets(stage).length,
                  })}
                </Eyebrow>
                <Text style={s.lessonTitle}>
                  {t(
                    run.stationIndex === 0
                      ? "tutorialMoveTitle"
                      : "tutorialBonusTitle",
                  )}
                </Text>
                <Text style={s.body}>
                  {t(
                    run.stationIndex === 0
                      ? "tutorialMoveBody"
                      : "tutorialBonusBody",
                  )}
                </Text>
                {run.mistakes > 0 && (
                  <Text testID="tutorial-recovery" style={s.recovery}>
                    {t("tutorialRecovery")}
                  </Text>
                )}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
const s = StyleSheet.create({
  page: {
    padding: 20,
    paddingTop: 10,
    paddingBottom: 40,
    width: "100%",
    maxWidth: 1180,
    alignSelf: "center",
  },
  top: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 10,
  },
  title: {
    fontFamily: F.bold,
    fontSize: 22,
    letterSpacing: -0.6,
    color: C.ink,
    marginTop: 4,
  },
  intro: {
    fontFamily: F.regular,
    fontSize: 13,
    lineHeight: 21,
    color: C.muted,
    marginBottom: 14,
  },
  map: {
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: C.line,
    marginBottom: 10,
  },
  lesson: {
    padding: 16,
    borderRadius: 10,
    backgroundColor: "#EDF4FC",
    borderWidth: 1,
    borderColor: "#D9E7F9",
    marginBottom: 12,
  },
  lessonTitle: {
    fontFamily: F.medium,
    fontSize: 17,
    color: C.ink,
    marginTop: 4,
    lineHeight: 24,
  },
  body: {
    fontFamily: F.regular,
    fontSize: 12,
    color: C.muted,
    lineHeight: 20,
    marginTop: 6,
  },
  recovery: {
    fontFamily: F.medium,
    fontSize: 12,
    color: C.orange,
    lineHeight: 19,
    marginTop: 8,
  },
  bonus: {
    fontFamily: F.medium,
    fontSize: 13,
    color: C.primary,
    lineHeight: 21,
    marginTop: 12,
  },
  arrival: {
    fontFamily: F.medium,
    fontSize: 12,
    color: C.primary,
    lineHeight: 20,
    padding: 12,
    marginBottom: 8,
    backgroundColor: "#EDF4FC",
    borderRadius: 8,
  },
});
