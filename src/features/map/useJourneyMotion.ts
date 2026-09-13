import { useEffect, useRef, useState } from "react";
import { advanceMotion, initialMotion, type RoutePath } from "./motion";

export function useJourneyMotion(
  path: RoutePath,
  target: number,
  paused: boolean,
  finalRequested: boolean,
  onVisualArrival?: () => void,
) {
  const [motion, setMotion] = useState(initialMotion);
  const motionRef = useRef(motion);
  const callback = useRef(onVisualArrival);
  callback.current = onVisualArrival;
  const reported = useRef(false);
  useEffect(() => {
    if (
      paused ||
      (motionRef.current.position >= target && motionRef.current.dwellMs <= 0)
    )
      return;
    let frame = 0;
    let previousTime: number | null = null;
    const animate = (time: number) => {
      const elapsed = previousTime === null ? 16 : time - previousTime;
      previousTime = time;
      const next = advanceMotion(motionRef.current, target, path, elapsed);
      motionRef.current = next;
      setMotion(next);
      if (next.position < target || next.dwellMs > 0)
        frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [path, target, paused]);
  useEffect(() => {
    if (
      !reported.current &&
      finalRequested &&
      motion.position >= path.lengths.length &&
      motion.dwellMs <= 0
    ) {
      reported.current = true;
      callback.current?.();
    }
  }, [finalRequested, motion, path.lengths.length]);
  return motion;
}
