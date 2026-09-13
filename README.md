# Bahnreise 0.5.0

**Small keystrokes. Grand adventures.** A European railway typing game for Android, iOS, web and Windows, with English and German interfaces.

Germany is the first playable country pack, with a railway snapshot covering **all 16 federal states and 32 city discovery centres**. ICE, IC, EC, RE, RB, S-Bahn, U-Bahn and tram services become playable line campaigns. Long lines are divided into chapters of up to eight destination stops; complete a chapter to unlock the next one on that line. The original five city journeys, grand tour, 25 named landmarks and two-stop tutorial are retained. France, the Netherlands, Switzerland and Austria remain selectable previews.

Choose stages on the real Germany state map, search English/German region names, cities, stations or public line references such as `RE9`, and sort difficulty in either direction. The browser paginates chapters and the journal paginates completed records. Custom journeys let players choose real departure/arrival stations, inspect the sourced connections, save up to twelve endpoint pairs and play with the same scoring rules.

Version 0.5 retains **5,073 canonical stations and 911 directed service variants** for personal routing. Its campaign browser now has **794 stages**: 512 city-network stages, 55 state-journey chapters, and 227 long-distance stages, including the original six introductory journeys. Twelve selected metropolitan networks feature actual S-Bahn, U-Bahn, Regio-S-Bahn and selected Stadtbahn routes. Twenty-seven curated RE/RB corridors connect towns within the thirteen territorial states; Berlin, Hamburg and Bremen have urban-network collections. The smaller-city local routes remain available in custom routing. Exact/reversed duplicate stop sequences share one campaign, while the graph retains its source directions.

Use **City networks**, **Across the states**, or **Long-distance** to browse these collections; city-network chips narrow the urban choice. Regional cards display the federal state and complete city-to-city corridor above the current chapter's stops. Every regional corridor keeps all intervening source stops inside its state, and is divided into chapters of at most eight destinations. Older scores from removed campaigns stay archived under their original IDs and never unlock a replacement route.

The bundled network is a **selection of community-mapped services, including DB and other operators**, not every German route or a live DB timetable. Routing uses the fewest line changes, then the fewest stops. Source stop order and explicitly mapped interchange identity determine connections; missing data produces an unavailable result. See [the catalog source notes](docs/germany-rail-catalog.md) for coverage, dates, validation and operator examples.

## Play locally

- Web: run `npm run build:web`, then `npm run preview`, and open `http://localhost:4173`.
- Windows: open `release/Bahnreise-Windows-0.5.0.exe`, or `release/Bahnreise/Bahnreise.exe`. The portable app starts without a web server.
- Phone: run `npm start`, connect your phone to the same Wi-Fi, and scan the terminal QR with **Expo Go compatible with SDK 57**. `node scripts/mobile-qr.cjs` saves a shareable QR to `artifacts/mobile-qr.png` and local addresses to `artifacts/mobile-connection.json`.
- Mobile web: open `http://YOUR_COMPUTER_LAN_IP:4173` on the same network while the preview server runs.

Map tiles require an internet connection. If tiles are unavailable, the game retains the station route and clearly reports the missing basemap. Local server addresses are not public hosting URLs. Records stay in each browser, native app or desktop app; they are not synchronized across devices.

## Development and builds

Node.js 22.13 or later is required. Read the exact [Expo SDK 57 documentation](https://docs.expo.dev/versions/v57.0.0/) before changing native integration.

```sh
npm install
npm run web
npm start
```

The Expo native apps and web app share React Native views, pure game rules, translations and content packs. Electron packages the compiled web assets for Windows with a custom protocol, an isolated renderer and no Node integration.

```sh
npm run typecheck
npm test
npx playwright install chromium
npm run build:all
npm run test:e2e
npm run build:windows
node scripts/desktop-smoke.cjs --packaged
```

`npm test` runs the rule, catalog, vector-tile and map-motion tests in `tests/*.test.ts`. Playwright covers browser journeys, settings, tutorial, input handling, station-boundary animation and small screens. The desktop smoke test exercises the packaged renderer with a controlled frame clock because its window stays hidden; a separate live-map browser check verifies actual rendered movement. Automated tests use a synthetic vector fixture instead of repeatedly downloading public map tiles.

`build:all` exports Android/iOS Hermes bundles and web assets. **The native bundles are not APK or IPA installers.** Standalone installation and real on-screen keyboards still require device testing. To build a standalone Android APK using your own Expo account:

```sh
npx eas-cli login
npx eas-cli build --platform android --profile preview
```

The `preview` profile in `eas.json` requests an APK. A signed iOS device build requires an Apple developer account and signing credentials. Neither credentials nor signing keys are included. EAS builds and store publication have not been performed.

After changing code, rebuild the exported assets before refreshing the static preview. `npm run web` and `npm start` provide development reloads. The Windows packaging script builds from the existing Expo web export and a prepackaged Electron runtime; `node scripts/package-windows.cjs --quick` trades a larger portable installer for faster local packaging.

## Play and scoring

1. Choose an available country and an unlocked journey, or take the two-stop tutorial.
2. Type the next station name. Every correct character advances the train's target along the route. The train moves smoothly toward that position and briefly stops at every station, even if several names are typed quickly.
3. The timer starts on the first input, allowing time to open a phone keyboard. Mistakes stop movement, lower accuracy and reset the combo. Type the correct character without deleting.
4. Read ahead on the map: the full current destination and following station name appear before typing, including with the mobile keyboard open. Station hints advance with input even while the train catches up. Named landmark icons sit on the map; select one to read its short description there. The map follows the train continuously without a zoom reset at station boundaries. Use Overview for the whole route, or expand the stop list below the typing card.
5. Reach the last station before the deadline and achieve at least one star to pass. One star unlocks the next chapter of the same line. Every line's first chapter is open independently; the original six introductory journeys retain their original sequence. Custom scores do not unlock campaign chapters. Timeout or a score below the first threshold means failure.
6. Pause using the button or Escape. Backgrounding the app or switching browser tabs also pauses the journey.

The tutorial uses verified Berlin locations and separate practice state. It does not write scored records or unlock city stages. It can be replayed from the help/settings panel.

### Automatic original-spelling rewards

There is no spelling switch and no separate character-button row. Use the device's keyboard. Simplified and original spelling can be mixed within a journey:

- `München` and `munchen` are both accepted, ignoring capitalization.
- `Straße` and `strasse` are both accepted. `ß` occupies the same two canonical units as `ss`.
- Typing an original accented letter or ligature at its matching position earns **20 additional raw points**. For example, the `ü` in `München` earns the reward; replacing a plain `u` with `ü` does not.
- The reward is automatic for supported Latin characters in any country pack. It is scaled by accuracy and speed alongside the base score. Unrelated accents cannot earn bonus points.

Let `C` be correctly typed canonical character units, `O` correctly typed original special characters, `A` accuracy, and `V = min(1, actual CPS / target CPS)`:

```text
quality = A² × (0.6 + 0.4 × V)
base score = round(C × 100 × quality)
original bonus = round(O × 20 × quality)
total score = base score + original bonus
```

The three star thresholds are 55%, 75% and 90% of the full route's canonical character count × 100, each rounded up to ten points. Arrival is required even if the displayed score is high. Time and score freeze on the final correct input; the result appears after the train's final arrival animation, so animation time never affects the score. Pauses do not count toward elapsed time. A failed or lower-scoring replay never replaces a best score.

## Platform fairness and settings

The app target chooses the input profile automatically; there is no player-facing PC/touch selector. Native Android/iOS uses touch rules, Electron uses keyboard rules, and a browser with a coarse pointer and touch capability uses touch rules. Detection is stable for the session, so resizing the window cannot change scoring mid-journey.

| Rule                | Desktop keyboard                           | Mobile touch                               |
| ------------------- | ------------------------------------------ | ------------------------------------------ |
| Target speed        | 2.4–3.5 characters/second by route         | Half the corresponding desktop target      |
| Time limit          | `ceil(characters / target CPS × 2.2 + 12)` | `ceil(characters / target CPS × 2.2 + 18)` |
| Records and unlocks | Keyboard records                           | Separate touch records                     |

These are initial balancing values. Native touch apps currently retain touch rules even if an external keyboard is attached. PVP and server-side anti-cheat are outside the MVP.

Settings contains English/German language selection, the detected app profile, an explanation of original-spelling rewards and access to the tutorial. Proper station names remain in their local language when the UI language changes.

## Architecture

| Location                                      | Responsibility                                                             |
| --------------------------------------------- | -------------------------------------------------------------------------- |
| `App.tsx`                                     | Font loading and app providers                                             |
| `src/AppShell.tsx`                            | Screen navigation and feature composition                                  |
| `src/components/ExplorerScreen.tsx`           | Country and journey selection                                              |
| `src/components/GameScreen.tsx`               | Active-journey composition and pause UI                                    |
| `src/features/typing/`                        | Text-input handling and the typing card                                    |
| `src/features/journey/`                       | Result receipt                                                            |
| `src/features/tutorial/`                      | Isolated two-stop practice flow                                            |
| `src/features/settings/`                      | Settings, help and journey journal                                         |
| `src/features/map/`                           | Vector tiles, train/camera motion, read-ahead station labels and landmark information |
| `src/features/explorer/`                      | Germany region map, bilingual stage search and paginated difficulty sorting |
| `src/features/custom/`                        | Station selection, sourced route preview and saved personal endpoint pairs |
| `src/game/railRouting.ts`                      | Directed stop graph and transfer-first journey search, without timetable assumptions |
| `src/data/rail/`                              | Licensed service snapshot, importer, source-member provenance and validation |
| `src/data/railStages.ts`                       | Source route to campaign chapters and custom playable stage conversion |
| `src/data/germanCampaignStages.ts`            | Metropolitan, in-state corridor and long-distance campaign composition |
| `src/data/germany-campaigns.ts`, `src/data/state-corridors.ts` | Editable city-network selection and reviewed state corridor endpoints |
| `src/data/germany-regions.ts`                  | Natural Earth state shapes and projection for geographic discovery |
| `src/game/input.ts`                           | Unicode normalization, canonical alignment and original-character matching |
| `src/game/engine.ts`                          | Pure movement, timer, scoring, stars and failure rules                     |
| `src/game/progress.ts`                        | Best scores, route signatures, unlocks and save migrations                 |
| `src/hooks/useGame.ts`                        | Active clock and app lifecycle integration                                 |
| `src/hooks/useProgress.ts`                    | Local persistence and progress updates                                     |
| `src/platform/inputProfile.ts`                | Automatic input-profile detection                                          |
| `src/data/geography.ts`                       | Country-independent location and landmark types                            |
| `src/data/packs/`                             | Sourced station routes and landmark content                                |
| `src/data/stages.ts`, `src/data/countries.ts` | Playable catalog and country registry                                      |
| `src/i18n/`                                   | Typed English/German dictionaries and locale persistence                   |
| `src/theme.ts`, `src/components/ui.tsx`       | Shared visual tokens and controls                                          |
| `desktop/`, `scripts/`                        | Desktop runtime, local serving and packaging                               |
| `tests/`                                      | Rules, catalog integrity, geometry and browser flows                       |
| `artifacts/`                                  | Generated screenshots, QR and verification notes; gitignored               |

Keep country-specific facts in content packs, input semantics in the pure game modules, and provider/network concerns in the map feature. The `src/components/RouteMap.tsx` export preserves existing imports while the implementation lives in the map feature.

### Add another city or country

1. Add a country registry entry with an ISO-style ID and English/German names if needed.
2. Author an ordered `RouteStop[]` with the origin first, actual WGS84 coordinates, source links and nearby landmark references. Add localized landmark names/descriptions and an optional `LandmarkKind` for its reusable map icon.
3. Register a unique stage ID such as `FR.paris`, its `countryId`, title, difficulty and target speed. Derive `origin` and `stations` with `routeNames(route)` so the typing and map data share one source.
4. Mark a country `available` only when it has playable stages. A country's first route is independently unlocked.
5. Run `npm test` and validate that the new names can be typed in original and simplified form. Add language-specific input support centrally if needed.

See [map-sources.md](docs/map-sources.md) for the geographic data contract, operator sources, tourism sources and licence details.

### Save compatibility

Schema v3 uses record keys `${inputProfile}:${stageId}`. Original and simplified input contribute to the same score table for that app profile. A signature derived from a stage's route and scoring parameters keeps scores fair when content changes. National chapters additionally carry a campaign ID and sequence number. Custom records use stable endpoint-pair IDs, are isolated from campaign unlocks and retain at most 100 recent records; saved pairs are stored separately and replanned against the current snapshot.

Earlier v1/v2 records and records for changed routes are preserved in `archivedRecords`. Previously earned unlocks are retained for the corresponding profile, while changed journeys begin with a fresh current score table. Saved profile values never override the detected app target. Tutorial completion and country selection are persisted locally.

## Map, design and scope

The map uses real [OpenStreetMap](https://www.openstreetmap.org/copyright) geography delivered by [OpenFreeMap](https://openfreemap.org/) in the [OpenMapTiles](https://openmaptiles.org/) vector schema. A small shared SVG renderer draws water, parks, major roads and rail geometry in muted colours, omitting buildings, business labels and address clutter. The prominent game route and original two-car train sit above this background. The game map is larger than the typing card on desktop and mobile; when the phone keyboard opens, both are condensed to keep the train and input visible.

Provider configuration, vector decoding, styling and attribution are separate modules. Only visible tiles are requested. Overzoomed views share the correct parent tile, concurrent requests are deduplicated, and an in-memory cache retains at most 48 parsed tiles. HTTP caching is left to the platform. There is no offline tile prefetch. OpenFreeMap permits commercial use without an API key; its public service has no availability guarantee. Retain the visible OpenFreeMap, OpenMapTiles and OpenStreetMap credits and review its [terms](https://openfreemap.org/tos/) before release.

Journey lines join real station positions schematically. They do not trace exact railway tracks or represent live timetables. Landmark cards show places near a stop; they do not imply that a sight is visible from inside a train. National routes attach the existing named landmarks only near their actual coordinates; the 25-landmark collection does not yet cover every new city. Current closures and transfers are documented as itinerary limitations in the source notes.

Germany's selection map uses public-domain Natural Earth state boundaries. Rail station identities and directed service stop lists come from OSM under ODbL 1.0. Each web/all export includes a reusable `dist/data/germany-rail.json` snapshot, attribution and source notes. On the local web server it is available at `/data/germany-rail.json`; the Windows folder app includes the same files under `resources/web/data`. Keep these data files and licence notes with distributed builds. `scripts/import-german-regions.cjs` regenerates the map; see the catalog document for the separate rail importer and quality checks.

The supplied design reference remains the basis of the interface: warm `#F6F5F4`, white cards, fine borders, Inter, blue `#0075DE` actions and an indigo `#213183` hero. Decorative stickers, app icons and the unbranded train are SVG created for this project. No DB logo, official train photograph or licensed DB vehicle replica is bundled. Inter uses the SIL Open Font License bundled with the font package.

Current scope is solo railway typing. Street territory mode, PVP, cloud accounts and cross-device sync are not implemented. The app is not affiliated with Deutsche Bahn, OpenStreetMap Foundation or Notion.

See [rail-services-and-rights.ko.md](docs/rail-services-and-rights.ko.md) for the earlier RE/ICE/EC design and rights review, including proposed speed and ghost-race rules. Version 0.4 implements sourced solo service campaigns and custom journeys. Online races remain proposals, and the review does not grant permission to reproduce a particular DB train.
