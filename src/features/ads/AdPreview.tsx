import { StyleSheet, Text, View } from "react-native";
import { useI18n } from "../../i18n";
import { C, F } from "../../theme";
import type { AdPlacement } from "./config";

export function AdPreview({ placement }: { placement: AdPlacement }) {
  const { l } = useI18n();
  return <View testID={`ad-preview-${placement}`} style={s.card} accessibilityLabel={l({ en: "Advertisement preview", de: "Werbevorschau" })}>
    <Text style={s.label}>{l({ en: "ADVERTISEMENT · PREVIEW", de: "WERBUNG · VORSCHAU" })}</Text>
    <Text style={s.title}>{l({ en: "A small pause. A new destination.", de: "Eine kleine Pause. Ein neues Ziel." })}</Text>
    <Text style={s.body}>{l({ en: "Sample sponsor space · No external ad is loaded.", de: "Beispiel einer Werbefläche · Keine externe Anzeige geladen." })}</Text>
  </View>;
}
const s = StyleSheet.create({
  card: { alignSelf: "center", width: "100%", maxWidth: 728, padding: 18, marginVertical: 24, borderRadius: 10, borderWidth: 1, borderColor: C.line, backgroundColor: C.paper, gap: 7 },
  label: { fontFamily: F.medium, fontSize: 9, letterSpacing: 1.1, color: C.muted },
  title: { fontFamily: F.medium, fontSize: 14, color: C.ink },
  body: { fontSize: 11, lineHeight: 17, color: C.muted },
});
