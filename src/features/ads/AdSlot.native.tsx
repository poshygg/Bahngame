import { useEffect, useState } from "react";
import { Platform, Text, View } from "react-native";
import { useI18n } from "../../i18n";
import { AdPreview } from "./AdPreview";
import { useAdSettings } from "./AdSettings";
import { adConfig, type AdPlacement, validMobileUnit } from "./config";
import { getNativeAds } from "./nativeAds";

export function AdSlot({ placement }: { placement: AdPlacement }) {
  const { enabled, revision } = useAdSettings();
  if (!enabled) return null;
  if (adConfig.mode === "preview") return <AdPreview placement={placement} />;
  return <NativeBanner key={revision} placement={placement} />;
}
function NativeBanner({ placement }: { placement: AdPlacement }) {
  const { l } = useI18n();
  const [sdk, setSdk] = useState<Awaited<ReturnType<typeof getNativeAds>>>(null);
  const [failed, setFailed] = useState(false);
  const unit = Platform.OS === "ios" ? adConfig.iosBanner : adConfig.androidBanner;
  useEffect(() => {
    let cancelled = false;
    if (adConfig.mode === "live" && !validMobileUnit(unit)) return;
    void getNativeAds().then(value => { if (!cancelled) setSdk(value); });
    return () => { cancelled = true; };
  }, [unit]);
  if (!sdk || failed) return adConfig.mode === "test" ? <AdPreview placement={placement} /> : null;
  return <View testID={`ad-slot-${placement}`} style={{ marginVertical: 24, minHeight: 74, alignItems: "center" }}>
    <Text style={{ color: "#615D59", fontSize: 9, marginBottom: 8 }}>{l({ en: "ADVERTISEMENT", de: "WERBUNG" })}</Text>
    <sdk.BannerAd unitId={adConfig.mode === "test" ? sdk.TestIds.BANNER : unit} size={sdk.BannerAdSize.BANNER}
      requestOptions={{ requestNonPersonalizedAdsOnly: true }} onAdFailedToLoad={() => setFailed(true)} />
  </View>;
}
