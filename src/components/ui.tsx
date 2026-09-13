import { useI18n } from "../i18n";
import React from "react";
import { Pressable, StyleSheet, Text, View, ViewStyle } from "react-native";
import Svg, { Circle, Line, Path, Polyline, Rect } from "react-native-svg";
import { C, F } from "../theme";

export type IconName =
  | "settings"
  | "train"
  | "map"
  | "ticket"
  | "arrow"
  | "keyboard"
  | "phone"
  | "clock"
  | "lock"
  | "check"
  | "close"
  | "pause"
  | "play"
  | "help"
  | "back"
  | "repeat"
  | "flag"
  | "spark"
  | "headphones";
export function Icon({
  name,
  size = 22,
  color = C.ink,
}: {
  name: IconName;
  size?: number;
  color?: string;
}) {
  const p = {
    stroke: color,
    strokeWidth: 1.65,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    fill: "none",
  };
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {name === "settings" && (
        <>
          <Path
            d="m9 3-1 3-3 1-2 3 2 2-1 3 3 2 2-1 3 2 3-2 2 1 3-2-1-3 2-2-2-3-3-1-1-3Z"
            {...p}
          />
          <Circle cx="12" cy="11" r="3" {...p} />
        </>
      )}
      {name === "train" && (
        <>
          <Rect x="5" y="3" width="14" height="15" rx="4" {...p} />
          <Path d="M5 11h14M9 3v8M15 3v8M8 21l2-3m6 3-2-3" {...p} />
          <Circle cx="8.5" cy="14.5" r="1" fill={color} />
          <Circle cx="15.5" cy="14.5" r="1" fill={color} />
        </>
      )}
      {name === "map" && (
        <>
          <Path d="m3 5 6-2 6 2 6-2v16l-6 2-6-2-6 2ZM9 3v16m6-14v16" {...p} />
        </>
      )}
      {name === "ticket" && (
        <>
          <Path d="M3 5h18v5a2 2 0 0 0 0 4v5H3v-5a2 2 0 0 0 0-4Z" {...p} />
          <Path d="M15 5v2m0 3v4m0 3v2M7 9h4m-4 5h4" {...p} />
        </>
      )}
      {name === "arrow" && <Path d="M4 12h16m-6-6 6 6-6 6" {...p} />}
      {name === "back" && <Path d="M20 12H4m6-6-6 6 6 6" {...p} />}
      {name === "keyboard" && (
        <>
          <Rect x="2" y="5" width="20" height="14" rx="3" {...p} />
          <Path
            d="M6 9h.1m3.9 0h.1m3.9 0h.1m3.9 0h.1M6 12h.1m3.9 0h.1m3.9 0h.1m3.9 0h.1M7 15h10"
            {...p}
          />
        </>
      )}
      {name === "phone" && (
        <>
          <Rect x="6" y="2" width="12" height="20" rx="3" {...p} />
          <Path d="M10 5h4m-3 14h2" {...p} />
        </>
      )}
      {name === "clock" && (
        <>
          <Circle cx="12" cy="12" r="9" {...p} />
          <Path d="M12 7v5l3 2" {...p} />
        </>
      )}
      {name === "lock" && (
        <>
          <Rect x="5" y="10" width="14" height="11" rx="2" {...p} />
          <Path d="M8 10V7a4 4 0 0 1 8 0v3m-4 5v2" {...p} />
        </>
      )}
      {name === "check" && <Polyline points="5,12 10,17 20,7" {...p} />}
      {name === "close" && <Path d="m6 6 12 12M6 18 18 6" {...p} />}
      {name === "pause" && (
        <>
          <Rect x="6" y="5" width="4" height="14" rx="1" fill={color} />
          <Rect x="14" y="5" width="4" height="14" rx="1" fill={color} />
        </>
      )}
      {name === "play" && <Path d="m8 4 12 8-12 8Z" fill={color} />}
      {name === "help" && (
        <>
          <Circle cx="12" cy="12" r="9" {...p} />
          <Path d="M9 9a3 3 0 0 1 6 0c0 2-3 2-3 4m0 3h.1" {...p} />
        </>
      )}
      {name === "repeat" && (
        <>
          <Path d="M20 10a8 8 0 1 0-1 7M20 4v6h-6" {...p} />
        </>
      )}
      {name === "flag" && (
        <Path d="M5 21V3c5-4 9 5 14 1v10c-5 4-9-5-14-1" {...p} />
      )}
      {name === "spark" && (
        <Path
          d="m12 2 2.4 7.6L22 12l-7.6 2.4L12 22l-2.4-7.6L2 12l7.6-2.4Z"
          {...p}
        />
      )}
      {name === "headphones" && (
        <>
          <Path d="M4 13V10a8 8 0 0 1 16 0v3" {...p} />
          <Rect x="3" y="12" width="4" height="8" rx="2" {...p} />
          <Rect x="17" y="12" width="4" height="8" rx="2" {...p} />
        </>
      )}
    </Svg>
  );
}

export function Star({
  filled = false,
  size = 20,
  color = C.gold,
}: {
  filled?: boolean;
  size?: number;
  color?: string;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.9L12 17.8l-6.2 3.3L7 14.2 2 9.3l6.9-1Z"
        fill={filled ? color : "none"}
        stroke={filled ? color : "#C5C9BC"}
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
export function Stars({ count, size = 18 }: { count: number; size?: number }) {
  const { t } = useI18n();
  return (
    <View
      accessibilityLabel={t("stars", { count })}
      style={{ flexDirection: "row", gap: 4 }}
    >
      {[1, 2, 3].map((n) => (
        <Star key={n} filled={n <= count} size={size} />
      ))}
    </View>
  );
}
export function Button({
  title,
  onPress,
  icon = "arrow",
  secondary = false,
  disabled = false,
  style,
  testID,
}: {
  title: string;
  onPress: () => void;
  icon?: IconName;
  secondary?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  testID?: string;
}) {
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={title}
      disabled={disabled}
      onPress={onPress}
      style={({
        hovered,
        pressed,
      }: {
        hovered?: boolean;
        pressed: boolean;
      }) => [
        s.button,
        secondary && s.secondary,
        disabled && { opacity: 0.45 },
        hovered && !disabled && { opacity: 0.86 },
        pressed && { transform: [{ scale: 0.985 }] },
        style,
      ]}
    >
      <Text style={[s.buttonText, secondary && { color: C.ink }]}>{title}</Text>
      <Icon name={icon} size={19} color={secondary ? C.ink : C.paper} />
    </Pressable>
  );
}
export function IconButton({
  name,
  label,
  onPress,
  active = false,
}: {
  name: IconName;
  label: string;
  onPress: () => void;
  active?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ hovered }: { hovered?: boolean; pressed: boolean }) => [
        s.iconButton,
        active && { backgroundColor: C.ink },
        hovered && { opacity: 0.75 },
      ]}
    >
      <Icon name={name} color={active ? C.paper : C.ink} />
    </Pressable>
  );
}
export function Eyebrow({
  children,
  color = C.muted,
}: {
  children: React.ReactNode;
  color?: string;
}) {
  return (
    <Text
      style={{ fontFamily: F.medium, fontSize: 11, letterSpacing: 0.4, color }}
    >
      {children}
    </Text>
  );
}
export function GermanFlag() {
  return (
    <View
      style={{ width: 17, height: 12, borderRadius: 2, overflow: "hidden" }}
    >
      {["#27332F", "#BD5840", "#DCC16C"].map((color) => (
        <View key={color} style={{ flex: 1, backgroundColor: color }} />
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  button: {
    minHeight: 53,
    backgroundColor: C.primary,
    paddingHorizontal: 21,
    borderRadius: 999,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 14,
  },
  secondary: { backgroundColor: C.soft, borderWidth: 1, borderColor: C.line },
  buttonText: { fontSize: 14, color: C.paper, fontWeight: "600" },
  iconButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
  },
  switch: {
    flexDirection: "row",
    padding: 4,
    borderRadius: 10,
    backgroundColor: C.soft,
    gap: 3,
  },
  switchOption: {
    flex: 1,
    minHeight: 37,
    flexDirection: "row",
    gap: 7,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 7,
  },
  switchActive: { backgroundColor: C.paper, boxShadow: "0 1px 4px #203C3612" },
  switchText: { fontSize: 11, color: "#666F63", fontWeight: "600" },
});
