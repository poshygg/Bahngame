import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useRef, useState } from "react";

export type SavedJourney = {
  originId: string;
  destinationId: string;
  createdAt: string;
};
const KEY = "bahnreise.custom-journeys.v1";
export function parseSavedJourneys(raw: string | null): SavedJourney[] {
  try {
    const values: unknown = JSON.parse(raw ?? "[]");
    if (!Array.isArray(values)) return [];
    return values
      .filter(
        (item): item is SavedJourney =>
          !!item &&
          typeof item.originId === "string" &&
          typeof item.destinationId === "string" &&
          item.originId !== item.destinationId &&
          typeof item.createdAt === "string" &&
          Number.isFinite(Date.parse(item.createdAt)),
      )
      .slice(0, 12);
  } catch {
    return [];
  }
}
export function useSavedJourneys() {
  const [saved, setSaved] = useState<SavedJourney[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [storageError, setStorageError] = useState(false);
  const writes = useRef(Promise.resolve());
  const latest = useRef<SavedJourney[]>([]);
  useEffect(() => {
    let alive = true;
    AsyncStorage.getItem(KEY)
      .then((raw) => {
        if (alive) {
          latest.current = parseSavedJourneys(raw);
          setSaved(latest.current);
        }
      })
      .catch(() => {
        if (alive) setStorageError(true);
      })
      .finally(() => {
        if (alive) setLoaded(true);
      });
    return () => {
      alive = false;
    };
  }, []);
  const commit = async (next: SavedJourney[]) => {
    if (!loaded) return false;
    latest.current = next;
    setSaved(next);
    let successful = true;
    writes.current = writes.current
      .then(() => AsyncStorage.setItem(KEY, JSON.stringify(next)))
      .catch(() => {
        successful = false;
        setStorageError(true);
      });
    await writes.current;
    if (successful) setStorageError(false);
    return successful;
  };
  const save = (originId: string, destinationId: string) =>
    commit(
      [
        { originId, destinationId, createdAt: new Date().toISOString() },
        ...latest.current.filter(
          (item) =>
            item.originId !== originId || item.destinationId !== destinationId,
        ),
      ].slice(0, 12),
    );
  const remove = (originId: string, destinationId: string) => {
    void commit(
      latest.current.filter(
        (item) =>
          item.originId !== originId || item.destinationId !== destinationId,
      ),
    );
  };
  return { saved, loaded, storageError, save, remove };
}
