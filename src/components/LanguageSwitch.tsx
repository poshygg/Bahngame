import { Pressable, StyleSheet, Text, View } from "react-native";
import { useI18n } from "../i18n";
import { C, F } from "../theme";

export function LanguageSwitch() {
  const { locale, setLocale, t } = useI18n();
  return (
    <View
      style={s.root}
      accessibilityRole="radiogroup"
      accessibilityLabel={t("language")}
    >
      {(["en", "de"] as const).map((value) => (
        <Pressable
          key={value}
          testID={`language-${value}`}
          accessibilityRole="radio"
          accessibilityLabel={value === "en" ? "English" : "Deutsch"}
          aria-checked={value === locale}
          onPress={() => setLocale(value)}
          style={[s.option, value === locale && s.active]}
        >
          <Text style={[s.label, value === locale && { color: C.primary }]}>
            {value.toUpperCase()}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
const s = StyleSheet.create({
  root: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 8,
    padding: 3,
    backgroundColor: C.paper,
  },
  option: {
    minWidth: 39,
    minHeight: 38,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 5,
  },
  active: { backgroundColor: "#EAF4FF" },
  label: { fontFamily: F.medium, fontSize: 11, color: C.muted },
});
