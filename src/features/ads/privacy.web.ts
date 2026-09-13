export async function openAdPrivacy(): Promise<boolean> {
  const api = (window as unknown as { googlefc?: { showRevocationMessage?: () => void } }).googlefc;
  if (!api?.showRevocationMessage) return false;
  api.showRevocationMessage();
  return true;
}
