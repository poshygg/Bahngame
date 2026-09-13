import assert from "node:assert/strict";
import test from "node:test";
import { STAGES, type Stage } from "../src/data/stages";
import {
  chapterPage,
  CHAPTER_PAGE_SIZE,
  filterStages,
  indexStages,
} from "../src/features/explorer/filterStages";

const stages: Stage[] = [
  {
    ...STAGES[0],
    id: "munich-1",
    city: "München",
    regionIds: ["DE-BY"],
    serviceId: "S8",
    difficulty: "medium",
    stations: ["München Hauptbahnhof", "Pasing"],
    campaignId: "munich-s8",
    chapter: 1,
    chapters: 2,
  },
  {
    ...STAGES[0],
    id: "berlin-1",
    city: "Berlin",
    regionIds: ["DE-BE", "DE-BB"],
    serviceId: "RE1",
    operator: "ODEG",
    difficulty: "beginner",
    stations: ["Alexanderplatz", "Potsdam"],
    campaignId: "berlin-re1",
    chapter: 1,
    chapters: 2,
  },
  {
    ...STAGES[0],
    id: "munich-2",
    city: "München",
    regionIds: ["DE-BY"],
    serviceId: "S8",
    difficulty: "challenge",
    stations: ["Ismaning", "Flughafen München"],
    campaignId: "munich-s8",
    chapter: 2,
    chapters: 2,
  },
];
const regions = [
  { id: "DE-BY", name: { en: "Bavaria", de: "Bayern" }, shortName: "BY" },
  { id: "DE-BE", name: { en: "Berlin", de: "Berlin" }, shortName: "BE" },
  {
    id: "DE-BB",
    name: { en: "Brandenburg", de: "Brandenburg" },
    shortName: "BB",
  },
];
const indexed = indexStages(stages, regions);

test("regional filtering and difficulty sorting retain original catalog selection indices", () => {
  const all = filterStages(indexed, {
    query: "",
    regionId: null,
    sort: "easiest",
  });
  assert.deepEqual(
    all.map((item) => item.index),
    [1, 0, 2],
  );
  const bavaria = filterStages(indexed, {
    query: "",
    regionId: "DE-BY",
    sort: "hardest",
  });
  assert.deepEqual(
    bavaria.map((item) => [item.stage.id, item.index]),
    [
      ["munich-2", 2],
      ["munich-1", 0],
    ],
  );
  assert.deepEqual(
    indexed.map((item) => item.index),
    [0, 1, 2],
    "sorting must not mutate the original catalog",
  );
});

test("search finds region translations, stations, service and German keyboard aliases", () => {
  for (const query of [
    "Bavaria S8 Pasing",
    "Bayern Pasing",
    "München Pasing",
    "Muenchen Pasing",
    "Munchen Pasing",
  ]) {
    assert.deepEqual(
      filterStages(indexed, { query, regionId: null, sort: "easiest" }).map(
        (item) => item.stage.id,
      ),
      ["munich-1"],
      query,
    );
  }
  assert.deepEqual(
    filterStages(indexed, {
      query: "ODEG Potsdam",
      regionId: "DE-BB",
      sort: "easiest",
    }).map((item) => item.index),
    [1],
  );
  assert.equal(
    filterStages(indexed, {
      query: "S8 Potsdam",
      regionId: null,
      sort: "easiest",
    }).length,
    0,
    "all query terms must match the same chapter",
  );
});

test("cross-region lines appear in either state, with no duplicated result", () => {
  for (const regionId of ["DE-BE", "DE-BB"]) {
    assert.deepEqual(
      filterStages(indexed, { query: "", regionId, sort: "easiest" }).map(
        (item) => item.stage.id,
      ),
      ["berlin-1"],
    );
  }
});

test("public service search accepts RE9 when source labels contain RE 9", () => {
  const spaced = indexStages(
    [{ ...stages[1], serviceId: "osm-123", line: "RE 9" }],
    regions,
  );
  assert.equal(
    filterStages(spaced, { query: "RE9", regionId: null, sort: "easiest" })
      .length,
    1,
  );
});

test("journey category and network filters intersect state selection without changing catalog indices", () => {
  const catalog = indexStages(
    [
      {
        ...stages[0],
        journeyKind: "city",
        networkId: "munich",
        areaName: { en: "Munich", de: "München" },
      },
      {
        ...stages[1],
        journeyKind: "regional",
        networkId: undefined,
        areaName: { en: "Brandenburg", de: "Brandenburg" },
        campaignOrigin: "Cottbus Hauptbahnhof",
        campaignDestination: "Potsdam Hauptbahnhof",
      },
      { ...stages[2], journeyKind: "longDistance", networkId: undefined },
    ],
    regions,
  );
  assert.deepEqual(
    filterStages(catalog, {
      query: "",
      regionId: "DE-BY",
      journeyKind: "city",
      networkId: "munich",
      sort: "easiest",
    }).map((item) => item.index),
    [0],
  );
  assert.equal(
    filterStages(catalog, {
      query: "",
      regionId: "DE-BE",
      journeyKind: "city",
      networkId: "munich",
      sort: "easiest",
    }).length,
    0,
  );
  assert.deepEqual(
    filterStages(catalog, {
      query: "Cottbus",
      regionId: null,
      journeyKind: "regional",
      sort: "easiest",
    }).map((item) => item.index),
    [1],
  );
  assert.deepEqual(
    filterStages(catalog, {
      query: "",
      regionId: null,
      journeyKind: "longDistance",
      sort: "easiest",
    }).map((item) => item.index),
    [2],
  );
  assert.equal(
    filterStages(catalog, { query: "", regionId: null, sort: "easiest" })
      .length,
    3,
  );
});

test("area labels are searchable in English and German independently of chapter city names", () => {
  const catalog = indexStages(
    [
      {
        ...stages[0],
        city: "Augsburg",
        areaName: { en: "Franconia", de: "Franken" },
      },
    ],
    regions,
  );
  for (const query of ["Franconia", "Franken"])
    assert.equal(
      filterStages(catalog, { query, regionId: null, sort: "easiest" }).length,
      1,
    );
});

test("catalog pagination limits rendering and safely clamps after filters shrink", () => {
  const hundreds = Array.from({ length: 321 }, (_, index) => index);
  assert.equal(chapterPage(hundreds, 0).items.length, CHAPTER_PAGE_SIZE);
  assert.deepEqual(chapterPage(hundreds, 53).items, [318, 319, 320]);
  assert.deepEqual(chapterPage(["found"], 53), {
    items: ["found"],
    page: 0,
    pages: 1,
  });
  assert.deepEqual(chapterPage([], 4), { items: [], page: 0, pages: 1 });
});
