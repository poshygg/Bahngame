# Advertising integration

The default is an explicitly labelled local sponsor preview. It runs on web, Windows, Android and iOS without ad-network requests. Placements are below the explorer and below the result receipt, never inside the typing screen or tutorial. Settings can disable all placements; this preference is stored locally. Ads do not grant points, stars, unlocks or achievement progress.

Copy `.env.example` to `.env.local` and supply public publisher/unit IDs. No account passwords or secret keys belong in these values. Re-export the web app or rebuild the native app after changing them.

## Web

`EXPO_PUBLIC_ADS_MODE=live` enables the AdSense adapter on hosted HTTPS sites with a valid publisher ID and placement IDs. Install the account's certified consent-management platform (CMP) on the hosting page before the React app starts. The adapter subscribes to its TCF v2 `__tcfapi`, blocks unknown consent, and requires storage and Google vendor consent in applicable regions. Missing CMP/configuration means no network ad. The privacy button uses Google's `googlefc.showRevocationMessage`; another CMP requires its equivalent adapter. Disable AdSense Auto ads in the publisher console to preserve the game's placement boundaries. Supply the account's ads.txt on the deployed domain as instructed by AdSense. Domain approval and production consent setup still need account-side configuration.

## Android / iOS

`react-native-google-mobile-ads` 16.5.0 is installed with an Expo config plugin in `app.config.js`. Preview/test builds use Google's sample application IDs. Set `EXPO_PUBLIC_ADS_MODE=test` for real Google test banners in a native development build. Expo Go does not contain this native module and retains the local preview. Exported Hermes bundles alone do not install the SDK; use a development/release native build.

Live builds require platform-specific AdMob app IDs and banner unit IDs. Configure UMP privacy messages in AdMob. The adapter gathers consent before SDK initialization, checks `canRequestAds`, delays app measurement, and requests non-personalized banner ads. Configure the app's actual audience, store disclosures, privacy policy and app-ads.txt before release. Native device and consent-flow verification are still required; this workspace does not contain signed APK/IPA releases. Windows uses the local sponsor preview because the native mobile SDK and hosted-site AdSense adapter do not apply to Electron's custom URL scheme.

## References

- [Expo SDK 57](https://docs.expo.dev/versions/v57.0.0/)
- [React Native Google Mobile Ads](https://docs.page/invertase/react-native-google-mobile-ads)
- [UMP consent integration](https://docs.page/invertase/react-native-google-mobile-ads/european-user-consent)
- [Google test ads](https://developers.google.com/admob/android/test-ads)
- [Google certified CMP requirements](https://support.google.com/adsense/answer/13554116?hl=en)

Paid ad serving remains inactive until IDs, account settings and a production native build / hosted site are configured and verified. Never click production ads during testing.
