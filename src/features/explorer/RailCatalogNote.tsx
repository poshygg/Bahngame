import { Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { RAIL_CATALOG } from "../../data/rail/catalog";
import { useI18n } from "../../i18n";
import { C, F } from "../../theme";

export function RailCatalogNote() {
  const { l, n } = useI18n();
  return (
    <View style={s.note}>
      <Text style={s.text}>
        {l({
          en: `${n(RAIL_CATALOG.stations.length)} stops · ${n(RAIL_CATALOG.lines.length)} mapped service variants · Snapshot ${RAIL_CATALOG.checkedAt}`,
          de: `${n(RAIL_CATALOG.stations.length)} Haltestellen · ${n(RAIL_CATALOG.lines.length)} erfasste Linienvarianten · Datenstand ${RAIL_CATALOG.checkedAt}`,
        })}
      </Text>
      <Text style={s.text}>
        {l({
          en: "DB and other operators. A selection across all 16 states; not a complete network or live timetable.",
          de: "DB und weitere Betreiber. Eine Auswahl aus allen 16 Bundesländern; kein vollständiges Netz oder Live-Fahrplan.",
        })}
      </Text>
      <View style={s.links}>
        <Pressable
          accessibilityRole="link"
          onPress={() =>
            void Linking.openURL("https://www.openstreetmap.org/copyright")
          }
          style={s.link}
        >
          <Text style={s.linkText}>© OpenStreetMap contributors ↗</Text>
        </Pressable>
        <Pressable
          accessibilityRole="link"
          onPress={() => void Linking.openURL(RAIL_CATALOG.license.url)}
          style={s.link}
        >
          <Text style={s.linkText}>ODbL 1.0 ↗</Text>
        </Pressable>
      </View>
    </View>
  );
}
const s = StyleSheet.create({
  note: { marginTop: 15, gap: 3 },
  text: { fontFamily: F.regular, color: C.muted, fontSize: 11, lineHeight: 17 },
  links: { flexDirection: "row", flexWrap: "wrap", gap: 16 },
  link: { minHeight: 36, justifyContent: "center" },
  linkText: { fontFamily: F.regular, color: C.primary, fontSize: 11 },
});
