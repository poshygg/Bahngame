import { useState } from "react";
import { Platform, Switch, Text, View } from "react-native";
import { Button } from "../../components/ui";
import { useI18n } from "../../i18n";
import { C, F } from "../../theme";
import { adConfig } from "./config";
import { useAdSettings } from "./AdSettings";
import { openAdPrivacy } from "./privacy";

export function AdPreferences() {
  const { l } = useI18n();
  const { enabled, setEnabled, refresh } = useAdSettings();
  const [unavailable, setUnavailable] = useState(false);
  const [busy, setBusy] = useState(false);
  const autoAds = Platform.OS === "web" && typeof document !== "undefined" &&
    !!document.head.querySelector('script[src^="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"]');
  return <View testID="ad-preferences" style={{ gap: 12, paddingVertical: 20, borderTopWidth: 1, borderColor: C.line }}>
    <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
      <Text style={{ flex: 1, color: C.ink, fontFamily: F.medium, fontSize: 15 }}>{l(autoAds ? { en: "Sample sponsor cards", de: "Beispiel-Werbekarten" } : { en: "Sponsor spaces", de: "Werbeflächen" })}</Text>
      <Switch testID="ads-enabled" accessibilityLabel={l(autoAds ? { en: "Show sample sponsor cards", de: "Beispiel-Werbekarten anzeigen" } : { en: "Show sponsor spaces", de: "Werbeflächen anzeigen" })} value={enabled} disabled={adConfig.mode === "off"} onValueChange={setEnabled} />
    </View>
    <Text style={{ fontSize: 12, lineHeight: 20, color: C.muted }}>{l({
      en: "Only on the map selection and results screens. Your scores, stars and stamps are independent of ads.",
      de: "Nur in der Kartenauswahl und im Ergebnis. Punkte, Sterne und Stempel sind unabhängig von Werbung.",
    })}</Text>
    {adConfig.mode === "live" ? <Button secondary disabled={busy} title={l({ en: "Advertising privacy choices", de: "Datenschutzauswahl für Werbung" })} onPress={async () => {
      setBusy(true);
      try { setUnavailable(!(await openAdPrivacy())); } catch { setUnavailable(true); }
      finally { refresh(); setBusy(false); }
    }} /> : <Text style={{ fontSize: 11, lineHeight: 18, color: C.muted }}>{l(autoAds ? { en: "This switch controls the sample cards. Google Auto ads can appear separately.", de: "Dieser Schalter steuert die Beispielkarten. Automatische Google-Anzeigen können separat erscheinen." } : { en: "Preview / test mode. No paid advertising is active.", de: "Vorschau / Testmodus. Keine bezahlte Werbung aktiv." })}</Text>}
    {unavailable && <Text style={{ color: C.muted, fontSize: 12 }}>{l({ en: "Privacy form unavailable. You can turn sponsor spaces off above.", de: "Datenschutzformular nicht verfügbar. Du kannst Werbeflächen oben ausschalten." })}</Text>}
  </View>;
}
