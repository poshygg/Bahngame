import { useMemo, useState } from "react";
import {
  Linking,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import { RAIL_CATALOG } from "../../data/rail/catalog";
import type { RailStation } from "../../data/rail/types";
import type { Stage } from "../../data/stages";
import { recordKey, routeSignature, type Progress } from "../../game/progress";
import { createCustomStage } from "../../data/railStages";
import {
  createRailNetwork,
  findRailJourney,
  searchRailStations,
  type RailJourney,
} from "../../game/railRouting";
import { Button, Icon } from "../../components/ui";
import { RouteMap } from "../../components/RouteMap";
import { useI18n } from "../../i18n";
import { C, F } from "../../theme";
import { useSavedJourneys } from "./useSavedJourneys";

export function CustomRouteBuilder({
  onStart,
  progress,
}: {
  onStart: (stage: Stage) => void;
  progress?: Progress;
}) {
  const { locale, l, n } = useI18n();
  const mobile = useWindowDimensions().width < 760;
  const de = locale === "de";
  const network = useMemo(() => createRailNetwork(RAIL_CATALOG), []);
  const [origin, setOrigin] = useState<RailStation>();
  const [destination, setDestination] = useState<RailStation>();
  const [originQuery, setOriginQuery] = useState("");
  const [destinationQuery, setDestinationQuery] = useState("");
  const [editing, setEditing] = useState<"origin" | "destination" | null>(null);
  const [journey, setJourney] = useState<RailJourney | null>(null);
  const [error, setError] = useState<string>();
  const { saved, loaded, storageError, save, remove } = useSavedJourneys();
  const examples = useMemo(() => {
    const all = RAIL_CATALOG.lines.filter(
      (line) => line.stationIds.length >= 3,
    );
    return [
      all.find((line) => line.service === "ICE"),
      all.find(
        (line) =>
          line.dbOperator &&
          line.ref.replace(/\s/g, "").toUpperCase() === "RE9",
      ) ??
        all.find((line) => line.ref.replace(/\s/g, "").toUpperCase() === "RE9"),
      all.find((line) => line.service === "U"),
    ].filter((line): line is NonNullable<typeof line> => !!line);
  }, []);
  const stage = useMemo(
    () => (journey ? createCustomStage(journey) : null),
    [journey],
  );
  const bestRecord =
    stage && progress
      ? progress.records[recordKey(stage.id, progress.profile)]
      : undefined;
  const currentBest =
    stage && bestRecord?.routeSignature === routeSignature(stage)
      ? bestRecord
      : undefined;
  const plan = (from = origin, to = destination) => {
    setJourney(null);
    setEditing(null);
    if (!from || !to) {
      setError(
        de
          ? "Wähle zwei Bahnhöfe aus den Vorschlägen."
          : "Select both stations from the suggestions.",
      );
      return;
    }
    if (from.id === to.id) {
      setError(
        de
          ? "Start und Ziel müssen verschieden sein."
          : "Choose different departure and arrival stations.",
      );
      return;
    }
    const result = findRailJourney(network, from.id, to.id);
    setJourney(result);
    setError(
      result
        ? undefined
        : de
          ? "In diesem Datenstand gibt es keine verbundene Route zwischen diesen Bahnhöfen. Probiere eine Beispielroute oder andere Bahnhöfe."
          : "No connected route between these stations is included in this snapshot. Try an example route or different stations.",
    );
  };
  const choosePair = (fromId: string, toId: string) => {
    const from = network.stations.get(fromId),
      to = network.stations.get(toId);
    setOrigin(from);
    setDestination(to);
    setOriginQuery(from?.name ?? "");
    setDestinationQuery(to?.name ?? "");
    plan(from, to);
  };
  const place = (station: RailStation) => {
    const city = RAIL_CATALOG.cities.find((item) => item.id === station.cityId);
    const state = RAIL_CATALOG.states.find(
      (item) => item.id === station.stateId,
    );
    return [city ? l(city.name) : "", state ? l(state.name) : ""]
      .filter(Boolean)
      .join(" · ");
  };
  return (
    <View testID="custom-route-builder" style={s.card}>
      <Text style={s.title}>
        {de ? "Deine eigene Bahnreise" : "Build your railway journey"}
      </Text>
      <Text style={s.body}>
        {de
          ? "Wähle Start und Ziel. Die Halte der verbundenen Bahnlinien werden zu deiner Tippstrecke."
          : "Choose a departure and arrival. Stops along the connected railway services become your typing route."}
      </Text>
      <Text style={s.meta}>
        {n(RAIL_CATALOG.stations.length)} {de ? "Bahnhöfe" : "stations"} ·{" "}
        {de ? "Datenstand" : "Snapshot"} {RAIL_CATALOG.checkedAt}
      </Text>
      <View style={[s.fields, mobile && { flexDirection: "column" }]}>
        {(["origin", "destination"] as const).map((key) => {
          const isOrigin = key === "origin";
          const query = isOrigin ? originQuery : destinationQuery;
          const selected = isOrigin ? origin : destination;
          return (
            <View key={key} style={[s.field, mobile && s.mobileField]}>
              <Text style={s.label}>
                {isOrigin
                  ? de
                    ? "Abfahrt"
                    : "Departure"
                  : de
                    ? "Ankunft"
                    : "Arrival"}
              </Text>
              <TextInput
                testID={`custom-${key}`}
                accessibilityLabel={
                  isOrigin
                    ? de
                      ? "Abfahrtsbahnhof suchen"
                      : "Search departure station"
                    : de
                      ? "Zielbahnhof suchen"
                      : "Search arrival station"
                }
                style={[s.input, selected && s.selectedInput]}
                value={query}
                placeholder={
                  isOrigin ? "Berlin Hauptbahnhof" : "München Hauptbahnhof"
                }
                autoCorrect={false}
                onFocus={() => setEditing(key)}
                onChangeText={(value) => {
                  if (isOrigin) {
                    setOriginQuery(value);
                    setOrigin(undefined);
                  } else {
                    setDestinationQuery(value);
                    setDestination(undefined);
                  }
                  setJourney(null);
                  setError(undefined);
                  setEditing(key);
                }}
              />
              {selected && <Text style={s.meta}>{place(selected)}</Text>}
              {editing === key && (
                <View
                  testID={`custom-${key}-suggestions`}
                  style={s.suggestions}
                >
                  {searchRailStations(RAIL_CATALOG.stations, query).map(
                    (station) => (
                      <Pressable
                        key={station.id}
                        testID={`custom-${key}-option-${station.id}`}
                        accessibilityRole="button"
                        onPress={() => {
                          if (isOrigin) {
                            setOrigin(station);
                            setOriginQuery(station.name);
                          } else {
                            setDestination(station);
                            setDestinationQuery(station.name);
                          }
                          setEditing(null);
                          setJourney(null);
                          setError(undefined);
                        }}
                        style={s.suggestion}
                      >
                        <Text style={s.stationName}>{station.name}</Text>
                        <Text style={s.meta}>{place(station)}</Text>
                      </Pressable>
                    ),
                  )}
                  {searchRailStations(RAIL_CATALOG.stations, query).length ===
                    0 && (
                    <Text style={s.empty}>
                      {de
                        ? "Kein Bahnhof im enthaltenen Netz gefunden."
                        : "No station found in the included network."}
                    </Text>
                  )}
                </View>
              )}
            </View>
          );
        })}
      </View>
      <View style={s.actions}>
        <Button
          testID="custom-plan"
          title={de ? "Route finden" : "Find route"}
          onPress={() => plan()}
          disabled={!origin || !destination}
          icon="map"
        />
        <Button
          testID="custom-swap"
          title={de ? "Tauschen" : "Swap"}
          secondary
          onPress={() => {
            const from = destination,
              to = origin;
            setOrigin(from);
            setDestination(to);
            setOriginQuery(from?.name ?? "");
            setDestinationQuery(to?.name ?? "");
            setJourney(null);
            setError(undefined);
            setEditing(null);
          }}
        />
      </View>
      {error && (
        <Text
          testID="custom-route-error"
          accessibilityRole="alert"
          style={s.error}
        >
          {error}
        </Text>
      )}
      <View style={s.examples}>
        <Text style={s.label}>{de ? "Ausprobieren" : "Try a connection"}</Text>
        {examples.map((line) => (
          <Pressable
            key={line.id}
            testID={`custom-example-${line.service}`}
            accessibilityRole="button"
            onPress={() =>
              choosePair(line.stationIds[0], line.stationIds.at(-1)!)
            }
            style={s.example}
          >
            <Text style={s.exampleText}>
              {line.ref} · {line.from} → {line.to}
            </Text>
          </Pressable>
        ))}
      </View>
      {journey && stage && (
        <View testID="custom-route-preview" style={s.preview}>
          {currentBest && (
            <Text testID="custom-personal-best" style={s.exampleText}>
              {de ? "Persönlicher Rekord" : "Personal best"}:{" "}
              {n(currentBest.score)} · {"★".repeat(currentBest.stars)}
            </Text>
          )}
          <Text style={s.subtitle}>
            {journey.origin.name} → {journey.destination.name}
          </Text>
          <Text style={s.body}>
            {n(stage.stations.length)} {de ? "Zielhalte" : "destination stops"}{" "}
            · {n(journey.transfers)} {de ? "Linienwechsel" : "line changes"}
          </Text>
          <Text style={s.meta}>
            {de
              ? "Wenige Linienwechsel, danach wenige Halte. Keine Fahrzeitberechnung."
              : "Fewest line changes, then fewest stops. No timetable or travel-time calculation."}
          </Text>
          <View style={s.map}>
            <RouteMap stage={stage} preview height={mobile ? 230 : 290} />
          </View>
          {journey.legs.map((leg, index) => (
            <View
              key={`${leg.line.id}:${index}`}
              testID="custom-route-leg"
              style={s.leg}
            >
              <Text style={s.service}>{leg.line.ref}</Text>
              <View style={{ flex: 1 }}>
                <Text style={s.stationName}>
                  {network.stations.get(leg.stationIds[0])?.name} →{" "}
                  {network.stations.get(leg.stationIds.at(-1)!)?.name}
                </Text>
                <Text style={s.meta}>
                  {leg.line.operator ||
                    (de
                      ? "Betreiber nicht angegeben"
                      : "Operator not specified")}{" "}
                  · {leg.stationIds.length - 1} {de ? "Halte" : "stops"}
                </Text>
                <Pressable
                  accessibilityRole="link"
                  onPress={() => {
                    void Linking.openURL(
                      leg.line.officialSourceUrl ?? leg.line.sourceUrl,
                    );
                  }}
                >
                  <Text style={s.source}>
                    {de ? "Linienquelle" : "Service source"} ↗
                  </Text>
                </Pressable>
              </View>
            </View>
          ))}
          <Text style={s.stopList}>
            {stage.route.map((stop) => stop.name).join(" → ")}
          </Text>
          <Button
            testID="custom-play"
            title={de ? "Speichern und spielen" : "Save and play"}
            icon="play"
            disabled={!loaded}
            onPress={async () => {
              if (await save(journey.origin.id, journey.destination.id))
                onStart(stage);
            }}
          />
        </View>
      )}
      {!!saved.length && (
        <View testID="saved-custom-routes" style={s.saved}>
          <Text style={s.subtitle}>{de ? "Meine Routen" : "My routes"}</Text>
          {saved.map((item) => {
            const from = network.stations.get(item.originId),
              to = network.stations.get(item.destinationId);
            return (
              <View
                key={`${item.originId}:${item.destinationId}`}
                style={s.savedRow}
              >
                <Pressable
                  accessibilityRole="button"
                  disabled={!from || !to}
                  onPress={() => choosePair(item.originId, item.destinationId)}
                  style={{ flex: 1, paddingVertical: 10 }}
                >
                  <Text style={s.stationName}>
                    {from?.name ??
                      (de
                        ? "Bahnhof nicht verfügbar"
                        : "Station unavailable")}{" "}
                    →{" "}
                    {to?.name ??
                      (de ? "Bahnhof nicht verfügbar" : "Station unavailable")}
                  </Text>
                  {(!from || !to) && (
                    <Text style={s.meta}>
                      {de
                        ? "Nicht im aktuellen Datensatz"
                        : "Not in the current snapshot"}
                    </Text>
                  )}
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={
                    de ? "Gespeicherte Route entfernen" : "Remove saved route"
                  }
                  onPress={() => remove(item.originId, item.destinationId)}
                  style={s.remove}
                >
                  <Icon name="close" size={16} color={C.muted} />
                </Pressable>
              </View>
            );
          })}
        </View>
      )}
      {storageError && (
        <Text style={s.error}>
          {de
            ? "Diese Route konnte nicht lokal gespeichert werden."
            : "This route could not be saved locally."}
        </Text>
      )}
      <Text style={s.footnote}>
        {de
          ? "Echte, in OpenStreetMap erfasste Bahnlinien von DB und weiteren Betreibern. Kein Live-DB-Fahrplan; Daten können unvollständig oder veraltet sein. Spielverbindungen sind vereinfacht dargestellt."
          : "Real railway services mapped in OpenStreetMap, including DB and other operators. This is not a live DB timetable; coverage may be incomplete or outdated. Game connections are drawn schematically."}
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    backgroundColor: C.paper,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 14,
    padding: 20,
    gap: 12,
  },
  title: { fontFamily: F.bold, fontSize: 22, color: C.ink },
  subtitle: { fontFamily: F.bold, fontSize: 16, lineHeight: 23, color: C.ink },
  body: { fontFamily: F.regular, fontSize: 12, color: C.muted, lineHeight: 20 },
  meta: { fontFamily: F.regular, fontSize: 10, lineHeight: 16, color: C.muted },
  fields: { flexDirection: "row", gap: 14, alignItems: "flex-start" },
  field: { flex: 1, minWidth: 0, width: "100%", gap: 5 },
  mobileField: { flexGrow: 0, flexShrink: 0, flexBasis: "auto" },
  label: { fontFamily: F.medium, fontSize: 11, color: C.muted },
  input: {
    borderWidth: 1,
    borderColor: C.line,
    backgroundColor: C.bg,
    borderRadius: 8,
    padding: 12,
    minHeight: 46,
    fontFamily: F.medium,
    fontSize: 14,
    color: C.ink,
    width: "100%",
  },
  selectedInput: { borderColor: "#A4C5B0", backgroundColor: "#F5FAF5" },
  suggestions: {
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 8,
    width: "100%",
    overflow: "hidden",
  },
  suggestion: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: C.line,
    minHeight: 44,
  },
  stationName: {
    fontFamily: F.medium,
    color: C.ink,
    fontSize: 12,
    lineHeight: 18,
  },
  empty: { padding: 12, fontFamily: F.regular, color: C.muted, fontSize: 12 },
  actions: { flexDirection: "row", gap: 10, flexWrap: "wrap" },
  examples: { gap: 7 },
  example: {
    padding: 10,
    backgroundColor: C.sage,
    borderRadius: 7,
    minHeight: 40,
    justifyContent: "center",
  },
  exampleText: {
    fontFamily: F.medium,
    fontSize: 11,
    lineHeight: 17,
    color: C.primary,
  },
  error: {
    color: C.danger,
    fontFamily: F.medium,
    fontSize: 12,
    lineHeight: 19,
  },
  preview: {
    gap: 12,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: C.line,
  },
  map: {
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 10,
    overflow: "hidden",
  },
  leg: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    padding: 10,
    backgroundColor: "#F5F8FA",
    borderRadius: 8,
  },
  service: {
    fontFamily: F.bold,
    fontSize: 12,
    color: C.primary,
    minWidth: 45,
    maxWidth: 95,
  },
  source: {
    fontFamily: F.medium,
    color: C.primary,
    fontSize: 10,
    paddingVertical: 7,
  },
  stopList: {
    fontFamily: F.regular,
    fontSize: 11,
    lineHeight: 21,
    color: C.muted,
  },
  saved: { gap: 6, paddingTop: 14, borderTopWidth: 1, borderColor: C.line },
  savedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderBottomWidth: 1,
    borderColor: C.line,
  },
  remove: {
    padding: 12,
    minWidth: 44,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  footnote: {
    fontFamily: F.regular,
    color: C.muted,
    fontSize: 10,
    lineHeight: 17,
  },
});
