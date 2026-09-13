import { useEffect, useRef, useState } from "react";
import { AdPreview } from "./AdPreview";
import { useAdSettings } from "./AdSettings";
import { useI18n } from "../../i18n";
import { adConfig, canRequestWebAds, supportedWebHost, validWebUnit, type AdPlacement, type ConsentData } from "./config";

type AdWindow = Window & {
  adsbygoogle?: Record<string, unknown>[];
  __tcfapi?: (command: string, version: number, callback: (data: ConsentData, success: boolean) => void, id?: number) => void;
};
let scriptPromise: Promise<void> | undefined;
function loadScript() {
  if (!scriptPromise) scriptPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.async = true;
    script.crossOrigin = "anonymous";
    script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adConfig.webClient}`;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Ad script unavailable"));
    document.head.appendChild(script);
  });
  return scriptPromise;
}
export function AdSlot({ placement }: { placement: AdPlacement }) {
  const { enabled, revision } = useAdSettings();
  if (!enabled) return null;
  if (adConfig.mode !== "live" || !supportedWebHost(window.location.protocol, window.location.hostname))
    return <AdPreview placement={placement} />;
  if (!validWebUnit(adConfig.webClient, adConfig.webSlots[placement])) return null;
  return <WebBanner key={revision} placement={placement} />;
}
function WebBanner({ placement }: { placement: AdPlacement }) {
  const { l } = useI18n();
  const [consented, setConsented] = useState(false);
  const ad = useRef<HTMLModElement>(null);
  useEffect(() => {
    const api = (window as AdWindow).__tcfapi;
    if (!api) return; // A certified CMP must be installed by the hosting publisher.
    let active = true;
    let listenerId: number | undefined;
    api("addEventListener", 2, (data, success) => {
      if (!data) { if (active) setConsented(false); return; }
      listenerId = data.listenerId;
      if (active) setConsented(canRequestWebAds(data, success));
    });
    return () => {
      active = false;
      if (listenerId !== undefined) api("removeEventListener", 2, () => {}, listenerId);
    };
  }, []);
  useEffect(() => {
    if (!consented) return;
    let active = true;
    void loadScript().then(() => {
      if (!active || !ad.current || ad.current.hasAttribute("data-adsbygoogle-status")) return;
      const target = window as AdWindow;
      (target.adsbygoogle ??= []).push({});
    }).catch(() => {});
    return () => { active = false; };
  }, [consented]);
  if (!consented) return null;
  return <div data-testid={`ad-slot-${placement}`} style={{ width: "100%", maxWidth: 728, minHeight: 120, margin: "24px auto" }}>
    <div style={{ color: "#615D59", fontSize: 9, marginBottom: 8 }}>{l({ en: "ADVERTISEMENT", de: "WERBUNG" })}</div>
    <ins ref={ad} className="adsbygoogle" style={{ display: "block", minHeight: 90 }}
      data-ad-client={adConfig.webClient} data-ad-slot={adConfig.webSlots[placement]} data-ad-format="horizontal" data-full-width-responsive="true" />
  </div>;
}
