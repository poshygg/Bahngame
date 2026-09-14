import React, { useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { Modal } from "react-native";
import Svg, {
  Circle,
  G,
  Line,
  Path,
  Rect,
  Text as SvgText,
} from "react-native-svg";
import { COUNTRIES, getCountry, getCountryStages } from "../data/countries";
import type { Stage } from "../data/stages";
import { stageRules } from "../game/engine";
import { Progress, isStageUnlocked } from "../game/progress";
import { useI18n } from "../i18n";
import { C, F } from "../theme";
import { Button, Eyebrow, Icon } from "./ui";
import { GermanyBrowser } from "../features/explorer/GermanyBrowser";
import { RailCatalogNote } from "../features/explorer/RailCatalogNote";
import { CustomRouteBuilder } from "../features/custom/CustomRouteBuilder";
import { AdSlot } from "../features/ads/AdSlot";

type Props = {
  progress: Progress;
  selected: number;
  onSelect: (index: number) => void;
  onCountry: (country: string) => void;
  onTutorial: () => void;
  onStart: (stage: Stage) => void;
  onRecords: () => void;
  onSettings: () => void;
  onCustomStart?: (stage: Stage) => void;
};
export function ExplorerScreen({
  progress,
  selected,
  onSelect,
  onCountry,
  onTutorial,
  onStart,
  onRecords,
  onSettings,
  onCustomStart,
}: Props) {
  const { width } = useWindowDimensions();
  const mobile = width < 760;
  const tablet = width < 1080;
  const { t, l, locale } = useI18n();
  const [showCustomBuilder, setShowCustomBuilder] = useState(false);
  const [showRailBrowser, setShowRailBrowser] = useState(false);
  const [launchCountryId, setLaunchCountryId] = useState(progress.countryId);
  const [launchIndex, setLaunchIndex] = useState<number | null>(selected);
  const [customStage, setCustomStage] = useState<Stage | null>(null);
  const launchCountry = getCountry(launchCountryId);
  const launchStages = getCountryStages(launchCountryId);
  const selectedCatalogStage =
    launchIndex === null ? undefined : launchStages[launchIndex];
  const selectedLaunchStage = customStage ?? selectedCatalogStage;
  const launchRules =
    selectedLaunchStage ? stageRules(selectedLaunchStage, progress.profile) : null;
  const launchUnlocked = selectedLaunchStage
    ? isStageUnlocked(progress, selectedLaunchStage, progress.profile)
    : false;
  const canStartLaunch = Boolean(selectedLaunchStage && launchUnlocked);
  const selectLaunchCountry = (countryId: string) => {
    setLaunchCountryId(countryId);
    setLaunchIndex(null);
    setCustomStage(null);
  };
  const launch = () => {
    if (!selectedLaunchStage || !canStartLaunch) return;
    onCountry(launchCountryId);
    if (customStage && onCustomStart) {
      onCustomStart(customStage);
      return;
    }
    if (launchIndex !== null) onSelect(launchIndex);
    onStart(selectedLaunchStage);
  };
  return (
    <ScrollView testID="home-screen" contentContainerStyle={s.scroll}>
      <View style={[s.container, mobile && s.mobileContainer]}>
        <View style={[s.hero, mobile && s.mobileHero]}>
          <View style={{ flex: 1, zIndex: 1 }}>
            <Text style={s.heroTag}>{t("heroTag")}</Text>
            <Text style={[s.heroTitle, mobile && s.mobileHeroTitle]}>
              {t("heroTitle")}
            </Text>
            <Text
              style={[s.heroBody, mobile && { fontSize: 14, lineHeight: 22 }]}
            >
              {t("heroBody")}
            </Text>
            <View style={s.quickLaunchCard}>
              <Eyebrow>{t("routeLauncher")}</Eyebrow>
              <View style={s.quickCountries}>
                {COUNTRIES.map((item) => (
                  <Pressable
                    key={item.id}
                    testID={`quick-country-${item.id}`}
                    accessibilityRole="button"
                    accessibilityLabel={l(item.name)}
                    aria-pressed={item.id === launchCountryId}
                    onPress={() => selectLaunchCountry(item.id)}
                    style={[
                      s.quickCountry,
                      item.id === launchCountryId && s.quickCountryActive,
                      item.status === "planned" && s.quickCountryPlanned,
                    ]}
                  >
                    <Text
                      style={[
                        s.quickCountryText,
                        item.id === launchCountryId && s.quickCountryActiveText,
                      ]}
                    >
                      {l(item.name)}
                    </Text>
                  </Pressable>
                ))}
              </View>
              {launchStages.length === 0 ? (
                <View style={s.empty}>
                  <Eyebrow>{launchCountry.nativeName.toUpperCase()}</Eyebrow>
                  <Text style={s.sectionBody}>{t("countryEmptyBody", { country: l(launchCountry.name) })}</Text>
                  <Button
                    title={t("exploreGermany")}
                    secondary
                    onPress={() => selectLaunchCountry("DE")}
                    style={{ minWidth: 240 }}
                  />
                </View>
              ) : (
                <>
                  <View style={[s.methodRow, mobile && s.methodRowMobile]}>
                    <Pressable
                      testID="open-rail-browser"
                      accessibilityRole="button"
                      onPress={() => setShowRailBrowser(true)}
                      style={s.methodCard}
                    >
                      <View style={s.methodIcon}>
                        <Icon name="map" size={24} color={C.primary} />
                      </View>
                      <Text style={s.methodTitle}>
                        {locale === "de" ? "Auf der Karte wählen" : "Choose on the map"}
                      </Text>
                      <Text style={s.methodBody}>
                        {locale === "de"
                          ? "Region, Stadt und Bahnlinie durchsuchen."
                          : "Browse regions, cities and rail lines."}
                      </Text>
                      <Text style={s.methodLink}>
                        {locale === "de" ? "Karte öffnen →" : "Open route map →"}
                      </Text>
                    </Pressable>
                    {onCustomStart && (
                      <Pressable
                        testID="open-custom-builder"
                        accessibilityRole="button"
                        onPress={() => setShowCustomBuilder(true)}
                        style={s.methodCard}
                      >
                        <View style={s.methodIcon}>
                          <Icon name="ticket" size={24} color={C.primary} />
                        </View>
                        <Text style={s.methodTitle}>
                          {locale === "de" ? "Eigene Route planen" : "Build your own route"}
                        </Text>
                        <Text style={s.methodBody}>
                          {locale === "de"
                            ? "Start und Ziel selbst festlegen."
                            : "Choose your own origin and destination."}
                        </Text>
                        <Text style={s.methodLink}>
                          {locale === "de" ? "Route erstellen →" : "Create a route →"}
                        </Text>
                      </Pressable>
                    )}
                  </View>
                  {selectedLaunchStage && (
                    <View style={s.quickSummary}>
                      <View>
                        <Text style={s.quickSummaryTitle}>
                          {l(selectedLaunchStage.areaName ?? selectedLaunchStage.city)}
                        </Text>
                        <Text style={s.quickSummaryMeta}>
                          {selectedLaunchStage.origin} →{" "}
                          {selectedLaunchStage.stations.at(-1)}
                        </Text>
                      </View>
                      <Text style={s.statValue}>
                        {t("route")} {selectedLaunchStage.line}
                      </Text>
                      <Text style={s.quickSummaryMeta}>
                        {t("stops")}: {selectedLaunchStage.stations.length}
                        {launchRules
                          ? `  ·  ${t("timeLimit")}: ${launchRules.seconds}s`
                          : ""}
                      </Text>
                      <Pressable accessibilityRole="button" onPress={onSettings}>
                        <Text style={s.settingsLinkText}>{t("settings")} ↗</Text>
                      </Pressable>
                    </View>
                  )}
                  <Button
                    testID="hero-start"
                    title={t("start")}
                    disabled={!canStartLaunch}
                    onPress={launch}
                    style={s.quickStartButton}
                  />
                  {!canStartLaunch && (
                    <Text style={s.quickRouteLockedText}>
                      {locale === "de"
                        ? "Wähle zuerst eine Route."
                        : "Choose a route before starting."}
                    </Text>
                  )}
                </>
              )}
            </View>
          </View>
          {!mobile && (
            <View style={{ width: tablet ? 300 : 390, height: 244 }}>
              <StickerScene />
            </View>
          )}
          {mobile && (
            <View pointerEvents="none" style={s.mobileSticker}>
              <Icon name="train" color={C.secondary} size={34} />
            </View>
          )}
        </View>

        {!progress.tutorialCompleted && (
          <View
            testID="tutorial-banner"
            style={{
              padding: 22,
              marginTop: 22,
              backgroundColor: C.paper,
              borderWidth: 1,
              borderColor: C.line,
              borderRadius: 12,
              gap: 12,
            }}
          >
            <Text style={s.sectionTitle}>{t("tutorialWelcome")}</Text>
            <Text style={s.sectionBody}>{t("tutorialIntro")}</Text>
            <Button
              testID="start-tutorial"
              title={t("tutorialStart")}
              secondary
              icon="play"
              onPress={onTutorial}
            />
          </View>
        )}
        <Modal
          visible={showRailBrowser}
          animationType="slide"
          onRequestClose={() => setShowRailBrowser(false)}
        >
          <View style={s.modalScreen}>
            <View style={s.modalHeader}>
              <View>
                <Eyebrow>02 / YOUR RAIL NETWORK</Eyebrow>
                <Text style={s.modalTitle}>
                  {locale === "de" ? "Route auf der Karte wählen" : "Choose a route on the map"}
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close"
                onPress={() => setShowRailBrowser(false)}
                style={s.modalClose}
              >
                <Text style={s.modalCloseText}>×</Text>
              </Pressable>
            </View>
            <ScrollView contentContainerStyle={s.modalContent}>
              <GermanyBrowser
                key={launchCountryId}
                stages={launchStages}
                selectedId={selectedCatalogStage?.id ?? ""}
                progress={progress}
                onSelect={(index) => {
                  setLaunchIndex(index);
                  setCustomStage(null);
                }}
                onRecords={onRecords}
              />
              <RailCatalogNote />
              <Button
                title={locale === "de" ? "Diese Route wählen" : "Use this route"}
                disabled={!selectedCatalogStage}
                onPress={() => setShowRailBrowser(false)}
                style={s.modalConfirm}
              />
            </ScrollView>
          </View>
        </Modal>
        {onCustomStart && (
          <Modal
            visible={showCustomBuilder}
            animationType="slide"
            onRequestClose={() => setShowCustomBuilder(false)}
          >
            <View style={s.modalScreen}>
              <View style={s.modalHeader}>
                <View>
                  <Eyebrow>02 / CUSTOM JOURNEY</Eyebrow>
                  <Text style={s.modalTitle}>
                    {locale === "de" ? "Eigene Route planen" : "Build your route"}
                  </Text>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Close"
                  onPress={() => setShowCustomBuilder(false)}
                  style={s.modalClose}
                >
                  <Text style={s.modalCloseText}>×</Text>
                </Pressable>
              </View>
              <ScrollView contentContainerStyle={s.modalContent}>
                <CustomRouteBuilder
                  progress={progress}
                  onStart={(stage) => {
                    setCustomStage(stage);
                    setLaunchIndex(null);
                    setShowCustomBuilder(false);
                  }}
                />
              </ScrollView>
            </View>
          </Modal>
        )}
        <AdSlot placement="explore" />
        <View style={s.footer}>
          <Text style={s.footerLogo}>Bahnreise.</Text>
          <Text style={s.footerText}>{t("footer")}</Text>
          <View style={{ flex: 1 }} />
          {!mobile && <Eyebrow>{t("edition")}</Eyebrow>}
        </View>
      </View>
    </ScrollView>
  );
}

export function CountryFlag({ id }: { id: string }) {
  const colors =
    id === "DE"
      ? ["#242424", "#CF4444", "#F3C54D"]
      : id === "FR"
        ? ["#335FAC", "#FFFFFF", "#E75C64"]
        : id === "NL"
          ? ["#D35659", "#FFFFFF", "#497BBD"]
          : ["#E45555", "#FFFFFF", "#E45555"];
  return (
    <Svg width={29} height={21} viewBox="0 0 30 21">
      {id === "CH" ? (
        <>
          <Rect width="30" height="21" rx="3" fill="#DF5056" />
          <Path d="M13 4h4v5h5v4h-5v5h-4v-5H8V9h5Z" fill="white" />
        </>
      ) : (
        colors.map((color, i) => (
          <Rect
            key={i}
            x={id === "FR" ? i * 10 : 0}
            y={id === "FR" ? 0 : i * 7}
            width={id === "FR" ? 10 : 30}
            height={id === "FR" ? 21 : 7}
            fill={color}
          />
        ))
      )}
      <Rect
        x=".5"
        y=".5"
        width="29"
        height="20"
        rx="2"
        fill="none"
        stroke="#00000010"
      />
    </Svg>
  );
}
function StickerScene() {
  return (
    <Svg width="100%" height="100%" viewBox="0 0 390 244">
      <Path
        d="M20 150Q37 40 153 68T344 30M87 230q-32-121 94-126t164 82"
        stroke="#A6B2F2"
        strokeWidth="2"
        strokeDasharray="4 7"
        fill="none"
        opacity=".5"
      />
      {[
        [29, 57],
        [355, 97],
        [287, 225],
        [174, 19],
        [377, 203],
        [108, 190],
      ].map(([x, y], i) => (
        <Path
          key={i}
          d={`M${x - 4} ${y}h8m-4-4v8`}
          stroke="#E4E8FF"
          strokeWidth="1.3"
        />
      ))}
      <G transform="translate(57 44) rotate(-12)">
        <Rect width="82" height="67" rx="13" fill={C.purple} />
        <Path
          d="M22 42V25q18-19 37 0v17M24 28h32M29 28v22m11-22v22m11-22v22M20 50h42"
          stroke="#391C57"
          strokeWidth="3"
          fill="none"
        />
      </G>
      <G transform="translate(252 41) rotate(12)">
        <Rect width="105" height="45" rx="8" fill="#FFCF6C" />
        <SvgText x="16" y="28" fontFamily={F.bold} fontSize="14" fill="#793400">
          BERLIN ↗
        </SvgText>
      </G>
      <G transform="translate(118 84) rotate(7)">
        <Rect
          x="4"
          y="7"
          width="128"
          height="105"
          rx="17"
          fill="#152665"
          opacity=".4"
        />
        <Rect width="128" height="105" rx="17" fill="#FFFFFF" />
        <Rect x="24" y="21" width="80" height="59" rx="17" fill={C.blue} />
        <Rect x="33" y="29" width="24" height="22" rx="4" fill="#FFFFFF" />
        <Rect x="63" y="29" width="30" height="22" rx="4" fill="#FFFFFF" />
        <Line
          x1="33"
          x2="96"
          y1="60"
          y2="60"
          stroke="#213183"
          strokeWidth="3"
        />
        <Circle cx="40" cy="77" r="7" fill="#213183" />
        <Circle cx="88" cy="77" r="7" fill="#213183" />
      </G>
      <G transform="translate(42 175) rotate(-7)">
        <Rect width="79" height="40" rx="20" fill={C.pink} />
        <SvgText x="16" y="26" fontFamily={F.bold} fontSize="13" fill="#581342">
          PARIS
        </SvgText>
      </G>
      <G transform="translate(275 145) rotate(14)">
        <Rect width="66" height="66" rx="15" fill="#8EDCB8" />
        <Path
          d="m33 13 6 12 13 2-10 9 3 14-12-7-12 7 3-14-10-9 13-2Z"
          fill="#206D51"
        />
      </G>
    </Svg>
  );
}

const s = StyleSheet.create({
  customSection: {
    marginTop: 24,
    borderWidth: 1,
    borderColor: C.line,
    backgroundColor: C.paper,
    borderRadius: 10,
    overflow: "hidden",
  },
  customToggle: {
    padding: 18,
    minHeight: 76,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  customTitle: { color: C.ink, fontFamily: F.bold, fontSize: 15 },
  scroll: { paddingBottom: 24 },
  container: {
    width: "100%",
    maxWidth: 1240,
    alignSelf: "center",
    paddingHorizontal: 32,
    paddingTop: 26,
  },
  mobileContainer: { paddingHorizontal: 18, paddingTop: 18 },
  hero: {
    backgroundColor: C.secondary,
    borderRadius: 16,
    padding: 34,
    paddingLeft: 40,
    flexDirection: "row",
    gap: 22,
    alignItems: "center",
    overflow: "hidden",
  },
  mobileHero: { padding: 25, paddingTop: 30, paddingBottom: 27 },
  heroTag: {
    fontFamily: F.medium,
    fontSize: 10,
    color: "#CDD4FF",
    letterSpacing: 1,
  },
  heroTitle: {
    fontFamily: F.bold,
    fontSize: 51,
    lineHeight: 54,
    letterSpacing: -1.8,
    color: C.paper,
    marginTop: 15,
  },
  mobileHeroTitle: { fontSize: 35, lineHeight: 39, letterSpacing: -1.1 },
  heroBody: {
    fontFamily: F.regular,
    fontSize: 15,
    lineHeight: 23,
    color: "#E0E4FF",
    maxWidth: 490,
    marginTop: 14,
  },
  heroLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 18,
    minHeight: 30,
  },
  heroLinkText: { fontFamily: F.medium, fontSize: 12, color: C.paper },
  quickLaunchCard: {
    marginTop: 16,
    backgroundColor: C.paper,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.line,
    padding: 16,
    gap: 12,
  },
  quickCountries: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  quickCountry: {
    minHeight: 32,
    paddingHorizontal: 12,
    justifyContent: "center",
    borderRadius: 7,
    borderWidth: 1,
    borderColor: C.line,
    backgroundColor: C.paper,
  },
  quickCountryActive: { borderColor: C.primary, backgroundColor: "#F4F9FE" },
  quickCountryActiveText: { color: C.primary },
  quickCountryText: {
    color: C.ink,
    fontFamily: F.medium,
    fontSize: 12,
  },
  quickCountryPlanned: { opacity: 0.66 },
  quickRoutes: { gap: 8, paddingVertical: 2 },
  quickRoute: {
    minWidth: 150,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.line,
    backgroundColor: C.paper,
    gap: 4,
  },
  quickRouteActive: {
    borderColor: C.primary,
    backgroundColor: "#F2F8FE",
  },
  quickRouteLocked: { opacity: 0.5 },
  quickRouteName: {
    fontFamily: F.medium,
    fontSize: 13,
    color: C.ink,
  },
  quickRouteActiveText: { color: C.primary },
  quickRouteMeta: {
    fontFamily: F.medium,
    fontSize: 10,
    color: C.muted,
  },
  quickSummary: {
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: C.line,
    gap: 5,
    backgroundColor: "#F8FAFD",
  },
  quickSummaryTitle: {
    fontFamily: F.bold,
    fontSize: 16,
    color: C.ink,
  },
  quickSummaryMeta: {
    marginTop: 3,
    fontFamily: F.regular,
    fontSize: 11,
    color: C.muted,
  },
  methodRow: {
    flexDirection: "row",
    gap: 12,
  },
  methodRowMobile: {
    flexDirection: "column",
  },
  methodCard: {
    flex: 1,
    minHeight: 150,
    padding: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.line,
    backgroundColor: "#FFFFFF",
  },
  methodIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EAF2FF",
    marginBottom: 12,
  },
  methodTitle: {
    fontFamily: F.bold,
    fontSize: 15,
    color: C.ink,
  },
  methodBody: {
    marginTop: 5,
    fontFamily: F.regular,
    fontSize: 11,
    lineHeight: 16,
    color: C.muted,
  },
  methodLink: {
    marginTop: 12,
    fontFamily: F.bold,
    fontSize: 11,
    color: C.primary,
  },
  modalScreen: {
    flex: 1,
    backgroundColor: C.paper,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
    paddingHorizontal: 24,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: C.line,
    backgroundColor: "#FFFFFF",
  },
  modalTitle: {
    marginTop: 4,
    fontFamily: F.bold,
    fontSize: 22,
    color: C.ink,
  },
  modalClose: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: C.line,
  },
  modalCloseText: {
    marginTop: -2,
    fontFamily: F.regular,
    fontSize: 30,
    color: C.ink,
  },
  modalContent: {
    width: "100%",
    maxWidth: 1220,
    alignSelf: "center",
    padding: 24,
    paddingBottom: 80,
  },
  modalConfirm: {
    alignSelf: "flex-end",
    minWidth: 220,
    marginTop: 24,
  },
  quickRouteLockedText: {
    fontFamily: F.medium,
    fontSize: 10,
    color: C.danger,
  },
  quickStartButton: { minHeight: 44 },
  mobileSticker: {
    position: "absolute",
    right: 21,
    top: 22,
    backgroundColor: C.purple,
    padding: 12,
    borderRadius: 12,
    transform: [{ rotate: "12deg" }],
    opacity: 0.22,
  },
  countryHeading: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 31,
    marginBottom: 15,
    gap: 10,
  },
  sectionTitle: {
    fontFamily: F.bold,
    fontSize: 24,
    letterSpacing: -0.6,
    color: C.ink,
  },
  sectionBody: {
    fontFamily: F.regular,
    fontSize: 12,
    color: C.muted,
    marginTop: 5,
  },
  countries: { gap: 10, paddingBottom: 4 },
  countryCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 13,
    backgroundColor: C.paper,
    minWidth: 181,
  },
  countryActive: { borderColor: C.primary, backgroundColor: "#F4F9FE" },
  countryName: { fontFamily: F.medium, fontSize: 13, color: C.ink },
  countryStatus: {
    fontFamily: F.regular,
    fontSize: 10,
    color: C.muted,
    marginTop: 4,
  },
  departure: { flexDirection: "row", gap: 22, marginTop: 26 },
  mapCard: {
    flex: 1,
    minWidth: 0,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 12,
    backgroundColor: C.paper,
    overflow: "hidden",
  },
  mapHeading: {
    padding: 22,
    paddingBottom: 15,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  city: {
    fontFamily: F.bold,
    fontSize: 35,
    letterSpacing: -1.1,
    color: C.ink,
    marginTop: 5,
  },
  routeBadge: {
    flexDirection: "row",
    gap: 7,
    alignItems: "center",
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 7,
    padding: 9,
  },
  routeBadgeText: { fontFamily: F.medium, fontSize: 11, color: C.ink },
  routeEnds: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 16,
  },
  routeEnd: {
    fontFamily: F.regular,
    fontSize: 10,
    color: C.muted,
    flexShrink: 1,
  },
  routeLine: { flex: 1, height: 1, backgroundColor: C.line, minWidth: 10 },
  ticket: {
    width: 326,
    borderWidth: 1,
    borderColor: C.line,
    backgroundColor: C.paper,
    borderRadius: 12,
    padding: 22,
  },
  ticketTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  ticketNumber: { fontFamily: F.medium, fontSize: 17, color: C.faint },
  level: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 16 },
  levelDot: { width: 6, height: 6, borderRadius: 6 },
  levelText: { fontFamily: F.regular, fontSize: 11, color: C.muted },
  ticketTitle: {
    fontFamily: F.bold,
    fontSize: 23,
    lineHeight: 28,
    letterSpacing: -0.7,
    color: C.ink,
    marginTop: 8,
  },
  ticketBody: {
    fontFamily: F.regular,
    fontSize: 11,
    lineHeight: 18,
    color: C.muted,
    marginTop: 7,
  },
  tripStats: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 19,
  },
  statLabel: { fontFamily: F.regular, fontSize: 10, color: C.muted },
  statValue: {
    fontFamily: F.medium,
    fontSize: 25,
    color: C.ink,
    marginTop: 6,
    letterSpacing: -0.6,
  },
  rule: { height: 1, backgroundColor: C.line, marginVertical: 18 },
  inputLabel: {
    fontFamily: F.medium,
    fontSize: 12,
    color: C.ink,
    marginBottom: 9,
  },
  inputNote: {
    fontFamily: F.regular,
    fontSize: 10,
    lineHeight: 16,
    color: C.muted,
    marginTop: 8,
    marginBottom: 15,
  },
  bonus: {
    fontFamily: F.medium,
    fontSize: 11,
    color: C.primary,
    marginBottom: 12,
  },
  passHint: {
    fontFamily: F.regular,
    fontSize: 10,
    lineHeight: 16,
    color: C.muted,
    textAlign: "center",
    marginTop: 11,
  },
  settingsLink: { alignSelf: "center", paddingTop: 10, minHeight: 32 },
  settingsLinkText: { fontFamily: F.medium, fontSize: 10, color: C.primary },
  tipRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 15,
    marginTop: 24,
  },
  tip: { flexDirection: "row", alignItems: "center", gap: 8, flex: 1 },
  tipText: {
    fontFamily: F.regular,
    fontSize: 11,
    lineHeight: 19,
    color: C.muted,
    flex: 1,
  },
  completeText: { fontFamily: F.regular, fontSize: 10, color: C.muted },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    borderTopWidth: 1,
    borderColor: C.line,
    paddingTop: 22,
    marginTop: 30,
  },
  footerLogo: {
    fontFamily: F.bold,
    fontSize: 14,
    color: C.ink,
    letterSpacing: -0.4,
  },
  footerText: { fontFamily: F.regular, fontSize: 10, color: C.muted },
  empty: {
    alignItems: "center",
    paddingVertical: 50,
    paddingHorizontal: 24,
    backgroundColor: C.paper,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 12,
    marginTop: 26,
  },
  emptySticker: {
    width: 82,
    height: 82,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    transform: [{ rotate: "-7deg" }],
    marginBottom: 25,
  },
  emptyTitle: {
    fontFamily: F.bold,
    fontSize: 29,
    textAlign: "center",
    color: C.ink,
    letterSpacing: -0.8,
    marginTop: 13,
  },
  emptyBody: {
    fontFamily: F.regular,
    fontSize: 14,
    lineHeight: 23,
    textAlign: "center",
    color: C.muted,
    maxWidth: 480,
    marginTop: 12,
    marginBottom: 24,
  },
});
