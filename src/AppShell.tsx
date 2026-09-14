import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ExplorerScreen } from "./components/ExplorerScreen";
import { GameScreen } from "./components/GameScreen";
import { Icon, IconButton } from "./components/ui";
import { LanguageSwitch } from "./components/LanguageSwitch";
import { getCountryStages } from "./data/countries";
import { type Stage } from "./data/stages";
import { type Run } from "./game/engine";
import {
  createPlayer,
  getNextStage,
  isStageUnlocked,
  renamePlayer,
  saveResult,
  setActivePlayer,
} from "./game/progress";
import { useProgress } from "./hooks/useProgress";
import { JourneyPanel, type Panel } from "./features/settings/JourneyPanel";
import { TutorialScreen } from "./features/tutorial/TutorialScreen";
import { useI18n } from "./i18n";
import { C, F } from "./theme";
import { AchievementsPanel } from "./features/achievements/AchievementsPanel";
import { AdSettingsProvider } from "./features/ads/AdSettings";

type Journey = { stage: Stage; attempt: number };
export function AppShell() {
  return <AdSettingsProvider><AppContent /></AdSettingsProvider>;
}
function AppContent() {
  const { width } = useWindowDimensions();
  const mobile = width < 760;
  const { t, l } = useI18n();
  const { progress, setProgress, loaded, storageError } = useProgress();
  const [selected, setSelected] = useState(0);
  const [journey, setJourney] = useState<Journey | null>(null);
  const [panel, setPanel] = useState<Panel>(null);
  const [tutorial, setTutorial] = useState(false);
  const [achievements, setAchievements] = useState(false);
  const start = (stage: Stage) => {
    if (isStageUnlocked(progress, stage))
      setJourney({ stage, attempt: Date.now() });
  };
  const finish = useCallback(
    (run: Run) => {
      const stage = journey?.stage;
      if (stage?.id === run.stageId)
        setProgress((previous) => saveResult(previous, run, stage));
    },
    [setProgress, journey?.stage],
  );
  const startTutorial = () => {
    setPanel(null);
    setTutorial(true);
  };
  const completeTutorial = () => {
    setProgress((previous) => ({ ...previous, tutorialCompleted: true }));
    setTutorial(false);
  };
  const nextStage = journey ? getNextStage(journey.stage) : undefined;
  const createPlayerAccount = (nickname: string) =>
    setProgress((previous) => createPlayer(previous, nickname));
  const switchPlayer = (playerId: string) =>
    setProgress((previous) => setActivePlayer(previous, playerId));
  const updatePlayerNickname = (playerId: string, nickname: string) =>
    setProgress((previous) => renamePlayer(previous, playerId, nickname));
  return (
    <SafeAreaView style={s.root} edges={["top", "left", "right", "bottom"]}>
      {!journey && !tutorial && (
        <View style={[s.header, mobile && s.mobileHeader]}>
          <View style={s.brand}>
            <View style={s.brandIcon}>
              <Icon name="train" size={22} />
            </View>
            <Text style={s.wordmark}>Bahnreise.</Text>
          </View>
          {!mobile && !journey && (
            <View style={s.nav}>
              <Pressable
                accessibilityRole="button"
                onPress={() => setPanel(null)}
                style={s.navLink}
              >
                <Text style={[s.navText, { color: C.ink }]}>
                  {t("explore")}
                </Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={() => setPanel("records")}
                style={s.navLink}
              >
                <Text style={s.navText}>{t("journal")}</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={() => setPanel("competition")}
                style={s.navLink}
              >
                <Text style={s.navText}>{t("competition")}</Text>
              </Pressable>
            </View>
          )}
          <View style={s.headerActions}>
            <IconButton name="spark" label={l({ en: "Achievements", de: "Erfolge" })} onPress={() => setAchievements(true)} />
            {!mobile && <LanguageSwitch />}
            {!journey && (
              <>
                {mobile && (
                  <IconButton
                    name="ticket"
                    label={t("journal")}
                    onPress={() => setPanel("records")}
                  />
                )}
                <IconButton
                  name="spark"
                  label={t("competition")}
                  onPress={() => setPanel("competition")}
                />
                <IconButton
                  name="settings"
                  label={t("settings")}
                  onPress={() => setPanel("settings")}
                />
                {!mobile && (
                  <IconButton
                    name="help"
                    label={t("help")}
                    onPress={() => setPanel("help")}
                  />
                )}
              </>
            )}
          </View>
        </View>
      )}

      {storageError && (
        <View style={s.warning}>
          <Text style={s.warningText}>{t("savedError")}</Text>
        </View>
      )}
      {!loaded ? (
        <View style={s.loading}>
          <ActivityIndicator color={C.primary} />
        </View>
      ) : tutorial ? (
        <TutorialScreen
          profile={progress.profile}
          onComplete={completeTutorial}
          onExit={() => setTutorial(false)}
        />
      ) : journey ? (
        <GameScreen
          key={journey.stage.id + journey.attempt}
          stage={journey.stage}
          profile={progress.profile}
          onFinish={finish}
          onHome={() => setJourney(null)}
          onRetry={() => setJourney({ ...journey, attempt: Date.now() })}
          onNext={
            nextStage
              ? () => {
                  setSelected(
                    getCountryStages(nextStage.countryId).findIndex(
                      (stage) => stage.id === nextStage.id,
                    ),
                  );
                  setJourney({
                    stage: nextStage,
                    attempt: Date.now(),
                  });
                }
              : undefined
          }
        />
      ) : (
        <ExplorerScreen
          progress={progress}
          selected={selected}
          onSelect={setSelected}
          onCountry={(countryId) => {
            setProgress((previous) => ({ ...previous, countryId }));
            setSelected(0);
          }}
          onStart={start}
          onCustomStart={(stage) => setJourney({ stage, attempt: Date.now() })}
          onTutorial={startTutorial}
        />
      )}
      <JourneyPanel
        panel={panel}
        progress={progress}
        onClose={() => setPanel(null)}
        onTutorial={startTutorial}
        onCreatePlayer={createPlayerAccount}
        onSelectPlayer={switchPlayer}
        onRenamePlayer={updatePlayerNickname}
      />
      {achievements && <AchievementsPanel progress={progress} profile={progress.profile} onClose={() => setAchievements(false)} />}
    </SafeAreaView>
  );
}
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  loading: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    height: 74,
    paddingHorizontal: 38,
    borderBottomWidth: 1,
    borderColor: C.line,
    backgroundColor: C.paper,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 18,
  },
  mobileHeader: { height: 65, paddingHorizontal: 18, gap: 8 },
  brand: { flexDirection: "row", alignItems: "center", gap: 10 },
  brandIcon: {
    width: 35,
    height: 37,
    backgroundColor: C.soft,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  wordmark: {
    fontFamily: F.bold,
    fontSize: 22,
    letterSpacing: -0.9,
    color: C.ink,
  },
  nav: {
    flexDirection: "row",
    alignItems: "center",
    gap: 26,
    flex: 1,
    marginLeft: 35,
  },
  navLink: { minHeight: 44, justifyContent: "center" },
  navText: { fontFamily: F.medium, fontSize: 13, color: C.muted },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 5 },
  warning: { padding: 10, backgroundColor: "#FFF0D7" },
  warningText: { fontFamily: F.regular, fontSize: 12, color: C.muted },
});
