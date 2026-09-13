import { memo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Svg, { Circle, G, Path, Text as SvgText } from "react-native-svg";
import {
  GERMAN_REGIONS,
  GERMANY_MAP_VIEWBOX,
} from "../../data/germany-regions";
import { useI18n } from "../../i18n";
import { C, F } from "../../theme";

export const GermanyMap = memo(function GermanyMap({
  selectedRegion,
  counts,
  onRegion,
}: {
  selectedRegion: string | null;
  counts: Record<string, number>;
  onRegion: (regionId: string | null) => void;
}) {
  const { locale, l } = useI18n();
  return (
    <View testID="germany-region-map" style={s.card}>
      <View style={s.heading}>
        <Text style={s.eyebrow}>
          {locale === "de" ? "16 BUNDESLÄNDER" : "16 FEDERAL STATES"}
        </Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => onRegion(null)}
          style={s.reset}
          testID="region-all"
        >
          <Text style={s.resetText}>{locale === "de" ? "Alle" : "All"}</Text>
        </Pressable>
      </View>
      <Svg
        width="100%"
        height={365}
        viewBox={GERMANY_MAP_VIEWBOX}
        accessibilityLabel={
          locale === "de"
            ? "Bundesländer Deutschlands auswählen"
            : "Choose a German federal state"
        }
      >
        {/* Keep SVG groups as <g>: React Native Web converts button roles to HTML tags.
            The accompanying full-name region list supplies keyboard-accessible buttons. */}
        {GERMAN_REGIONS.map((region) => {
          const selected = region.id === selectedRegion;
          const hasRoutes = (counts[region.id] ?? 0) > 0;
          return (
            <G
              key={region.id}
              testID={`region-map-${region.id}`}
              accessibilityLabel={l(region.name)}
              onPress={() => onRegion(selected ? null : region.id)}
            >
              {region.paths.map((path, index) => (
                <Path
                  key={index}
                  d={path}
                  fill={
                    selected ? C.primary : hasRoutes ? "#E6EEF5" : "#F2F2EF"
                  }
                  stroke="#FFFFFF"
                  strokeWidth={2.6}
                  strokeLinejoin="round"
                />
              ))}
            </G>
          );
        })}
        {GERMAN_REGIONS.map((region) => {
          const selected = region.id === selectedRegion;
          return (
            <G
              key={`label-${region.id}`}
              onPress={() => onRegion(selected ? null : region.id)}
              accessibilityLabel={l(region.name)}
            >
              {region.paths.length > 0 && (
                <Circle
                  cx={region.labelPoint.x}
                  cy={region.labelPoint.y}
                  r={14}
                  fill={selected ? "#FFFFFF" : "#173B5A"}
                  opacity={0.95}
                />
              )}
              <SvgText
                x={region.labelPoint.x}
                y={region.labelPoint.y + 5.5}
                textAnchor="middle"
                fontFamily={F.bold}
                fontSize={15}
                fill={selected ? C.primary : "#FFFFFF"}
              >
                {region.id.slice(3)}
              </SvgText>
            </G>
          );
        })}
      </Svg>
      <Text style={s.note}>
        {locale === "de"
          ? "Wähle ein Bundesland auf der Karte."
          : "Choose a region on the map."}
      </Text>
      <Text style={s.credit}>Natural Earth · Public domain</Text>
    </View>
  );
});

const s = StyleSheet.create({
  card: {
    borderRadius: 12,
    backgroundColor: "#F4F6F4",
    borderWidth: 1,
    borderColor: C.line,
    padding: 14,
  },
  heading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  eyebrow: {
    color: C.muted,
    fontFamily: F.bold,
    fontSize: 10,
    letterSpacing: 1,
  },
  reset: { minHeight: 44, paddingHorizontal: 10, justifyContent: "center" },
  resetText: { color: C.primary, fontFamily: F.bold, fontSize: 12 },
  note: {
    color: C.muted,
    fontFamily: F.regular,
    fontSize: 11,
    lineHeight: 17,
    textAlign: "center",
  },
  credit: {
    color: C.faint,
    fontFamily: F.regular,
    fontSize: 9,
    textAlign: "center",
    marginTop: 7,
  },
});
