import { loadNativeAdSdk, resetNativeConsent } from "./nativeAds";
export async function openAdPrivacy(): Promise<boolean> {
  const sdk = loadNativeAdSdk();
  if (!sdk) return false;
  await sdk.AdsConsent.showPrivacyOptionsForm();
  resetNativeConsent();
  return true;
}
