import type { Country } from "./types";
import { STAGES } from "./stages";

// Content packs are independent of interface language and input method.
export const COUNTRIES: Country[] = [
  {
    id: "DE",
    name: { en: "Germany", de: "Deutschland" },
    nativeName: "Deutschland",
    flag: "🇩🇪",
    status: "available",
    color: "#DD5B00",
  },
  {
    id: "FR",
    name: { en: "France", de: "Frankreich" },
    nativeName: "France",
    flag: "🇫🇷",
    status: "planned",
    color: "#D6B6F6",
  },
  {
    id: "NL",
    name: { en: "Netherlands", de: "Niederlande" },
    nativeName: "Nederland",
    flag: "🇳🇱",
    status: "planned",
    color: "#FF64C8",
  },
  {
    id: "CH",
    name: { en: "Switzerland", de: "Schweiz" },
    nativeName: "Schweiz / Suisse",
    flag: "🇨🇭",
    status: "planned",
    color: "#2A9D99",
  },
  {
    id: "AT",
    name: { en: "Austria", de: "Österreich" },
    nativeName: "Österreich",
    flag: "🇦🇹",
    status: "planned",
    color: "#62AEF0",
  },
];
export const getCountry = (id: string) =>
  COUNTRIES.find((country) => country.id === id) ?? COUNTRIES[0];
export const getCountryStages = (id: string) =>
  STAGES.filter((stage) => stage.countryId === id);
