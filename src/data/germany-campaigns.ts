import type { Localized } from "./types";

export type CityNetwork = {
  id: string;
  name: Localized;
  /** Discovery buckets used to organize an existing rail service, never to make connections. */
  cityIds: string[];
};

/** Editorial city-network selection, independent of the full custom-routing database. */
export const CITY_NETWORKS: CityNetwork[] = [
  {
    id: "berlin",
    name: { en: "Berlin", de: "Berlin" },
    cityIds: ["berlin", "potsdam"],
  },
  {
    id: "hamburg",
    name: { en: "Hamburg", de: "Hamburg" },
    cityIds: ["hamburg"],
  },
  { id: "munich", name: { en: "Munich", de: "München" }, cityIds: ["munich"] },
  {
    id: "frankfurt",
    name: { en: "Frankfurt Rhine-Main", de: "Frankfurt Rhein-Main" },
    cityIds: ["frankfurt", "wiesbaden", "mainz"],
  },
  {
    id: "cologne",
    name: { en: "Cologne / Bonn", de: "Köln / Bonn" },
    cityIds: ["cologne"],
  },
  {
    id: "rhine-ruhr",
    name: { en: "Rhine-Ruhr", de: "Rhein-Ruhr" },
    cityIds: ["duesseldorf", "dortmund", "essen"],
  },
  {
    id: "stuttgart",
    name: { en: "Stuttgart", de: "Stuttgart" },
    cityIds: ["stuttgart"],
  },
  {
    id: "nuremberg",
    name: { en: "Nuremberg", de: "Nürnberg" },
    cityIds: ["nuremberg"],
  },
  {
    id: "hanover",
    name: { en: "Hanover", de: "Hannover" },
    cityIds: ["hanover"],
  },
  {
    id: "leipzig-halle",
    name: { en: "Leipzig / Halle", de: "Leipzig / Halle" },
    cityIds: ["leipzig", "halle"],
  },
  {
    id: "dresden",
    name: { en: "Dresden", de: "Dresden" },
    cityIds: ["dresden"],
  },
  { id: "bremen", name: { en: "Bremen", de: "Bremen" }, cityIds: ["bremen"] },
];
