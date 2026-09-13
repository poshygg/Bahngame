import { useMemo } from "react";
import { Modal, ScrollView, StyleSheet, Text, View } from "react-native";
import { Eyebrow, Icon, IconButton } from "../../components/ui";
import type { InputProfile } from "../../data/stages";
import type { Progress } from "../../game/progress";
import { useI18n } from "../../i18n";
import { C, F } from "../../theme";
import { deriveAchievements, type Achievement } from "./deriveAchievements";

export function AchievementsPanel({
  progress,
  profile,
  onClose,
}: {
  progress: Progress;
  profile: InputProfile;
  onClose: () => void;
}) {
  const { l, locale, n } = useI18n();
  const de = locale === "de";
  const passport = useMemo(
    () => deriveAchievements(progress, profile),
    [progress.records, profile],
  );
  return (
    <Modal visible transparent animationType="none" onRequestClose={onClose}>
      <View style={s.overlay}>
        <View
          testID="achievements-panel"
          accessibilityViewIsModal
          style={s.modal}
        >
          <View style={s.header}>
            <Eyebrow>{de ? "DEIN REISEPASS" : "YOUR TRAVEL PASSPORT"}</Eyebrow>
            <IconButton
              name="close"
              label={de ? "Schließen" : "Close"}
              onPress={onClose}
            />
          </View>
          <ScrollView contentContainerStyle={s.content}>
            <View style={s.cover}>
              <Icon name="ticket" size={35} color="#FFFFFF" />
              <Text style={s.title}>
                {de
                  ? "Ein Pass voller Reisen."
                  : "A passport full of journeys."}
              </Text>
              <Text style={s.coverBody}>
                {de
                  ? "Sammle Stadtsiegel und entdecke neue Kombinationen."
                  : "Collect city stamps and discover new combinations."}
              </Text>
              <Text testID="passport-progress" style={s.coverMeta}>
                {passport.earned} / {passport.total}{" "}
                {de ? "Abzeichen" : "achievements"} ·{" "}
                {n(passport.passedChapters)}{" "}
                {de ? "bestandene Kapitel" : "passed chapters"}
              </Text>
            </View>
            <Text style={s.profile}>
              {profile === "touch"
                ? de
                  ? "Mobile Touch-Version"
                  : "Mobile touch edition"
                : de
                  ? "PC-Version"
                  : "PC edition"}
            </Text>
            <Text style={s.note}>
              {de
                ? "Es zählen nur bestandene Kapitel der aktuellen Streckenversion in dieser Ausgabe. Wiederholungen zählen einmal. Alte, fehlgeschlagene und eigene Routen zählen nicht."
                : "Only passed chapters on the current route version in this edition count. Replays count once. Retired, failed and custom routes do not count."}
            </Text>
            <Text style={s.sectionTitle}>
              {de ? "Reisekombinationen" : "Journey combinations"}
            </Text>
            <Text style={s.note}>
              {de
                ? "Bestehe je ein Kapitel für jede genannte Bedingung."
                : "Pass a chapter for each listed requirement."}
            </Text>
            <View style={s.cards}>
              {passport.combinations.map((item) => (
                <AchievementCard key={item.id} item={item} />
              ))}
            </View>
            <Text style={s.sectionTitle}>
              {de ? "Stadtsiegel" : "City stamps"}
            </Text>
            <Text style={s.note}>
              {de
                ? "Ein Stadtsiegel erhältst du nach allen Kapiteln des jeweiligen Stadtnetzes. Der Zähler zeigt deinen Fortschritt."
                : "Earn a city stamp by passing every chapter in that city network. The counter shows your progress."}
            </Text>
            <View style={s.cards}>
              {passport.cityStamps.map((item) => (
                <AchievementCard key={item.id} item={item} stamp />
              ))}
            </View>
            {passport.total === 0 && (
              <Text style={s.note}>
                {l({
                  en: "Achievements will appear when campaign routes are available.",
                  de: "Abzeichen erscheinen, sobald Kampagnenstrecken verfügbar sind.",
                })}
              </Text>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function AchievementCard({
  item,
  stamp = false,
}: {
  item: Achievement;
  stamp?: boolean;
}) {
  const { l, locale } = useI18n();
  return (
    <View
      testID={`achievement-${item.id}`}
      style={[s.card, item.earned && s.earnedCard]}
    >
      <View style={s.cardHeader}>
        <View style={[s.seal, item.earned && s.earnedSeal]}>
          <Icon
            name={item.earned ? "check" : stamp ? "map" : "train"}
            size={21}
            color={item.earned ? "#FFFFFF" : C.primary}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.cardTitle}>{l(item.title)}</Text>
          <Text testID={`achievement-status-${item.id}`} style={s.status}>
            {item.earned
              ? locale === "de"
                ? "Verdient"
                : "Earned"
              : locale === "de"
                ? "In Arbeit"
                : "In progress"}
          </Text>
        </View>
        <Text testID={`achievement-progress-${item.id}`} style={s.counter}>
          {item.current}/{item.target}
        </Text>
      </View>
      {item.criteria.map((criterion) => (
        <View key={criterion.id} style={s.criterion}>
          <Text style={s.criterionText}>{l(criterion.label)}</Text>
          <Text style={s.criterionCount}>
            {criterion.current}/{criterion.target}
          </Text>
        </View>
      ))}
      <View style={s.track}>
        <View
          style={[
            s.fill,
            {
              width: `${item.target ? (item.current / item.target) * 100 : 0}%`,
              backgroundColor: item.earned ? C.green : C.primary,
            },
          ]}
        />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    padding: 18,
    backgroundColor: "#15151566",
    justifyContent: "center",
    alignItems: "center",
  },
  modal: {
    width: "100%",
    maxWidth: 680,
    maxHeight: "92%",
    backgroundColor: C.paper,
    borderRadius: 16,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingLeft: 20,
    paddingRight: 8,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: C.line,
  },
  content: { padding: 20, paddingBottom: 30 },
  cover: { backgroundColor: "#213183", padding: 24, borderRadius: 12, gap: 10 },
  title: { fontFamily: F.bold, fontSize: 25, lineHeight: 32, color: "#FFFFFF" },
  coverBody: {
    fontFamily: F.regular,
    fontSize: 13,
    lineHeight: 20,
    color: "#E1E6FC",
  },
  coverMeta: {
    fontFamily: F.medium,
    fontSize: 11,
    lineHeight: 18,
    color: "#FFFFFF",
    marginTop: 8,
  },
  profile: {
    fontFamily: F.bold,
    fontSize: 11,
    color: C.primary,
    marginTop: 18,
  },
  note: {
    fontFamily: F.regular,
    fontSize: 12,
    lineHeight: 20,
    color: C.muted,
    marginTop: 7,
    marginBottom: 12,
  },
  sectionTitle: {
    fontFamily: F.bold,
    fontSize: 20,
    color: C.ink,
    marginTop: 20,
  },
  cards: { gap: 10 },
  card: {
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 10,
    padding: 14,
    gap: 10,
  },
  earnedCard: { borderColor: "#B5D0BD", backgroundColor: "#F2F7F1" },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  seal: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#ECF2FA",
    alignItems: "center",
    justifyContent: "center",
  },
  earnedSeal: { backgroundColor: C.green },
  cardTitle: { fontFamily: F.bold, fontSize: 14, lineHeight: 20, color: C.ink },
  status: {
    fontFamily: F.medium,
    fontSize: 10,
    lineHeight: 16,
    color: C.muted,
    marginTop: 2,
  },
  counter: { fontFamily: F.bold, fontSize: 12, color: C.primary },
  criterion: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  criterionText: {
    flex: 1,
    fontFamily: F.regular,
    fontSize: 11,
    lineHeight: 18,
    color: C.muted,
  },
  criterionCount: {
    fontFamily: F.medium,
    fontSize: 11,
    lineHeight: 18,
    color: C.muted,
  },
  track: {
    height: 5,
    borderRadius: 3,
    backgroundColor: "#E9ECED",
    overflow: "hidden",
    marginTop: 2,
  },
  fill: { height: "100%" },
});
