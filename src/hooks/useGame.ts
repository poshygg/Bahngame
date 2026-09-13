import { useCallback, useEffect, useRef, useState } from "react";
import { AppState, BackHandler, Platform } from "react-native";
import { InputProfile, Stage } from "../data/stages";
import {
  createRun,
  isSingleCharacter,
  Run,
  tick,
  togglePause,
  typeCharacter,
} from "../game/engine";

export function useGame(stage: Stage, profile: InputProfile) {
  const [run, setRun] = useState(() => createRun(stage, profile));
  const ref = useRef(run);
  const lastMark = useRef(Date.now());
  const started = useRef(false);
  const [hasStarted, setHasStarted] = useState(false);
  const update = useCallback((next: Run) => {
    ref.current = next;
    setRun(next);
  }, []);
  const sync = useCallback(() => {
    const now = Date.now();
    const current = ref.current;
    const next = started.current
      ? tick(
          current,
          stage,
          current.elapsedMs + Math.max(0, now - lastMark.current),
        )
      : current;
    lastMark.current = now;
    return next;
  }, [stage]);
  const input = useCallback(
    (character: string) => {
      if (ref.current.status !== "playing" || !isSingleCharacter(character))
        return;
      if (!started.current) {
        started.current = true;
        setHasStarted(true);
        lastMark.current = Date.now();
      }
      update(typeCharacter(sync(), stage, character));
    },
    [stage, sync, update],
  );
  const pause = useCallback(() => {
    if (ref.current.status === "playing") {
      const next = sync();
      update(next.status === "finished" ? next : { ...next, status: "paused" });
    }
  }, [sync, update]);
  const resume = useCallback(() => {
    lastMark.current = Date.now();
    if (ref.current.status === "paused") update(togglePause(ref.current));
  }, [update]);
  useEffect(() => {
    const timer = setInterval(() => {
      if (started.current && ref.current.status === "playing") update(sync());
    }, 100);
    const stateListener = AppState.addEventListener("change", (state) => {
      if (state !== "active" && ref.current.status === "playing") pause();
    });
    const backListener = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        pause();
        return true;
      },
    );
    const visibility = () => {
      if (document.hidden) pause();
    };
    if (Platform.OS === "web")
      document.addEventListener("visibilitychange", visibility);
    return () => {
      clearInterval(timer);
      stateListener.remove();
      backListener.remove();
      if (Platform.OS === "web")
        document.removeEventListener("visibilitychange", visibility);
    };
  }, [pause, sync, update]);
  return { run, input, pause, resume, hasStarted };
}
