import { useEffect, useRef, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { emptyProgress, parseProgress, type Progress } from "../game/progress";
import { detectInputProfile } from "../platform/inputProfile";

// Keep the original key so earlier installations can migrate their journeys.
const STORAGE_KEY = "bahnreise.progress.v1";

export function useProgress() {
  const [profile] = useState(detectInputProfile);
  const [progress, setProgress] = useState<Progress>(() =>
    emptyProgress(profile),
  );
  const [loaded, setLoaded] = useState(false);
  const [storageError, setStorageError] = useState(false);
  const writeQueue = useRef(Promise.resolve());
  useEffect(() => {
    let mounted = true;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (mounted) setProgress(parseProgress(raw, profile));
      })
      .catch(() => {
        if (mounted) setStorageError(true);
      })
      .finally(() => {
        if (mounted) setLoaded(true);
      });
    return () => {
      mounted = false;
    };
  }, [profile]);
  useEffect(() => {
    if (!loaded) return;
    writeQueue.current = writeQueue.current
      .then(() => AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(progress)))
      .then(() => setStorageError(false))
      .catch(() => setStorageError(true));
  }, [loaded, progress]);
  return { progress, setProgress, loaded, storageError };
}
