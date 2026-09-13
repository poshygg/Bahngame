import { AdPreview } from "./AdPreview";
import { useAdSettings } from "./AdSettings";
import type { AdPlacement } from "./config";

export function AdSlot({ placement }: { placement: AdPlacement }) {
  const { enabled } = useAdSettings();
  return enabled ? <AdPreview placement={placement} /> : null;
}
