import type { Localized } from "./types";

export interface StateCorridorSpec {
  readonly id: string;
  readonly stateId: string;
  readonly lineId: string;
  readonly fromStationId: string;
  readonly toStationId: string;
  readonly name: Localized;
}

/**
 * Reviewed town-to-town slices of the bundled OSM directed RE/RB variants.
 * Every stop between each endpoint pair belongs to the stated federal state.
 * Resolve endpoints inclusively in source order; never filter out intermediate
 * stops or infer connections from proximity. cityId is not municipality proof.
 * Source links, operator and check date are inherited from the referenced line.
 * Berlin, Hamburg and Bremen use urban campaigns instead of these corridors.
 */
export const STATE_CORRIDORS: readonly StateCorridorSpec[] = [
  {
    id: "DE-BB.corridor.3490565.0-13",
    stateId: "DE-BB",
    lineId: "DE-BB.osm-3490565",
    fromStationId: "osm-relation-2623459",
    toStationId: "osm-relation-10562987",
    name: {
      en: "Falkenberg → Cottbus",
      de: "Falkenberg → Cottbus",
    },
  },
  {
    id: "DE-BB.corridor.156479.0-8",
    stateId: "DE-BB",
    lineId: "DE-BB.osm-156479",
    fromStationId: "osm-relation-10562987",
    toStationId: "osm-relation-1368185",
    name: {
      en: "Cottbus → Königs Wusterhausen",
      de: "Cottbus → Königs Wusterhausen",
    },
  },
  {
    id: "DE-BW.corridor.12278821.0-15",
    stateId: "DE-BW",
    lineId: "DE-BW.osm-12278821",
    fromStationId: "osm-relation-12282914",
    toStationId: "osm-relation-12328998",
    name: {
      en: "Offenburg → Freiburg",
      de: "Offenburg → Freiburg",
    },
  },
  {
    id: "DE-BW.corridor.10249735.0-18",
    stateId: "DE-BW",
    lineId: "DE-BW.osm-10249735",
    fromStationId: "osm-relation-12328998",
    toStationId: "osm-relation-4438319",
    name: {
      en: "Freiburg → Weil am Rhein",
      de: "Freiburg → Weil am Rhein",
    },
  },
  {
    id: "DE-BY.corridor.10573470.0-9",
    stateId: "DE-BY",
    lineId: "DE-BY.osm-10573470",
    fromStationId: "osm-relation-962582",
    toStationId: "osm-relation-5126108",
    name: {
      en: "Nuremberg → Munich",
      de: "Nürnberg → München",
    },
  },
  {
    id: "DE-BY.corridor.296224.0-9",
    stateId: "DE-BY",
    lineId: "DE-BY.osm-296224",
    fromStationId: "osm-relation-255607",
    toStationId: "osm-relation-5126108",
    name: {
      en: "Hof → Munich",
      de: "Hof → München",
    },
  },
  {
    id: "DE-HE.corridor.18429812.0-10",
    stateId: "DE-HE",
    lineId: "DE-HE.osm-18429812",
    fromStationId: "osm-relation-6311435",
    toStationId: "osm-relation-1915170",
    name: {
      en: "Gießen → Frankfurt",
      de: "Gießen → Frankfurt",
    },
  },
  {
    id: "DE-HE.corridor.72646.0-13",
    stateId: "DE-HE",
    lineId: "DE-HE.osm-72646",
    fromStationId: "osm-relation-158321",
    toStationId: "osm-relation-7592684",
    name: {
      en: "Wiesbaden → Limburg",
      de: "Wiesbaden → Limburg",
    },
  },
  {
    id: "DE-MV.corridor.373292.8-22",
    stateId: "DE-MV",
    lineId: "DE-BB.osm-373292",
    fromStationId: "osm-relation-6320508",
    toStationId: "osm-relation-6260987",
    name: {
      en: "Neustrelitz → Stralsund",
      de: "Neustrelitz → Stralsund",
    },
  },
  {
    id: "DE-MV.corridor.20153990.0-5",
    stateId: "DE-MV",
    lineId: "DE-MV.osm-20153990",
    fromStationId: "osm-relation-5933183",
    toStationId: "osm-relation-17859120",
    name: {
      en: "Rostock → Bad Doberan",
      de: "Rostock → Bad Doberan",
    },
  },
  {
    id: "DE-NI.corridor.12123342.0-11",
    stateId: "DE-NI",
    lineId: "DE-NI.osm-12123342",
    fromStationId: "osm-relation-8495303",
    toStationId: "osm-relation-135448",
    name: {
      en: "Hanover → Göttingen",
      de: "Hannover → Göttingen",
    },
  },
  {
    id: "DE-NI.corridor.326153.0-18",
    stateId: "DE-NI",
    lineId: "DE-NI.osm-326153",
    fromStationId: "osm-relation-4011700",
    toStationId: "osm-relation-8495303",
    name: {
      en: "Buchholz → Hanover",
      de: "Buchholz → Hannover",
    },
  },
  {
    id: "DE-NW.corridor.1998602.0-22",
    stateId: "DE-NW",
    lineId: "DE-NW.osm-1998602",
    fromStationId: "osm-relation-1190146",
    toStationId: "osm-relation-229792",
    name: {
      en: "Aachen → Dortmund",
      de: "Aachen → Dortmund",
    },
  },
  {
    id: "DE-NW.corridor.1311409.0-16",
    stateId: "DE-NW",
    lineId: "DE-NW.osm-1311409",
    fromStationId: "osm-relation-6037286",
    toStationId: "osm-relation-4175759",
    name: {
      en: "Düsseldorf → Hamm",
      de: "Düsseldorf → Hamm",
    },
  },
  {
    id: "DE-NW.corridor.1988258.0-8",
    stateId: "DE-NW",
    lineId: "DE-NW.osm-1988258",
    fromStationId: "osm-relation-1190146",
    toStationId: "osm-relation-6875142",
    name: {
      en: "Aachen → Cologne",
      de: "Aachen → Köln",
    },
  },
  {
    id: "DE-RP.corridor.224553.0-29",
    stateId: "DE-RP",
    lineId: "DE-RP.osm-224553",
    fromStationId: "osm-relation-20453670",
    toStationId: "osm-relation-6259958",
    name: {
      en: "Trier → Koblenz",
      de: "Trier → Koblenz",
    },
  },
  {
    id: "DE-RP.corridor.4453687.0-8",
    stateId: "DE-RP",
    lineId: "DE-HE.osm-4453687",
    fromStationId: "osm-relation-6259958",
    toStationId: "osm-relation-20198066",
    name: {
      en: "Koblenz → Mainz",
      de: "Koblenz → Mainz",
    },
  },
  {
    id: "DE-SH.corridor.5830658.0-11",
    stateId: "DE-SH",
    lineId: "DE-SH.osm-5830658",
    fromStationId: "osm-relation-166260",
    toStationId: "osm-relation-5764477",
    name: {
      en: "Kiel → Lübeck",
      de: "Kiel → Lübeck",
    },
  },
  {
    id: "DE-SH.corridor.2035341.2-7",
    stateId: "DE-SH",
    lineId: "DE-HH.osm-2035341",
    fromStationId: "osm-relation-6040254",
    toStationId: "osm-relation-166260",
    name: {
      en: "Elmshorn → Kiel",
      de: "Elmshorn → Kiel",
    },
  },
  {
    id: "DE-SL.corridor.4797946.0-11",
    stateId: "DE-SL",
    lineId: "DE-SL.osm-4797946",
    fromStationId: "osm-relation-7509874",
    toStationId: "osm-relation-5333301",
    name: {
      en: "Lebach → Saarbrücken",
      de: "Lebach → Saarbrücken",
    },
  },
  {
    id: "DE-SL.corridor.1804451.5-12",
    stateId: "DE-SL",
    lineId: "DE-BW.osm-1804451",
    fromStationId: "osm-relation-7503335",
    toStationId: "osm-relation-7509849",
    name: {
      en: "Homburg → Mettlach",
      de: "Homburg → Mettlach",
    },
  },
  {
    id: "DE-SN.corridor.3648829.0-29",
    stateId: "DE-SN",
    lineId: "DE-SN.osm-3648829",
    fromStationId: "osm-relation-3631997",
    toStationId: "osm-relation-3577672",
    name: {
      en: "Zwickau → Dresden",
      de: "Zwickau → Dresden",
    },
  },
  {
    id: "DE-SN.corridor.16683013.1-10",
    stateId: "DE-SN",
    lineId: "DE-SN.osm-16683013",
    fromStationId: "osm-relation-3651503",
    toStationId: "osm-relation-3577672",
    name: {
      en: "Görlitz → Dresden",
      de: "Görlitz → Dresden",
    },
  },
  {
    id: "DE-ST.corridor.76614.0-11",
    stateId: "DE-ST",
    lineId: "DE-ST.osm-76614",
    fromStationId: "osm-relation-8169664",
    toStationId: "osm-relation-157082",
    name: {
      en: "Aschersleben → Magdeburg",
      de: "Aschersleben → Magdeburg",
    },
  },
  {
    id: "DE-ST.corridor.4432172.0-12",
    stateId: "DE-ST",
    lineId: "DE-NI.osm-4432172",
    fromStationId: "osm-relation-157082",
    toStationId: "osm-relation-11159117",
    name: {
      en: "Magdeburg → Oebisfelde",
      de: "Magdeburg → Oebisfelde",
    },
  },
  {
    id: "DE-TH.corridor.4812106.0-13",
    stateId: "DE-TH",
    lineId: "DE-TH.osm-4812106",
    fromStationId: "osm-relation-8309140",
    toStationId: "osm-relation-3492992",
    name: {
      en: "Altenburg → Erfurt",
      de: "Altenburg → Erfurt",
    },
  },
  {
    id: "DE-TH.corridor.5843322.0-12",
    stateId: "DE-TH",
    lineId: "DE-TH.osm-5843322",
    fromStationId: "osm-relation-5428015",
    toStationId: "osm-relation-12652696",
    name: {
      en: "Weimar → Gera",
      de: "Weimar → Gera",
    },
  },
];
