export type AdMode = "off" | "preview" | "test" | "live";
export type AdPlacement = "explore" | "result";

export function parseAdMode(value?: string): AdMode {
  return value === "off" || value === "test" || value === "live" ? value : "preview";
}
export const adConfig = {
  mode: parseAdMode(process.env.EXPO_PUBLIC_ADS_MODE),
  webClient: process.env.EXPO_PUBLIC_ADSENSE_CLIENT ?? "",
  webSlots: {
    explore: process.env.EXPO_PUBLIC_ADSENSE_EXPLORE_SLOT ?? "",
    result: process.env.EXPO_PUBLIC_ADSENSE_RESULT_SLOT ?? "",
  },
  androidBanner: process.env.EXPO_PUBLIC_ADMOB_ANDROID_BANNER ?? "",
  iosBanner: process.env.EXPO_PUBLIC_ADMOB_IOS_BANNER ?? "",
};
export function validWebUnit(client: string, slot: string) {
  return /^ca-pub-\d{16}$/.test(client) && /^\d{10}$/.test(slot);
}
export function validMobileUnit(unit: string) {
  return /^ca-app-pub-\d{16}\/\d{10}$/.test(unit);
}
/** AdSense is for hosted websites; the Windows app uses the local sponsor card. */
export function supportedWebHost(protocol: string, hostname: string) {
  return protocol === "https:" && hostname !== "localhost" && hostname !== "127.0.0.1";
}
export type ConsentData = {
  cmpStatus?: string;
  eventStatus?: string;
  gdprApplies?: boolean;
  listenerId?: number;
  purpose?: { consents?: Record<number, boolean> };
  vendor?: { consents?: Record<number, boolean> };
};
/** Deliberately strict: unknown CMP state never authorizes an ad request. */
export function canRequestWebAds(data: ConsentData, success: boolean) {
  return success && data.cmpStatus === "loaded" &&
    (data.eventStatus === "tcloaded" || data.eventStatus === "useractioncomplete") &&
    (data.gdprApplies === false || (data.gdprApplies === true &&
      data.purpose?.consents?.[1] === true && data.vendor?.consents?.[755] === true));
}
