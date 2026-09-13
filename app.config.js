/** Native ad identifiers are build configuration; never reuse web publisher IDs. */
module.exports = ({ config }) => {
  const live = process.env.EXPO_PUBLIC_ADS_MODE === "live";
  const androidAppId = process.env.ADMOB_ANDROID_APP_ID;
  const iosAppId = process.env.ADMOB_IOS_APP_ID;
  if (live && (!/^ca-app-pub-\d{16}~\d{10}$/.test(androidAppId || "") ||
      !/^ca-app-pub-\d{16}~\d{10}$/.test(iosAppId || ""))) {
    throw new Error("Live ads require ADMOB_ANDROID_APP_ID and ADMOB_IOS_APP_ID. Use preview mode until configured.");
  }
  return { ...config, plugins: [...(config.plugins || []), ["react-native-google-mobile-ads", {
    androidAppId: live ? androidAppId : "ca-app-pub-3940256099942544~3347511713",
    iosAppId: live ? iosAppId : "ca-app-pub-3940256099942544~1458002511",
    delayAppMeasurementInit: true,
  }]] };
};
