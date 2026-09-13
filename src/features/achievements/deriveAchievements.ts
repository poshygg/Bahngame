import { CITY_NETWORKS, type CityNetwork } from "../../data/germany-campaigns";
import { STAGES, type InputProfile, type Stage } from "../../data/stages";
import type { Localized } from "../../data/types";
import { type Progress, recordKey, routeSignature } from "../../game/progress";

export type AchievementCriterion = {
  id: string;
  label: Localized;
  current: number;
  target: number;
};
export type Achievement = {
  id: string;
  title: Localized;
  criteria: AchievementCriterion[];
  current: number;
  target: number;
  earned: boolean;
};

function achievement(
  id: string,
  title: Localized,
  criteria: AchievementCriterion[],
): Achievement {
  const current = criteria.reduce(
    (total, item) => total + Math.min(item.current, item.target),
    0,
  );
  const target = criteria.reduce((total, item) => total + item.target, 0);
  return {
    id,
    title,
    criteria,
    current,
    target,
    earned: target > 0 && current === target,
  };
}

/** Derived, never persisted: retired routes and a changed scoring signature cannot award stamps. */
export function deriveAchievements(
  progress: Progress,
  profile: InputProfile,
  stages: Stage[] = STAGES,
  networks: CityNetwork[] = CITY_NETWORKS,
) {
  const catalog = [
    ...new Map(
      stages
        .filter((stage) => !stage.isCustom)
        .map((stage) => [stage.id, stage]),
    ).values(),
  ];
  const passed = new Set(
    catalog
      .filter((stage) => {
        const record = progress.records[recordKey(stage.id, profile)];
        return (
          !!record &&
          Number.isInteger(record.stars) &&
          record.stars >= 1 &&
          record.stars <= 3 &&
          Number.isFinite(record.score) &&
          record.score > 0 &&
          record.routeSignature === routeSignature(stage)
        );
      })
      .map((stage) => stage.id),
  );
  const cityGroups = networks
    .map((network) => ({
      network,
      stages: catalog.filter(
        (stage) =>
          stage.journeyKind === "city" && stage.networkId === network.id,
      ),
    }))
    .filter((group) => group.stages.length > 0);
  const cityStamps = cityGroups.map(({ network, stages: cityStages }) =>
    achievement(`city-${network.id}`, network.name, [
      {
        id: network.id,
        label: {
          en: `Pass all ${cityStages.length} chapters in this city network.`,
          de: `Bestehe alle ${cityStages.length} Kapitel in diesem Stadtnetz.`,
        },
        current: cityStages.filter((stage) => passed.has(stage.id)).length,
        target: cityStages.length,
      },
    ]),
  );
  const combinations: Achievement[] = [];
  const trio = ["berlin", "hamburg", "munich"].map((id) =>
    cityGroups.find((group) => group.network.id === id),
  );
  if (trio.every((group) => !!group))
    combinations.push(
      achievement(
        "city-trio",
        { en: "Three-city traveller", de: "Drei-Städte-Reisende" },
        trio.map((group) => ({
          id: group!.network.id,
          label: {
            en: `${group!.network.name.en}: pass one chapter.`,
            de: `${group!.network.name.de}: Bestehe ein Kapitel.`,
          },
          current: group!.stages.some((stage) => passed.has(stage.id)) ? 1 : 0,
          target: 1,
        })),
      ),
    );
  const serviceCombos = [
    {
      id: "urban-duo",
      title: { en: "S + U explorer", de: "S + U entdecken" },
      kinds: ["S", "U"],
    },
    {
      id: "regional-duo",
      title: { en: "RE + RB explorer", de: "RE + RB entdecken" },
      kinds: ["RE", "RB"],
    },
    {
      id: "express-trio",
      title: { en: "ICE + IC + EC traveller", de: "ICE + IC + EC erleben" },
      kinds: ["ICE", "IC", "EC"],
    },
  ];
  for (const combo of serviceCombos) {
    const groups = combo.kinds.map((kind) =>
      catalog.filter((stage) => stage.serviceKind?.toUpperCase() === kind),
    );
    if (groups.some((group) => group.length === 0)) continue;
    combinations.push(
      achievement(
        combo.id,
        combo.title,
        groups.map((group, index) => ({
          id: combo.kinds[index],
          label: {
            en: `${combo.kinds[index]}: pass one chapter.`,
            de: `${combo.kinds[index]}: Bestehe ein Kapitel.`,
          },
          current: group.some((stage) => passed.has(stage.id)) ? 1 : 0,
          target: 1,
        })),
      ),
    );
  }
  const regional = catalog.filter((stage) => stage.journeyKind === "regional");
  const states = new Set(regional.flatMap((stage) => stage.regionIds ?? []));
  const visited = new Set(
    regional
      .filter((stage) => passed.has(stage.id))
      .flatMap((stage) => stage.regionIds ?? []),
  );
  if (states.size >= 2) {
    const target = Math.min(3, states.size);
    combinations.push(
      achievement(
        "state-mix",
        { en: "State explorer", de: "Länder entdecken" },
        [
          {
            id: "states",
            label: {
              en: `Pass a regional chapter in ${target} different federal states.`,
              de: `Bestehe ein Regionalkapitel in ${target} verschiedenen Bundesländern.`,
            },
            current: Math.min(visited.size, target),
            target,
          },
        ],
      ),
    );
  }
  return {
    cityStamps,
    combinations,
    passedChapters: passed.size,
    earned: [...cityStamps, ...combinations].filter((item) => item.earned)
      .length,
    total: cityStamps.length + combinations.length,
  };
}
