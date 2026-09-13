import { useMemo, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Button, Eyebrow, IconButton, Stars } from "../../components/ui";
import { LanguageSwitch } from "../../components/LanguageSwitch";
import { CountryFlag } from "../../components/ExplorerScreen";
import { getCountry, getCountryStages } from "../../data/countries";
import { type Progress, recordKey, routeSignature } from "../../game/progress";
import { useI18n } from "../../i18n";
import { C, F } from "../../theme";
import { AdPreferences } from "../ads/AdPreferences";

export type Panel = "help" | "records" | "settings" | null;
type Props = {
  panel: Panel;
  progress: Progress;
  onClose: () => void;
  onTutorial: () => void;
};

export function JourneyPanel(props: Props) {
  // Do not build a hidden catalog or modal tree during gameplay and home updates.
  if (props.panel === null) return null;
  return (
    <OpenJourneyPanel
      key={`${props.panel}:${props.progress.countryId}:${props.progress.profile}`}
      {...props}
    />
  );
}

function OpenJourneyPanel({ panel, progress, onClose, onTutorial }: Props) {
  const { t, l } = useI18n();
  const country = getCountry(progress.countryId);
  return (
    <Modal
      visible={panel !== null}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={s.overlay}>
        <View testID="journey-panel" accessibilityViewIsModal style={s.modal}>
          <View style={s.header}>
            <Eyebrow>
              {t(
                panel === "help"
                  ? "helpTag"
                  : panel === "settings"
                    ? "settingsTag"
                    : "journalTag",
              )}
            </Eyebrow>
            <IconButton name="close" label={t("close")} onPress={onClose} />
          </View>
          <ScrollView contentContainerStyle={s.content}>
            <Text style={s.title}>
              {t(
                panel === "help"
                  ? "helpTitle"
                  : panel === "settings"
                    ? "settings"
                    : "journal",
              )}
            </Text>
            <Text style={s.intro}>
              {t(
                panel === "help"
                  ? "helpIntro"
                  : panel === "settings"
                    ? "settingsIntro"
                    : "journalIntro",
              )}
            </Text>
            {panel === "settings" ? (
              <>
                <View style={s.row}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.label}>{t("language")}</Text>
                    <Text style={s.body}>{t("languageHint")}</Text>
                  </View>
                  <LanguageSwitch />
                </View>
                <View style={s.section}>
                  <Text style={s.label}>{t("appRules")}</Text>
                  <Text testID="detected-profile" style={s.badge}>
                    {t(
                      progress.profile === "touch"
                        ? "touchFull"
                        : "keyboardFull",
                    )}
                  </Text>
                  <Text style={s.body}>{t("fairBody")}</Text>
                </View>
                <View style={s.section}>
                  <Text style={s.label}>{t("spellingTitle")}</Text>
                  <Text style={s.body}>{t("spellingBody")}</Text>
                  <View style={s.note}>
                    <Text style={s.example}>
                      München / munchen · Straße / strasse
                    </Text>
                    <Text style={s.body}>{t("bonusExample")}</Text>
                  </View>
                </View>
                <AdPreferences />
                <Text style={s.body}>{t("settingsLocal")}</Text>
              </>
            ) : panel === "help" ? (
              <>
                {(["1", "2", "3", "4"] as const).map((number) => (
                  <View key={number} style={s.helpRow}>
                    <Text style={s.number}>0{number}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={s.label}>{t(`help${number}Title`)}</Text>
                      <Text style={s.body}>{t(`help${number}Body`)}</Text>
                    </View>
                  </View>
                ))}
                <View style={s.note}>
                  <Text style={s.label}>{t("fairTitle")}</Text>
                  <Text style={s.body}>{t("fairBody")}</Text>
                </View>
                <View style={s.section}>
                  <Text style={s.label}>{t("scoringTitle")}</Text>
                  <Text style={s.body}>{t("scoringBody")}</Text>
                  <Text style={s.body}>{t("spellingBody")}</Text>
                </View>
                <Text style={s.body}>{t("mapDisclaimer")}</Text>
              </>
            ) : (
              <>
                <View style={s.row}>
                  <CountryFlag id={country.id} />
                  <Text style={s.label}>{l(country.name)}</Text>
                </View>
                <Text style={s.badge}>
                  {t(
                    progress.profile === "touch" ? "touchFull" : "keyboardFull",
                  )}
                </Text>
                <JournalRecords progress={progress} />
                <Text style={s.body}>{t("recordHint")}</Text>
                {Object.keys(progress.archivedRecords).length > 0 && (
                  <Text style={s.body}>{t("recordsMigrated")}</Text>
                )}
              </>
            )}
            {panel !== "records" && (
              <Button
                testID="replay-tutorial"
                title={t("tutorialStart")}
                secondary
                icon="play"
                onPress={onTutorial}
                style={{ marginTop: 24 }}
              />
            )}
            <Button
              title={t("back")}
              onPress={onClose}
              style={{ marginTop: 16 }}
            />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
const JOURNAL_PAGE_SIZE = 12;

function JournalRecords({ progress }: { progress: Progress }) {
  const { t, l, n, locale } = useI18n();
  const de = locale === "de";
  const [requestedPage, setPage] = useState(0);
  const { records, outdated, planned } = useMemo(() => {
    const stages = getCountryStages(progress.countryId);
    let outdated = false;
    const records = stages.flatMap((stage) => {
      if (stage.isCustom) return [];
      const record = progress.records[recordKey(stage.id, progress.profile)];
      if (!record || record.stars < 1) return [];
      if (record.routeSignature !== routeSignature(stage)) {
        outdated = true;
        return [];
      }
      return [{ stage, record }];
    });
    records.sort(
      (a, b) =>
        b.record.completedAt.localeCompare(a.record.completedAt) ||
        a.stage.id.localeCompare(b.stage.id),
    );
    return { records, outdated, planned: stages.length === 0 };
  }, [progress.records, progress.profile, progress.countryId]);
  const pages = Math.max(1, Math.ceil(records.length / JOURNAL_PAGE_SIZE));
  const page = Math.min(requestedPage, pages - 1);
  const visible = records.slice(
    page * JOURNAL_PAGE_SIZE,
    (page + 1) * JOURNAL_PAGE_SIZE,
  );

  return (
    <View testID="journal-records">
      {records.length === 0 ? (
        <View testID="journal-empty" style={s.emptyRecords}>
          <Text style={s.label}>{t("noRecord")}</Text>
          <Text style={s.body}>
            {planned
              ? t("planned")
              : l({
                  en: "Complete a chapter to save its stars and personal best here.",
                  de: "Schließe ein Kapitel ab, um seine Sterne und deinen Rekord hier zu speichern.",
                })}
          </Text>
        </View>
      ) : (
        <>
          <Text testID="journal-record-count" style={s.body}>
            {n(records.length)}{" "}
            {de
              ? "abgeschlossene Kapitel · Zuletzt gespielt"
              : "completed chapters · Most recent first"}
          </Text>
          {pages > 1 && (
            <View style={s.pagination}>
              <Pressable
                testID="journal-page-previous"
                accessibilityRole="button"
                accessibilityLabel={
                  de ? "Vorherige Rekorde" : "Previous records"
                }
                disabled={page === 0}
                onPress={() => setPage(page - 1)}
                style={[s.pageButton, page === 0 && s.disabled]}
              >
                <Text style={s.pageText}>{de ? "Zurück" : "Previous"}</Text>
              </Pressable>
              <Text testID="journal-page-count" style={s.pageText}>
                {page + 1} / {pages}
              </Text>
              <Pressable
                testID="journal-page-next"
                accessibilityRole="button"
                accessibilityLabel={de ? "Nächste Rekorde" : "Next records"}
                disabled={page + 1 >= pages}
                onPress={() => setPage(page + 1)}
                style={[s.pageButton, page + 1 >= pages && s.disabled]}
              >
                <Text style={s.pageText}>{de ? "Weiter" : "Next"}</Text>
              </Pressable>
            </View>
          )}
          {visible.map(({ stage, record }) => (
            <View
              testID={`journal-record-${stage.id}`}
              key={stage.id}
              style={s.record}
            >
              <View style={s.recordHeading}>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={s.label}>{l(stage.title)}</Text>
                  <Text style={s.recordMeta}>
                    {stage.areaName ? l(stage.areaName) : stage.city} ·{" "}
                    {de ? "Kapitel" : "Chapter"} {stage.chapter ?? 1}/
                    {stage.chapters ?? 1}
                  </Text>
                </View>
                <Stars count={record.stars} size={15} />
              </View>
              <View style={s.routeBadge}>
                <Text style={s.publicRef}>{stage.line}</Text>
              </View>
              <Text style={s.recordRoute}>
                {stage.origin} → {stage.stations.at(-1)}
              </Text>
              <Text style={s.recordScore}>
                {t("recordDetail", {
                  score: n(record.score),
                  accuracy: n(record.accuracy * 100, 1),
                  cpm: n(record.cpm),
                })}
              </Text>
            </View>
          ))}
        </>
      )}
      {outdated && <Text style={s.body}>{t("recordsMigrated")}</Text>}
    </View>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "#15151566",
    justifyContent: "center",
    alignItems: "center",
    padding: 18,
  },
  modal: {
    width: "100%",
    maxWidth: 600,
    maxHeight: "90%",
    borderRadius: 16,
    backgroundColor: C.paper,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingLeft: 22,
    paddingRight: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: C.line,
    gap: 8,
  },
  content: { padding: 24 },
  title: { fontFamily: F.bold, fontSize: 30, letterSpacing: -1, color: C.ink },
  intro: {
    fontFamily: F.regular,
    fontSize: 14,
    lineHeight: 22,
    color: C.muted,
    marginTop: 10,
    marginBottom: 24,
  },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  label: { fontFamily: F.medium, fontSize: 15, lineHeight: 22, color: C.ink },
  body: {
    fontFamily: F.regular,
    fontSize: 12,
    lineHeight: 21,
    color: C.muted,
    marginTop: 7,
  },
  section: {
    paddingTop: 20,
    marginTop: 20,
    borderTopWidth: 1,
    borderColor: C.line,
    marginBottom: 15,
  },
  badge: {
    fontFamily: F.medium,
    fontSize: 12,
    color: C.primary,
    marginTop: 12,
    marginBottom: 8,
  },
  note: {
    padding: 16,
    marginVertical: 16,
    borderRadius: 10,
    backgroundColor: C.soft,
  },
  example: { fontFamily: F.medium, fontSize: 15, lineHeight: 23, color: C.ink },
  helpRow: { flexDirection: "row", gap: 16, marginBottom: 20 },
  number: { fontFamily: F.bold, fontSize: 18, color: C.primary },
  record: {
    gap: 7,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderColor: C.line,
  },
  recordHeading: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  recordMeta: {
    fontFamily: F.regular,
    fontSize: 11,
    lineHeight: 18,
    color: C.muted,
    marginTop: 3,
  },
  routeBadge: {
    alignSelf: "flex-start",
    maxWidth: "100%",
    borderRadius: 4,
    paddingHorizontal: 7,
    paddingVertical: 4,
    backgroundColor: "#EDF2F5",
  },
  publicRef: {
    fontFamily: F.bold,
    fontSize: 11,
    lineHeight: 16,
    color: "#24465F",
  },
  recordRoute: {
    fontFamily: F.regular,
    fontSize: 11,
    lineHeight: 18,
    color: C.muted,
  },
  recordScore: {
    fontFamily: F.medium,
    fontSize: 12,
    lineHeight: 20,
    color: C.ink,
  },
  emptyRecords: { paddingVertical: 24 },
  pagination: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    marginTop: 14,
    marginBottom: 4,
  },
  pageButton: {
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 7,
  },
  pageText: { fontFamily: F.medium, fontSize: 12, color: C.ink },
  disabled: { opacity: 0.35 },
});
