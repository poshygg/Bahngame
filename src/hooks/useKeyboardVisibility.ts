import { useEffect, useState } from "react";
import { Keyboard, Platform } from "react-native";

export function useKeyboardVisibility() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const show = Keyboard.addListener("keyboardDidShow", () =>
      setVisible(true),
    );
    const hide = Keyboard.addListener("keyboardDidHide", () =>
      setVisible(false),
    );
    if (Platform.OS !== "web")
      return () => {
        show.remove();
        hide.remove();
      };
    const viewport = window.visualViewport;
    let baseline = window.innerHeight;
    const update = () => {
      const focused =
        document.activeElement?.getAttribute("data-testid") === "station-input";
      if (!focused) baseline = Math.max(baseline, window.innerHeight);
      setVisible(
        focused && baseline - (viewport?.height ?? window.innerHeight) > 150,
      );
    };
    viewport?.addEventListener("resize", update);
    document.addEventListener("focusin", update);
    document.addEventListener("focusout", update);
    return () => {
      show.remove();
      hide.remove();
      viewport?.removeEventListener("resize", update);
      document.removeEventListener("focusin", update);
      document.removeEventListener("focusout", update);
    };
  }, []);
  return visible;
}
