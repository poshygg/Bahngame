import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { en, de } from "./messages";
import type { Locale, Localized } from "../data/types";

type Key = keyof typeof en;
type I18n = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: Key, vars?: Record<string, string | number>) => string;
  l: (text: Localized) => string;
  n: (number: number, decimals?: number) => string;
};
const Context = createContext<I18n | null>(null);
export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLanguage] = useState<Locale>("en");
  const interacted = useRef(false);
  useEffect(() => {
    AsyncStorage.getItem("bahnreise.locale")
      .then((saved) => {
        if (!interacted.current && (saved === "de" || saved === "en"))
          setLanguage(saved);
      })
      .catch(() => {});
  }, []);
  const setLocale = useCallback((next: Locale) => {
    interacted.current = true;
    setLanguage(next);
    AsyncStorage.setItem("bahnreise.locale", next).catch(() => {});
  }, []);
  useEffect(() => {
    if (Platform.OS === "web") {
      document.documentElement.lang = locale;
      document.title =
        locale === "de"
          ? "Bahnreise · Europa, Taste für Taste"
          : "Bahnreise · Europe, one key at a time";
    }
  }, [locale]);
  const value = useMemo<I18n>(
    () => ({
      locale,
      setLocale,
      l: (text) => text[locale],
      n: (number, decimals = 0) =>
        number.toLocaleString(locale === "de" ? "de-DE" : "en-GB", {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        }),
      t: (key, vars = {}) =>
        Object.entries(vars).reduce(
          (text, [name, value]) => text.replaceAll(`{${name}}`, String(value)),
          (locale === "de" ? de : en)[key] as string,
        ),
    }),
    [locale, setLocale],
  );
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function useI18n() {
  const value = useContext(Context);
  if (!value) throw new Error("I18nProvider is required");
  return value;
}
