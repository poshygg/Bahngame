import { useEffect, useRef, useState, type RefObject } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import type { Stage } from "../../data/stages";
import {
  currentStation,
  inputTarget,
  runStats,
  type Run,
} from "../../game/engine";
import { useI18n } from "../../i18n";
import { C, F } from "../../theme";
import { useTypingInput } from "./useTypingInput";

export function TypingCard({
  stage,
  run,
  input,
  pause,
  inputRef,
  compact = false,
}: {
  compact?: boolean;
  stage: Stage;
  run: Run;
  input: (char: string) => void;
  pause?: () => void;
  inputRef: RefObject<TextInput | null>;
}) {
  const { t, n } = useI18n();
  const arrived = run.finishReason === "arrived";
  const current = arrived
    ? (stage.stations.at(-1) ?? stage.origin)
    : currentStation(stage, run);
  const target = inputTarget(current);
  const cursor = arrived ? target.length : run.cursor;
  const prefix = target.slice(0, cursor);
  const stats = runStats(run, stage);
  const { notice, onText, value } = useTypingInput(
    inputRef,
    prefix,
    run,
    input,
    pause,
  );
  const wrongRef = useRef(run.mistakes);
  const [wrong, setWrong] = useState(false);
  const targetScroll = useRef<ScrollView>(null);
  const [targetWidth, setTargetWidth] = useState(0);
  const [targetViewportWidth, setTargetViewportWidth] = useState(0);
  useEffect(() => {
    // A measured monospace line keeps the active letter and following text in
    // view at every font scale, without growing over the map or keyboard.
    const letterWidth = target.length ? targetWidth / target.length : 0;
    const maximum = Math.max(0, targetWidth - targetViewportWidth);
    targetScroll.current?.scrollTo({
      x: Math.min(
        maximum,
        Math.max(0, cursor * letterWidth - targetViewportWidth * 0.3),
      ),
      animated: false,
    });
  }, [cursor, target, targetWidth, targetViewportWidth]);
  useEffect(() => {
    if (run.mistakes <= wrongRef.current) return;
    wrongRef.current = run.mistakes;
    setWrong(true);
    const timer = setTimeout(() => setWrong(false), 260);
    return () => clearTimeout(timer);
  }, [run.mistakes]);
  return (
    <Pressable
      testID="typing-console"
      onPress={() => inputRef.current?.focus()}
      style={[
        s.typeCard,
        compact && s.compactCard,
        wrong && { borderColor: C.danger, backgroundColor: "#FFF7F2" },
      ]}
      accessibilityRole="none"
    >
      <View
        testID={!run.originCompleted ? "origin-typing" : undefined}
        style={s.typeHeader}
      >
        <Text
          testID="typing-station-name"
          style={[s.stationName, target.length > 30 && s.longStationName]}
        >
          {current}
        </Text>
        <Text style={s.combo}>
          {run.combo > 0 ? `${run.combo} ${t("combo")}` : t("readyDepart")}
        </Text>
      </View>
      <ScrollView
        ref={targetScroll}
        testID="typing-target-window"
        horizontal
        keyboardShouldPersistTaps="always"
        bounces={false}
        showsHorizontalScrollIndicator={false}
        style={s.targetWindow}
        onLayout={({ nativeEvent }) =>
          setTargetViewportWidth(nativeEvent.layout.width)
        }
        onContentSizeChange={(width) => setTargetWidth(width)}
      >
        <Text
          testID="typing-target"
          selectable={false}
          numberOfLines={1}
          style={s.target}
        >
          {Array.from(target).map((char, index) => (
            <Text
              key={index}
              testID={index === cursor ? "typing-cursor" : undefined}
              style={
                index < cursor
                  ? s.typed
                  : index === cursor
                    ? [
                        s.cursor,
                        wrong && { backgroundColor: C.danger, color: "white" },
                      ]
                    : s.untyped
              }
            >
              {char === " " ? "␣" : char}
            </Text>
          ))}
        </Text>
      </ScrollView>
      <TextInput
        ref={inputRef}
        testID="station-input"
        accessibilityLabel={t("inputLabel")}
        accessibilityHint={t("inputHint")}
        value={value}
        onChangeText={onText}
        autoFocus
        autoCapitalize="none"
        autoCorrect={false}
        spellCheck={false}
        autoComplete="off"
        textContentType="none"
        importantForAutofill="no"
        contextMenuHidden
        keyboardType="default"
        returnKeyType="done"
        blurOnSubmit={false}
        onSubmitEditing={() => inputRef.current?.focus()}
        editable={run.status === "playing"}
        placeholder={t("inputPlaceholder")}
        placeholderTextColor={C.muted}
        style={s.input}
      />
      <Text testID="live-original-bonus" style={s.bonus}>
        {t("bonusLive", {
          count: run.originalCharacters,
          score: n(stats.originalBonus),
        })}
      </Text>
      {(!compact || notice) && (
        <Text
          numberOfLines={2}
          style={[s.inputHint, notice && { color: C.orange }]}
        >
          {notice || t("specialHint")}
        </Text>
      )}
    </Pressable>
  );
}

const s = StyleSheet.create({
  typeCard: {
    borderWidth: 1,
    borderColor: C.line,
    backgroundColor: C.paper,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  compactCard: { paddingHorizontal: 11, paddingVertical: 8 },
  typeHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    minHeight: 20,
  },
  combo: {
    fontFamily: F.medium,
    fontSize: 8,
    letterSpacing: 0.5,
    color: C.muted,
    alignSelf: "flex-start",
    paddingTop: 4,
  },
  stationName: {
    flex: 1,
    minWidth: 0,
    fontSize: 16,
    lineHeight: 21,
    fontFamily: F.medium,
    color: C.ink,
    letterSpacing: -0.3,
  },
  longStationName: { fontSize: 14, lineHeight: 19 },
  targetWindow: {
    flexGrow: 0,
    marginTop: 3,
    marginBottom: 6,
  },
  target: {
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    fontSize: 19,
    lineHeight: 26,
    letterSpacing: 0.4,
    flexShrink: 0,
  },
  typed: { color: C.green },
  untyped: { color: C.muted },
  cursor: {
    color: C.ink,
    backgroundColor: "#E8F2FC",
    textDecorationLine: "underline",
  },
  input: {
    minHeight: 44,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 7,
    paddingHorizontal: 11,
    paddingVertical: 9,
    fontSize: 16,
    color: C.ink,
    fontFamily: F.mono,
    backgroundColor: C.paper,
  },
  inputHint: {
    fontFamily: F.regular,
    fontSize: 9,
    lineHeight: 13,
    color: C.muted,
    marginTop: 2,
  },
  bonus: {
    fontFamily: F.medium,
    fontSize: 10,
    lineHeight: 15,
    color: C.primary,
    marginTop: 5,
  },
});
