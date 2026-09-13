import Constants, { ExecutionEnvironment } from "expo-constants";
import { adConfig } from "./config";
type SDK = typeof import("react-native-google-mobile-ads");
let pending: Promise<SDK | null> | undefined;
export function loadNativeAdSdk(): SDK | null {
  if (Constants.executionEnvironment === ExecutionEnvironment.StoreClient ||
      (adConfig.mode !== "test" && adConfig.mode !== "live")) return null;
  try { return require("react-native-google-mobile-ads") as SDK; } catch { return null; }
}
export function getNativeAds(): Promise<SDK | null> {
  if (Constants.executionEnvironment === ExecutionEnvironment.StoreClient ||
      (adConfig.mode !== "test" && adConfig.mode !== "live")) return Promise.resolve(null);
  if (!pending) pending = (async () => {
    // Requiring inside the guard keeps Expo Go usable without the native module.
    const sdk = loadNativeAdSdk();
    if (!sdk) return null;
    const consent = await sdk.AdsConsent.gatherConsent();
    if (!consent.canRequestAds) return null;
    await sdk.default().setRequestConfiguration({ maxAdContentRating: sdk.MaxAdContentRating.G });
    await sdk.default().initialize();
    return sdk;
  })().catch(() => null);
  return pending;
}
export function resetNativeConsent() { pending = undefined; }
