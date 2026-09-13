import React from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useFonts } from "expo-font";
import { AppShell } from "./src/AppShell";
import { I18nProvider } from "./src/i18n";
import { C } from "./src/theme";
export default function App() {
  const [loaded, error] = useFonts({
    Inter_400Regular: require("@expo-google-fonts/inter/400Regular/Inter_400Regular.ttf"),
    Inter_500Medium: require("@expo-google-fonts/inter/500Medium/Inter_500Medium.ttf"),
    Inter_700Bold: require("@expo-google-fonts/inter/700Bold/Inter_700Bold.ttf"),
  });
  if (!loaded && !error)
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: C.bg,
          gap: 14,
        }}
      >
        <ActivityIndicator color={C.primary} />
        <Text style={{ color: C.muted }}>Getting your journey ready…</Text>
      </View>
    );
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <I18nProvider>
        <AppShell />
      </I18nProvider>
    </SafeAreaProvider>
  );
}
