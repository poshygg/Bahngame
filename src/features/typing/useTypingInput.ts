import { useEffect, useRef, useState, type RefObject } from "react";
import { Platform, type TextInput } from "react-native";
import { isSingleCharacter, type Run } from "../../game/engine";
import { useI18n } from "../../i18n";

/** Keep text composition and paste protection out of the game rules. */
export function useTypingInput(
  inputRef: RefObject<TextInput | null>,
  prefix: string,
  run: Run,
  input: (char: string) => void,
  pause?: () => void,
) {
  const { t } = useI18n();
  const [notice, setNotice] = useState("");
  const [draft, setDraft] = useState<string | null>(null);
  const composition = useRef<{
    prefix: string;
    text: string;
    atEnd: boolean;
  } | null>(null);
  const latestPrefix = useRef(prefix);
  latestPrefix.current = prefix;
  const committedValue = useRef<string | null>(null);
  const commitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  function onText(text: string) {
    if (run.status !== "playing") return;
    if (composition.current) {
      // Controlled inputs must retain the IME's draft synchronously. Restoring
      // the canonical prefix here cancels browser composition before commit.
      composition.current.text = text;
      setDraft(text);
      return;
    }
    if (committedValue.current === text) {
      committedValue.current = null;
      return;
    }
    committedValue.current = null;
    if (text === prefix) return;
    if (text.length < prefix.length) {
      setNotice(t("noDelete"));
      return;
    }
    const addition = text.startsWith(prefix) ? text.slice(prefix.length) : "";
    if (!isSingleCharacter(addition)) {
      setNotice(t("noAutocomplete"));
      return;
    }
    if (/[ㄱ-ㅎㅏ-ㅣ가-힣]/.test(addition)) {
      setNotice(t("latinKeyboard"));
      return;
    }
    input(addition);
  }
  const handler = useRef(onText);
  handler.current = onText;
  useEffect(() => {
    if (
      run.status !== "playing" ||
      (composition.current && composition.current.prefix !== prefix)
    ) {
      composition.current = null;
      committedValue.current = null;
      setDraft(null);
    }
  }, [prefix, run.status]);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(""), 3000);
    return () => clearTimeout(timer);
  }, [notice]);
  useEffect(() => {
    if (Platform.OS !== "web") return;
    const element = inputRef.current as unknown as HTMLInputElement | null;
    if (!element?.addEventListener) return;
    const block = (event: Event) => {
      event.preventDefault();
      setNotice(t("typeOne"));
    };
    const key = (event: KeyboardEvent) => {
      if (!event.isComposing) committedValue.current = null;
      if (event.repeat) event.preventDefault();
      if (event.key === "Escape" && pause) {
        event.preventDefault();
        pause();
      }
    };
    const replacement = (event: InputEvent) => {
      if (
        ["insertFromPaste", "insertFromDrop", "insertReplacementText"].includes(
          event.inputType,
        )
      )
        block(event);
    };
    const composeStart = () => {
      committedValue.current = null;
      const currentPrefix = latestPrefix.current;
      composition.current = {
        prefix: currentPrefix,
        text: element.value,
        atEnd:
          element.selectionStart === currentPrefix.length &&
          element.selectionEnd === currentPrefix.length,
      };
      setDraft(element.value);
    };
    const composeEnd = (event: CompositionEvent) => {
      const pending = composition.current;
      composition.current = null;
      setDraft(null);
      if (!pending) return;
      // An explicitly empty commit means cancellation. Some browsers expose
      // only the final draft, so use it only when event.data is unavailable.
      const addition =
        typeof event.data === "string"
          ? event.data
          : pending.text.startsWith(pending.prefix)
            ? pending.text.slice(pending.prefix.length)
            : "";
      if (!addition) return;
      if (!pending.atEnd || pending.prefix !== latestPrefix.current) {
        setNotice(t("noAutocomplete"));
        return;
      }
      const value = pending.prefix + addition;
      handler.current(value);
      // Safari/Chromium may deliver the final input before or after
      // compositionend. Ignore only its duplicate in this dispatch turn;
      // a subsequent physical key or input task is a new attempt.
      committedValue.current = value;
      if (commitTimer.current) clearTimeout(commitTimer.current);
      commitTimer.current = setTimeout(() => {
        committedValue.current = null;
        commitTimer.current = null;
      }, 0);
    };
    const cancelComposition = () => {
      composition.current = null;
      committedValue.current = null;
      setDraft(null);
    };
    element.addEventListener("paste", block);
    element.addEventListener("drop", block);
    element.addEventListener("keydown", key);
    element.addEventListener("beforeinput", replacement);
    element.addEventListener("compositionstart", composeStart);
    element.addEventListener("compositionend", composeEnd);
    element.addEventListener("blur", cancelComposition);
    return () => {
      element.removeEventListener("paste", block);
      element.removeEventListener("drop", block);
      element.removeEventListener("keydown", key);
      element.removeEventListener("beforeinput", replacement);
      element.removeEventListener("compositionstart", composeStart);
      element.removeEventListener("compositionend", composeEnd);
      element.removeEventListener("blur", cancelComposition);
      if (commitTimer.current) clearTimeout(commitTimer.current);
      committedValue.current = null;
      composition.current = null;
    };
  }, [inputRef, pause, t, run.status]);
  return { onText, notice, value: draft ?? prefix };
}
