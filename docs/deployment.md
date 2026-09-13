# Netlify deployment

Bahnreise uses Expo SDK 57 with `web.output: single`. It is a static browser app; it needs no Netlify Functions or server process. Netlify publishes only `artifacts/netlify-site`.

## Current production site

- Public URL: https://bahnreise.netlify.app/
- Project: `bahnreise`, team `poshygg` (Free plan confirmed during deployment).
- Site ID: `aa5ef5c4-2e4e-4bab-9cdb-e38c70473045`.
- Published deployment: `6aa5acabf0b74e083e8b7611` (2026-09-13 KST).
- Local `.netlify/state.json` links future deploys to this project and is git-ignored.

Production visibility was explicitly changed to Public in the dashboard. New Netlify projects can start private even after `--prod`; verify unauthenticated HTTP access before sharing the URL. Preview deployments retain their default private visibility. Free projects show Netlify's platform badge.

Current verification: TypeScript and the web build pass. The production homepage and `/play` return HTTP 200 and contain the exact supplied AdSense snippet once inside `<head>`. The deployed JavaScript and ODbL files match the prepared files byte-for-byte. Repeating preparation produces identical HTML without modifying `dist`.

Earlier gameplay verification on deployment `6aa5aa8b8d14e23cf583c61c`: in the live browser, the passport showed 17 achievements, typing started at Charlottenburg and advanced to Savignyplatz, and the actual street map loaded. Desktop and mobile layout smoke checks passed locally before that upload.

## Deploy the existing verified export

From the repository root, prepare a separate upload folder:

```sh
node scripts/prepare-netlify.cjs
```

This copies the existing `dist` without rebuilding or modifying it. The script verifies the HTML's web bundle and required railway database/license files, then replaces only `artifacts/netlify-site`. Android/iOS Hermes bundles (`.hbc`) and Expo export `metadata.json` are excluded. Web JavaScript, fonts, favicon, and `data` remain intact.

The preparer inserts `scripts/adsense-head.html` into every hosted HTML page's `<head>`. It contains the user-provided AdSense publisher code (`ca-pub-4104829979924193`). The SPA fallback serves the same head on every in-app URL. A repeated preparation starts from `dist` and cannot accumulate duplicate tags. Local previews and Windows/mobile packages are not modified by this hosting step.

After the Netlify CLI has been installed and the intended site linked by the deployment operator:

```sh
netlify deploy --no-build --dir=artifacts/netlify-site
netlify deploy --no-build --prod --dir=artifacts/netlify-site
```

The first command creates a draft URL; the second updates the linked production site. Run only the desired deployment command. `--no-build` explicitly preserves the verified export; see the [Netlify deploy command](https://cli.netlify.com/commands/deploy/). The folder can also be uploaded through Netlify's manual deployment interface. Do not upload the repository root or the all-platform `dist` directory.

## Rebuild for a later release

Use Node.js 22.13 or newer, then:

```sh
npm ci
npm run build:web
node scripts/prepare-netlify.cjs
```

Run the relevant validation before deploying the prepared folder. Git-connected Netlify builds use the command and publish directory in `netlify.toml`; the build command also exports the reusable railway database through the existing `build:web` script.

## Routing, maps, and ads

The non-forced `/* → /index.html` HTTP 200 rewrite supports direct SPA URLs. Existing asset and data files take precedence, so JavaScript, fonts, and JSON retain their real responses. The preparer includes the same `_redirects` rule for manual folder deployments. See [Netlify SPA rewrites and file shadowing](https://docs.netlify.com/manage/routing/redirects/rewrites-proxies/) and [file-based configuration](https://docs.netlify.com/build/configure-builds/file-based-configuration/).

The browser requests map metadata and vector tiles directly from `https://tiles.openfreemap.org/`; no proxy or API key is required by this implementation. Keep the visible map credits and the downloadable `data/germany-rail.json`, `data/germany-rail-sources.md`, and `data/README.txt` together to preserve the ODbL database attribution/provenance.

Netlify builds default to `EXPO_PUBLIC_ADS_MODE=preview` for the game's separate sponsor cards. The hosted HTML additionally loads the user-requested Google AdSense Auto ads script. Its presence does not mean the site is approved or that Google is serving ads. Auto ads, placements and consent messages are managed in AdSense; the in-game sponsor-card toggle does not control Auto ads. The dedicated manual ad-unit adapter still requires its own unit IDs and consent flow. Never put private credentials into `EXPO_PUBLIC_*` values.

After deployment, confirm the home page and a direct SPA URL load, the referenced `/_expo/static/js/web/` JavaScript and font URLs return their real files, the ODbL downloads work, and live map tiles load. Progress and achievements remain in each browser's local storage and do not transfer automatically to a different site origin.
