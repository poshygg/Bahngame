import { createContext, useContext, useEffect, useRef, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { adConfig } from "./config";

const Context = createContext({ enabled: false, revision: 0, setEnabled: (_: boolean) => {}, refresh: () => {} });
export function AdSettingsProvider({ children }: { children: React.ReactNode }) {
  const [enabled, update] = useState(false);
  const [revision, setRevision] = useState(0);
  const changed = useRef(false);
  const writes = useRef(Promise.resolve());
  useEffect(() => {
    AsyncStorage.getItem("bahnreise.ads.enabled").then(value => {
      if (!changed.current) update(value !== "false");
    }).catch(() => {});
  }, []);
  return <Context.Provider value={{ enabled: enabled && adConfig.mode !== "off", revision,
    refresh: () => setRevision(value => value + 1),
    setEnabled: value => {
      changed.current = true;
      update(value);
      writes.current = writes.current.catch(() => {}).then(() => AsyncStorage.setItem("bahnreise.ads.enabled", String(value)));
      void writes.current.catch(() => {});
    },
  }}>{children}</Context.Provider>;
}
export const useAdSettings = () => useContext(Context);
