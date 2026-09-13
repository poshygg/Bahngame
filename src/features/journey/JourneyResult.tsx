import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Button, Eyebrow, Icon, Stars } from "../../components/ui";
import type { Stage } from "../../data/stages";
import { type Run, runStats } from "../../game/engine";
import { useI18n } from "../../i18n";
import { C, F } from "../../theme";
import { AdSlot } from "../ads/AdSlot";
export function JourneyResult({
  stage,
  run,
  onHome,
  onRetry,
  onNext,
}: {
  stage: Stage;
  run: Run;
  onHome: () => void;
  onRetry: () => void;
  onNext?: () => void;
}) {
  const { t, l, n } = useI18n();
  const stats = runStats(run, stage);
  const next = stats.thresholds.find((n) => n > stats.score);
  return (
    <ScrollView contentContainerStyle={s.resultPage}>
      <View testID="result-screen" style={s.resultCard}>
        <View style={s.resultTop}>
          <Icon name="ticket" color={C.green} />
          <Eyebrow>BAHNREISE · {t("receipt")}</Eyebrow>
          <Text style={s.receiptNo}>#{stage.line}</Text>
        </View>
        <View style={s.resultBody}>
          <Eyebrow color={stats.passed ? C.green : C.danger}>
            {stats.passed ? t("welcome") : t("practice")}
          </Eyebrow>
          <Text testID="result-title" style={s.resultTitle}>
            {stats.passed
              ? t("success")
              : run.finishReason === "timeout"
                ? t("timeout")
                : t("lowScore")}
          </Text>
          <Text style={s.resultSub}>
            {l(stage.title)} ·{" "}
            {t(run.profile === "touch" ? "touchFull" : "keyboardFull")}
          </Text>
          {stats.originalBonus > 0 && (
            <Text style={{ fontSize: 12, color: C.primary, marginTop: 12 }}>
              {t("bonusEarned", {
                score: n(stats.originalBonus),
                count: run.originalCharacters,
              })}
            </Text>
          )}
          <View style={s.resultStars}>
            <Stars count={stats.stars} size={47} />
          </View>
          <Text testID="result-score" style={s.resultScore}>
            {n(stats.score)}
            <Text style={s.resultPts}> {t("pointsShort")}</Text>
          </Text>
          <Text style={s.resultReason}>
            {stats.passed
              ? stats.stars === 3
                ? t("perfect")
                : t("passedNext", {
                    score: n((next ?? stats.score) - stats.score),
                  })
              : run.finishReason === "timeout"
                ? t("timeoutReason")
                : t("scoreReason", {
                    score: n(stats.thresholds[0]),
                    missing: n(Math.max(0, stats.thresholds[0] - stats.score)),
                  })}
          </Text>
        </View>
        <View style={s.receiptDivider} />
        <View style={s.resultMetrics}>
          {[
            [t("accuracy"), `${n(stats.accuracy * 100, 1)}%`],
            [t("typingSpeed"), `${n(stats.cpm)} ${t("cpm")}`],
            [t("travelTime"), `${n(run.elapsedMs / 1000, 1)} s`],
            [t("bestCombo"), t("letterCount", { count: run.maxCombo })],
          ].map(([label, value]) => (
            <View key={label} style={s.metric}>
              <Text style={s.metricLabel}>{label}</Text>
              <Text style={s.metricValue}>{value}</Text>
            </View>
          ))}
        </View>
        <View style={s.resultActions}>
          {onNext ? (
            <Button
              title={t(stage.campaignId ? "nextChapter" : "nextCity")}
              onPress={onNext}
            />
          ) : (
            <Button title={t("retry")} icon="repeat" onPress={onRetry} />
          )}
          <Button
            title={onNext ? t("retryStars") : t("viewMap")}
            secondary
            icon={onNext ? "repeat" : "map"}
            onPress={onNext ? onRetry : onHome}
          />
          {onNext && (
            <Pressable
              accessibilityRole="button"
              onPress={onHome}
              style={s.leaveButton}
            >
              <Text style={s.leaveText}>{t("viewMap")}</Text>
            </Pressable>
          )}
        </View>
        <View style={s.barcode}>
          {Array.from({ length: 48 }, (_, i) => (
            <View
              key={i}
              style={{
                width: i % 3 === 0 ? 3 : 1,
                height: 24,
                backgroundColor: "#87977B",
                opacity: 0.45,
              }}
            />
          ))}
        </View>
        <Text style={s.receiptFoot}>{t("receiptFoot")}</Text>
      </View>
      <AdSlot placement="result" />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  leaveButton: { padding: 13, alignItems: "center" },
  leaveText: { fontSize: 11, color: C.muted, textDecorationLine: "underline" },
  resultPage: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 22,
    paddingVertical: 42,
  },
  resultCard: {
    width: "100%",
    maxWidth: 500,
    backgroundColor: C.paper,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 17,
    overflow: "hidden",
  },
  resultTop: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderColor: C.line,
  },
  receiptNo: {
    fontFamily: F.medium,
    fontSize: 16,
    color: C.muted,
    marginLeft: "auto",
  },
  resultBody: { padding: 28, alignItems: "center", paddingBottom: 23 },
  resultTitle: {
    fontSize: 24,
    color: C.ink,
    fontWeight: "700",
    textAlign: "center",
    marginTop: 16,
    letterSpacing: -0.8,
  },
  resultSub: { fontSize: 10, color: C.muted, marginTop: 10 },
  resultStars: { marginTop: 26, marginBottom: 18 },
  resultScore: {
    fontSize: 55,
    fontFamily: F.medium,
    letterSpacing: -2,
    color: C.ink,
  },
  resultPts: { fontSize: 12, color: C.muted, letterSpacing: 1 },
  resultReason: {
    fontSize: 11,
    lineHeight: 20,
    color: C.muted,
    textAlign: "center",
    marginTop: 10,
  },
  receiptDivider: {
    borderTopWidth: 1,
    borderColor: C.line,
    borderStyle: "dashed",
  },
  resultMetrics: {
    padding: 25,
    flexDirection: "row",
    flexWrap: "wrap",
    rowGap: 23,
  },
  metric: { width: "50%", alignItems: "center" },
  metricLabel: { fontSize: 10, color: C.muted, marginBottom: 5 },
  metricValue: { fontFamily: F.medium, fontSize: 20, color: C.ink },
  resultActions: { paddingHorizontal: 28, gap: 11 },
  barcode: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 3,
    marginTop: 27,
  },
  receiptFoot: {
    fontFamily: F.medium,
    fontSize: 7,
    letterSpacing: 1,
    color: C.muted,
    textAlign: "center",
    padding: 14,
    paddingBottom: 24,
  },
});
