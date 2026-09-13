import { Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { C, F } from "../../theme";

export function MapAttribution({ mini = false }: { mini?: boolean }) {
  return (
    <View style={s.row}>
      {[
        ["OpenFreeMap", "https://openfreemap.org/"],
        ["© OpenMapTiles", "https://openmaptiles.org/"],
        ["Data from OpenStreetMap", "https://www.openstreetmap.org/copyright"],
      ].map(([label, url]) => (
        <Pressable
          key={label}
          accessibilityRole="link"
          onPress={() => {
            void Linking.openURL(url).catch(() => {});
          }}
          style={{ minHeight: mini ? 24 : 30, justifyContent: "center" }}
        >
          <Text style={s.text}>{label}</Text>
        </Pressable>
      ))}
    </View>
  );
}
const s = StyleSheet.create({
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 5,
    justifyContent: "flex-end",
  },
  text: { fontFamily: F.regular, fontSize: 9, lineHeight: 13, color: C.muted },
});
