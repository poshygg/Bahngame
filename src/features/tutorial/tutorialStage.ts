import { STAGES, type Stage } from "../../data/stages";

// Reuse verified geography. Tutorial content never enters the scored catalog.
const berlin = STAGES.find((stage) => stage.id === "DE.berlin")!;
const end = berlin.route.findIndex((stop) =>
  stop.name.includes("Friedrichstraße"),
);
const route = berlin.route.slice(Math.max(0, end - 2), end + 1);
export const TUTORIAL_STAGE: Stage = {
  ...berlin,
  id: "tutorial.DE.berlin",
  legacyId: undefined,
  line: "T",
  title: { en: "Your first little journey", de: "Deine erste kleine Reise" },
  subtitle: {
    en: "Three stations. No rush.",
    de: "Drei Stationen. Ganz in Ruhe.",
  },
  origin: route[0].name,
  stations: route.slice(1).map((stop) => stop.name),
  route,
  targetCps: 1,
};
