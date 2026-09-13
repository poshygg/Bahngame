import { useCallback, useMemo, useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { GERMAN_REGIONS } from "../../data/germany-regions";
import { CITY_NETWORKS } from "../../data/germany-campaigns";
import type { Stage } from "../../data/stages";
import { isUnlocked, type Progress, recordKey } from "../../game/progress";
import { useI18n } from "../../i18n";
import { C, F } from "../../theme";
import { Eyebrow, Icon, Star, Stars } from "../../components/ui";
import {
  chapterPage,
  CHAPTER_PAGE_SIZE,
  filterStages,
  indexStages,
  type StageSort,
  type JourneyKind,
} from "./filterStages";
import { GermanyMap } from "./GermanyMap";

type Props = {
  stages: Stage[];
  selectedId: string;
  progress: Progress;
  onSelect: (originalIndex: number) => void;
  onRecords: () => void;
};

export function GermanyBrowser({
  stages,
  selectedId,
  progress,
  onSelect,
  onRecords,
}: Props) {
  const { width } = useWindowDimensions();
  const narrow = width < 860;
  const { locale, l, t, n } = useI18n();
  const de = locale === "de";
  const [query, setQuery] = useState("");
  const [regionId, setRegionId] = useState<string | null>(null);
  const [journeyKind, setJourneyKind] = useState<JourneyKind | null>(null);
  const [networkId, setNetworkId] = useState<string | null>(null);
  const [sort, setSort] = useState<StageSort>("easiest");
  const [requestedPage, setPage] = useState(0);
  const [showRegions, setShowRegions] = useState(false);
  const indexed = useMemo(() => indexStages(stages, GERMAN_REGIONS), [stages]);
  const results = useMemo(
    () =>
      filterStages(indexed, { query, regionId, sort, journeyKind, networkId }),
    [indexed, query, regionId, sort, journeyKind, networkId],
  );
  const pagination = chapterPage(results, requestedPage);
  const region = GERMAN_REGIONS.find((item) => item.id === regionId);
  const counts = useMemo(
    () =>
      stages
        .filter(
          (stage) =>
            (!journeyKind || stage.journeyKind === journeyKind) &&
            (!networkId || stage.networkId === networkId),
        )
        .reduce<Record<string, number>>((totals, stage) => {
          for (const id of stage.regionIds ?? [])
            totals[id] = (totals[id] ?? 0) + 1;
          return totals;
        }, {}),
    [stages, journeyKind, networkId],
  );
  const availableNetworks = useMemo(() => {
    const ids = new Set(
      stages
        .filter(
          (stage) =>
            stage.journeyKind === "city" &&
            (!regionId || stage.regionIds?.includes(regionId)),
        )
        .map((stage) => stage.networkId),
    );
    return CITY_NETWORKS.filter((network) => ids.has(network.id));
  }, [stages, regionId]);
  const stars = stages.reduce(
    (total, stage) =>
      total +
      (progress.records[recordKey(stage.id, progress.profile)]?.stars ?? 0),
    0,
  );
  const selectRegion = useCallback((id: string | null) => {
    setRegionId(id);
    setNetworkId(null);
    setPage(0);
  }, []);
  const clearFilters = () => {
    setQuery("");
    setRegionId(null);
    setJourneyKind(null);
    setNetworkId(null);
    setPage(0);
  };
  const chooseKind = (kind: JourneyKind | null) => {
    setJourneyKind(kind);
    setNetworkId(null);
    setPage(0);
  };
  const kindLabel = (kind: JourneyKind | null) =>
    kind === "city"
      ? de
        ? "Stadtnetze"
        : "City networks"
      : kind === "regional"
        ? de
          ? "Durch die Bundesländer"
          : "Across the states"
        : kind === "longDistance"
          ? de
            ? "Fernverkehr"
            : "Long-distance"
          : de
            ? "Alle Reisen"
            : "All journeys";

  return (
    <View testID="germany-browser" style={s.browser}>
      <View style={s.heading}>
        <View style={{ flex: 1 }}>
          <Eyebrow>
            {de ? "02 / DEIN STRECKENNETZ" : "02 / YOUR RAIL NETWORK"}
          </Eyebrow>
          <Text style={s.title}>
            {de
              ? "Deutschland, Kapitel für Kapitel."
              : "Germany, chapter by chapter."}
          </Text>
          <Text style={s.body}>
            {de
              ? "Wähle eine Region, finde eine Linie und sammle Sterne auf jeder Etappe."
              : "Choose a region, find a line, and collect stars on every leg."}
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("journal")}
          onPress={onRecords}
          style={s.starPill}
        >
          <Star filled size={17} />
          <Text style={s.starText}>
            {n(stars)} / {n(stages.length * 3)}
          </Text>
        </Pressable>
      </View>
      <View testID="journey-kinds" style={s.kindRow}>
        {([null, "city", "regional", "longDistance"] as const).map((kind) => (
          <Pressable
            key={kind ?? "all"}
            testID={`journey-kind-${kind ?? "all"}`}
            accessibilityRole="button"
            aria-pressed={journeyKind === kind}
            onPress={() => chooseKind(kind)}
            style={[s.kindButton, journeyKind === kind && s.kindActive]}
          >
            <Icon
              name={
                kind === "city" ? "map" : kind === "regional" ? "flag" : "train"
              }
              color={journeyKind === kind ? C.primary : C.muted}
              size={18}
            />
            <Text
              style={[s.kindText, journeyKind === kind && { color: C.primary }]}
            >
              {kindLabel(kind)}
            </Text>
          </Pressable>
        ))}
      </View>
      <Text testID="journey-kind-description" style={s.kindDescription}>
        {journeyKind === "city"
          ? l({
              en: "Explore a named city's urban network, one line at a time. Choose a network below.",
              de: "Erkunde das Nahverkehrsnetz einer Stadt, Linie für Linie. Wähle unten ein Stadtnetz.",
            })
          : journeyKind === "regional"
            ? l({
                en: "Travel between towns on RE and RB routes, grouped by federal state. Each card shows the whole route and your current chapter.",
                de: "Reise auf RE- und RB-Strecken zwischen Städten, nach Bundesland gruppiert. Jede Karte zeigt die gesamte Strecke und dein aktuelles Kapitel.",
              })
            : journeyKind === "longDistance"
              ? l({
                  en: "Follow ICE, IC and EC routes across longer distances and state borders.",
                  de: "Folge ICE-, IC- und EC-Strecken über längere Distanzen und Landesgrenzen.",
                })
              : l({
                  en: "City networks explore one urban area. State journeys connect towns by regional rail. Long-distance journeys cross the country.",
                  de: "Stadtnetze erkunden einen Ballungsraum. Länderreisen verbinden Städte im Regionalverkehr. Fernreisen führen quer durchs Land.",
                })}
      </Text>
      {journeyKind === "city" && (
        <View testID="city-networks" style={s.networks}>
          {availableNetworks.map((network) => (
            <Pressable
              key={network.id}
              testID={`city-network-${network.id}`}
              accessibilityRole="button"
              aria-pressed={networkId === network.id}
              onPress={() => {
                setNetworkId(networkId === network.id ? null : network.id);
                setPage(0);
              }}
              style={[s.networkChip, networkId === network.id && s.kindActive]}
            >
              <Text
                style={[
                  s.networkText,
                  networkId === network.id && { color: C.primary },
                ]}
              >
                {l(network.name)}
              </Text>
            </Pressable>
          ))}
          {availableNetworks.length === 0 && (
            <Text style={s.body}>
              {de
                ? "Für diese Auswahl ist noch kein Stadtnetz enthalten."
                : "No city network is included for this selection yet."}
            </Text>
          )}
        </View>
      )}
      <View style={[s.layout, narrow && s.narrowLayout]}>
        <View style={[s.mapColumn, narrow && { width: "100%" }]}>
          <GermanyMap
            selectedRegion={regionId}
            counts={counts}
            onRegion={selectRegion}
          />
          <Pressable
            testID="region-filter-toggle"
            accessibilityRole="button"
            aria-expanded={showRegions}
            onPress={() => setShowRegions(!showRegions)}
            style={s.regionToggle}
          >
            <Icon name="map" size={17} color={C.primary} />
            <Text style={s.regionToggleText}>
              {region
                ? l(region.name)
                : de
                  ? "Alle Bundesländer"
                  : "All federal states"}
            </Text>
            <Text style={s.regionToggleText}>{showRegions ? "−" : "+"}</Text>
          </Pressable>
          {showRegions && (
            <View style={s.regionList}>
              {GERMAN_REGIONS.map((item) => (
                <Pressable
                  key={item.id}
                  testID={`region-filter-${item.id}`}
                  accessibilityRole="button"
                  aria-pressed={regionId === item.id}
                  onPress={() =>
                    selectRegion(regionId === item.id ? null : item.id)
                  }
                  style={[
                    s.regionItem,
                    regionId === item.id && s.regionSelected,
                  ]}
                >
                  <Text
                    style={[
                      s.regionName,
                      regionId === item.id && { color: C.primary },
                    ]}
                  >
                    {l(item.name)}
                  </Text>
                  <Text style={s.regionCount}>{counts[item.id] ?? 0}</Text>
                </Pressable>
              ))}
            </View>
          )}
        </View>
        <View style={s.listColumn}>
          <View style={s.searchRow}>
            <TextInput
              testID="stage-search"
              accessibilityLabel={
                de
                  ? "Region, Stadt, Bahnhof oder Linie suchen"
                  : "Search region, city, station or service"
              }
              placeholder={
                de
                  ? "Region, Stadt, Bahnhof oder Linie …"
                  : "Region, city, station or service …"
              }
              placeholderTextColor={C.faint}
              value={query}
              onChangeText={(value) => {
                setQuery(value);
                setPage(0);
              }}
              autoCorrect={false}
              autoCapitalize="none"
              returnKeyType="search"
              style={s.search}
            />
            {(query || regionId || journeyKind || networkId) && (
              <Pressable
                testID="clear-stage-search"
                accessibilityRole="button"
                accessibilityLabel={
                  de ? "Filter zurücksetzen" : "Clear filters"
                }
                onPress={clearFilters}
                style={s.clear}
              >
                <Icon name="close" size={18} />
              </Pressable>
            )}
          </View>
          <View style={s.sortRow}>
            <Text style={s.sortLabel}>
              {de ? "Schwierigkeit" : "Difficulty"}
            </Text>
            {(["easiest", "hardest"] as const).map((value) => (
              <Pressable
                key={value}
                testID={`sort-${value}`}
                accessibilityRole="button"
                aria-pressed={sort === value}
                onPress={() => {
                  setSort(value);
                  setPage(0);
                }}
                style={[s.sortButton, sort === value && s.sortActive]}
              >
                <Text
                  style={[s.sortText, sort === value && { color: C.primary }]}
                >
                  {value === "easiest"
                    ? de
                      ? "Leicht zuerst"
                      : "Easiest first"
                    : de
                      ? "Schwer zuerst"
                      : "Hardest first"}
                </Text>
              </Pressable>
            ))}
          </View>
          <View style={s.resultHeading}>
            <Text testID="chapter-result-count" style={s.resultCount}>
              {n(results.length)} {de ? "Kapitel" : "chapters"}
              {region ? ` · ${l(region.name)}` : ""}
              {journeyKind ? ` · ${kindLabel(journeyKind)}` : ""}
            </Text>
            <Text style={s.pageCount}>
              {pagination.page + 1} / {pagination.pages}
            </Text>
          </View>
          <View testID="chapter-list" style={s.chapters}>
            {pagination.items.map(({ stage, index }) => {
              const unlocked = isUnlocked(
                progress,
                index,
                progress.profile,
                stage.countryId,
              );
              const record =
                progress.records[recordKey(stage.id, progress.profile)];
              const selected = stage.id === selectedId;
              const chapter = stage.chapter ?? 1;
              const total = stage.chapters ?? 1;
              return (
                <Pressable
                  key={stage.id}
                  testID={`stage-${stage.id}`}
                  accessibilityRole="button"
                  accessibilityLabel={`${stage.areaName ? l(stage.areaName) : stage.city}, ${l(stage.title)}, ${de ? "Kapitel" : "Chapter"} ${chapter} / ${total}${unlocked ? "" : `, ${t("locked")}`}`}
                  aria-pressed={selected}
                  disabled={!unlocked}
                  onPress={() => onSelect(index)}
                  style={[s.chapter, selected && s.chapterSelected]}
                >
                  <View style={s.chapterTop}>
                    <Text testID={`chapter-area-${stage.id}`} style={s.city}>
                      {stage.areaName ? l(stage.areaName) : stage.city}
                    </Text>
                    <View style={s.serviceBadge}>
                      <Text style={s.serviceText}>{stage.line}</Text>
                    </View>
                    <Icon
                      name={unlocked ? (selected ? "check" : "arrow") : "lock"}
                      size={16}
                      color={unlocked ? C.primary : C.faint}
                    />
                  </View>
                  {stage.journeyKind && (
                    <Text
                      testID={`chapter-kind-${stage.id}`}
                      style={s.cardKind}
                    >
                      {kindLabel(stage.journeyKind)}
                    </Text>
                  )}
                  <Text style={s.chapterName}>{l(stage.title)}</Text>
                  {stage.campaignOrigin && stage.campaignDestination && (
                    <Text
                      testID={`chapter-campaign-${stage.id}`}
                      style={s.campaignRoute}
                    >
                      {de ? "Gesamte Strecke" : "Whole route"}:{" "}
                      {stage.campaignOrigin} → {stage.campaignDestination}
                    </Text>
                  )}
                  <Text style={s.routeNames}>
                    {stage.campaignOrigin
                      ? `${de ? "Dieses Kapitel" : "This chapter"}: `
                      : ""}
                    {stage.origin} → {stage.stations.at(-1)}
                  </Text>
                  <View style={s.chapterMeta}>
                    <Text style={s.metaText}>
                      {de ? "Kapitel" : "Chapter"} {chapter}/{total} ·{" "}
                      {t(stage.difficulty)} ·{" "}
                      {t("stopCount", { count: stage.stations.length })}
                    </Text>
                    <Stars count={record?.stars ?? 0} size={13} />
                  </View>
                  {!unlocked && (
                    <Text style={s.locked}>
                      {de
                        ? "Schließe das vorherige Kapitel dieser Linie ab."
                        : "Complete the previous chapter of this line to unlock."}
                    </Text>
                  )}
                </Pressable>
              );
            })}
            {results.length === 0 && (
              <View testID="chapter-empty" style={s.empty}>
                <Icon name="map" size={30} color={C.muted} />
                <Text style={s.emptyTitle}>
                  {de ? "Kein passendes Kapitel" : "No matching chapters"}
                </Text>
                <Text style={s.body}>
                  {journeyKind === "regional" &&
                  regionId &&
                  ["DE-BE", "DE-HH", "DE-HB"].includes(regionId)
                    ? l({
                        en: "City-states are best explored through City networks. Choose that category or another state for regional journeys.",
                        de: "Stadtstaaten erkundest du am besten unter Stadtnetze. Wähle diese Kategorie oder ein anderes Bundesland für Regionalreisen.",
                      })
                    : de
                      ? "Versuche einen anderen Bahnhof oder setze die Filter zurück."
                      : "Try another station name or clear the filters."}
                </Text>
                <Pressable
                  accessibilityRole="button"
                  onPress={clearFilters}
                  style={s.emptyReset}
                >
                  <Text style={s.sortText}>
                    {de ? "Filter zurücksetzen" : "Clear filters"}
                  </Text>
                </Pressable>
                {journeyKind === "regional" &&
                  regionId &&
                  ["DE-BE", "DE-HH", "DE-HB"].includes(regionId) && (
                    <Pressable
                      testID="empty-city-networks"
                      accessibilityRole="button"
                      onPress={() => chooseKind("city")}
                      style={s.emptyReset}
                    >
                      <Text style={s.sortText}>
                        {de ? "Stadtnetze entdecken" : "Explore city networks"}
                      </Text>
                    </Pressable>
                  )}
              </View>
            )}
          </View>
          <View style={s.pagination}>
            <Pressable
              testID="chapter-page-previous"
              accessibilityRole="button"
              accessibilityLabel={de ? "Vorherige Seite" : "Previous page"}
              disabled={pagination.page === 0}
              onPress={() => setPage(pagination.page - 1)}
              style={[s.pageButton, pagination.page === 0 && s.disabled]}
            >
              <Icon name="back" size={17} />
              <Text style={s.pageText}>{de ? "Zurück" : "Previous"}</Text>
            </Pressable>
            <Text style={s.range}>
              {results.length
                ? `${pagination.page * CHAPTER_PAGE_SIZE + 1}–${Math.min(results.length, (pagination.page + 1) * CHAPTER_PAGE_SIZE)} / ${n(results.length)}`
                : "0 / 0"}
            </Text>
            <Pressable
              testID="chapter-page-next"
              accessibilityRole="button"
              accessibilityLabel={de ? "Nächste Seite" : "Next page"}
              disabled={pagination.page + 1 >= pagination.pages}
              onPress={() => setPage(pagination.page + 1)}
              style={[
                s.pageButton,
                pagination.page + 1 >= pagination.pages && s.disabled,
              ]}
            >
              <Text style={s.pageText}>{de ? "Weiter" : "Next"}</Text>
              <Icon name="arrow" size={17} />
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  kindRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  kindButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    minHeight: 48,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 10,
    backgroundColor: C.paper,
  },
  kindActive: { backgroundColor: "#EDF4FC", borderColor: "#B4CFE8" },
  kindText: { fontFamily: F.bold, fontSize: 12, color: C.ink },
  kindDescription: {
    fontFamily: F.regular,
    fontSize: 12,
    lineHeight: 20,
    color: C.muted,
    marginTop: 10,
    marginBottom: 18,
  },
  networks: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
    marginBottom: 20,
  },
  networkChip: {
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: 12,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: C.line,
    backgroundColor: C.paper,
  },
  networkText: { fontFamily: F.medium, fontSize: 12, color: C.ink },
  cardKind: { fontFamily: F.medium, fontSize: 10, color: C.primary },
  campaignRoute: {
    fontFamily: F.medium,
    fontSize: 11,
    lineHeight: 17,
    color: C.ink,
  },
  browser: { marginTop: 34 },
  heading: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
    marginBottom: 22,
    flexWrap: "wrap",
  },
  title: {
    color: C.ink,
    fontFamily: F.bold,
    fontSize: 24,
    lineHeight: 31,
    marginTop: 8,
  },
  body: {
    color: C.muted,
    fontFamily: F.regular,
    fontSize: 13,
    lineHeight: 21,
    marginTop: 5,
  },
  starPill: {
    flexDirection: "row",
    gap: 7,
    alignItems: "center",
    minHeight: 44,
    paddingHorizontal: 12,
    backgroundColor: C.paper,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: C.line,
  },
  starText: { color: C.ink, fontFamily: F.medium, fontSize: 12 },
  layout: { flexDirection: "row", alignItems: "flex-start", gap: 24 },
  narrowLayout: { flexDirection: "column" },
  mapColumn: { width: 315, gap: 10 },
  listColumn: { flex: 1, width: "100%", minWidth: 0 },
  regionToggle: {
    minHeight: 46,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    paddingHorizontal: 12,
    backgroundColor: C.paper,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: C.line,
  },
  regionToggleText: {
    flexShrink: 1,
    color: C.primary,
    fontFamily: F.medium,
    fontSize: 12,
  },
  regionList: { gap: 4 },
  regionItem: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    borderRadius: 7,
  },
  regionSelected: { backgroundColor: "#E6F0FA" },
  regionName: { flex: 1, fontFamily: F.medium, color: C.ink, fontSize: 12 },
  regionCount: { fontFamily: F.regular, color: C.muted, fontSize: 11 },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.paper,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 9,
  },
  search: {
    flex: 1,
    minWidth: 0,
    minHeight: 48,
    paddingHorizontal: 14,
    fontFamily: F.regular,
    fontSize: 13,
    color: C.ink,
  },
  clear: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  sortRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    alignItems: "center",
    marginTop: 10,
  },
  sortLabel: {
    fontFamily: F.medium,
    fontSize: 11,
    color: C.muted,
    marginRight: 4,
  },
  sortButton: {
    paddingHorizontal: 12,
    minHeight: 44,
    justifyContent: "center",
    borderRadius: 7,
    borderWidth: 1,
    borderColor: C.line,
  },
  sortActive: { borderColor: "#B4CFE8", backgroundColor: "#EDF4FC" },
  sortText: { color: C.ink, fontFamily: F.medium, fontSize: 11 },
  resultHeading: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
    marginTop: 16,
    marginBottom: 10,
  },
  resultCount: { flex: 1, fontFamily: F.medium, fontSize: 11, color: C.muted },
  pageCount: { fontFamily: F.regular, fontSize: 11, color: C.faint },
  chapters: { gap: 9 },
  chapter: {
    backgroundColor: C.paper,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 10,
    padding: 14,
    gap: 6,
  },
  chapterSelected: { borderColor: C.primary, backgroundColor: "#F1F7FD" },
  chapterTop: { flexDirection: "row", alignItems: "center", gap: 8 },
  city: { flex: 1, color: C.ink, fontFamily: F.bold, fontSize: 15 },
  serviceBadge: {
    backgroundColor: "#EBEFEF",
    borderRadius: 4,
    paddingHorizontal: 7,
    paddingVertical: 4,
    maxWidth: "45%",
  },
  serviceText: { color: "#24465F", fontFamily: F.bold, fontSize: 10 },
  chapterName: {
    color: C.ink,
    fontFamily: F.medium,
    fontSize: 12,
    lineHeight: 18,
  },
  routeNames: {
    color: C.muted,
    fontFamily: F.regular,
    fontSize: 11,
    lineHeight: 17,
  },
  chapterMeta: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 6,
    marginTop: 3,
  },
  metaText: {
    color: C.muted,
    fontFamily: F.regular,
    fontSize: 10,
    lineHeight: 16,
    flexShrink: 1,
  },
  locked: {
    color: C.faint,
    fontFamily: F.regular,
    fontSize: 10,
    lineHeight: 16,
  },
  empty: {
    padding: 28,
    gap: 10,
    alignItems: "flex-start",
    backgroundColor: C.paper,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.line,
  },
  emptyTitle: { fontFamily: F.bold, color: C.ink, fontSize: 17 },
  emptyReset: {
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 7,
    paddingHorizontal: 14,
    minHeight: 44,
    justifyContent: "center",
    marginTop: 8,
  },
  pagination: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    marginTop: 14,
  },
  pageButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    minHeight: 44,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 7,
    backgroundColor: C.paper,
  },
  pageText: { color: C.ink, fontFamily: F.medium, fontSize: 11 },
  range: { color: C.muted, fontFamily: F.regular, fontSize: 10 },
  disabled: { opacity: 0.35 },
});
