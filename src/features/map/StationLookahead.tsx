import { StyleSheet, Text, View } from "react-native";
import type { StationPreview } from "./readAhead";
import { useI18n } from "../../i18n";
import { C, F } from "../../theme";

export function StationLookahead({
  current,
  following,
  mini = false,
  narrow = false,
  onHeight,
}: {
  current?: StationPreview;
  following?: StationPreview;
  mini?: boolean;
  narrow?: boolean;
  onHeight: (height: number) => void;
}) {
  const { locale } = useI18n();
  const words =
    locale === "de"
      ? {
          current: "Jetzt tippen",
          following: "Danach",
          end: "Ende der Route",
          arriving: "Ziel erreicht",
          outside: "außerhalb",
        }
      : {
          current: "Type now",
          following: "Up next",
          end: "End of route",
          arriving: "Destination reached",
          outside: "off map",
        };
  return (
    <View
      testID="map-lookahead"
      pointerEvents="none"
      style={[
        s.strip,
        {
          top: mini ? 8 : 14,
          left: mini ? 8 : 14,
          right: narrow ? (mini ? 8 : 14) : 170,
          maxWidth: 760,
        },
        mini && s.miniStrip,
      ]}
      onLayout={({ nativeEvent }) =>
        onHeight(Math.ceil(nativeEvent.layout.height))
      }
    >
      {[
        {
          key: "current",
          station: current,
          heading: words.current,
          end: words.arriving,
        },
        {
          key: "next",
          station: following,
          heading: words.following,
          end: words.end,
        },
      ].map(({ key, station, heading, end }, index) => (
        <View
          key={key}
          style={[s.cell, index === 1 && s.followingCell, mini && s.miniCell]}
        >
          <View style={s.headingRow}>
            <View
              style={[
                s.dot,
                { backgroundColor: index === 0 ? C.primary : C.secondary },
              ]}
            />
            <Text style={[s.heading, mini && { fontSize: 9 }]}>{heading}</Text>
            {station?.offscreenArrow && (
              <Text
                style={s.direction}
                accessibilityLabel={`${station.offscreenArrow} · ${words.outside}`}
              >
                {station.offscreenArrow}
              </Text>
            )}
          </View>
          <Text
            testID={`map-${key}-station`}
            style={[s.name, mini && s.miniName, !station && s.end]}
          >
            {station?.name ?? end}
          </Text>
        </View>
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  strip: {
    position: "absolute",
    flexDirection: "row",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#D3DEE3",
    backgroundColor: "rgba(255,255,255,0.97)",
    overflow: "hidden",
    boxShadow: "0 3px 10px rgba(23,59,90,0.08)",
  },
  miniStrip: { borderRadius: 8 },
  cell: {
    flex: 1,
    minWidth: 0,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 4,
  },
  miniCell: { paddingHorizontal: 9, paddingVertical: 6, gap: 2 },
  followingCell: {
    borderLeftWidth: 1,
    borderLeftColor: "#DFE6E9",
    backgroundColor: "#F7FAFC",
  },
  headingRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  dot: { width: 5, height: 5, borderRadius: 3 },
  heading: {
    color: C.muted,
    fontFamily: F.medium,
    fontSize: 10,
    lineHeight: 13,
  },
  direction: {
    marginLeft: "auto",
    color: C.primary,
    fontFamily: F.bold,
    fontSize: 14,
    lineHeight: 14,
  },
  name: {
    fontFamily: F.bold,
    color: "#173B5A",
    fontSize: 15,
    lineHeight: 20,
    flexShrink: 1,
  },
  miniName: { fontSize: 11, lineHeight: 15 },
  end: { fontFamily: F.regular, color: C.muted },
});
