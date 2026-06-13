# LearnView Nexus Migration Checklist

Use this checklist when moving LearnView Nexus from the current developer-owned repository to a client-owned GitHub repository. The project is prepared to run from any repository because app assets, PWA paths, service-worker assets, and Capacitor web assets use relative paths.

## Pre-Migration Status

- Current local Git remote: `https://github.com/RayMhlongo/Learn_View_Nexus.git`
- Current web app type: static GitHub Pages-ready app
- Current Android wrapper: Capacitor, app ID `za.co.learnview.nexus`
- Current PWA start URL: `./`
- Current service-worker cache: `learnview-nexus-v7`
- Current Google integration mode: runtime-configured Apps Script web app URL saved in browser storage
- Current AI integration mode: fixed Cloudflare Worker URL in `src/ai/service.js`

## Repository Cleanup Completed

- Removed old repository metadata from `package.json`.
- Renamed npm package metadata to `learnview-nexus`.
- Cleared invented starter students, attendance, assessments, invoices, payments, and report cards from the default seed state.
- Removed developer/default Android example test classes.
- Updated README copy from starter records to empty-state onboarding.
- Updated stale Capacitor notes to reference the current modular `src/` app.
- Bumped the service-worker cache version so deployed clients pick up changed source files.

## Account-Dependent Items To Review After Transfer

| Area | Current value or behavior | File | Migration action |
| --- | --- | --- | --- |
| Git remote | `https://github.com/RayMhlongo/Learn_View_Nexus.git` | Git config only | Set the client repo as `origin` after transfer. |
| AI Worker | `https://learnview.rodgersmhlongo.workers.dev` | `src/ai/service.js` | Keep during handover if still active. Replace when the client owns a Cloudflare Worker. |
| Google Apps Script URL | Saved by the tutor in the app setup screen, not hardcoded | Browser storage via `src/state.js` and `src/api.js` | Client must paste their deployed Apps Script `/exec` URL in Setup. |
| Google Sheet ID | None hardcoded | `apps-script/Code.gs` | Apps Script uses the active spreadsheet. Client must deploy from the spreadsheet they own. |
| OpenRouter key | Not stored in this repo | Cloudflare Worker side | Move/configure the key only in the client's Cloudflare Worker secrets. |
| PWA manifest path | Relative `./` | `manifest.webmanifest` | No repo-specific change required. |
| Service worker assets | Relative paths | `sw.js` | No repo-specific change required. Bump cache name when changing cached files. |
| Capacitor app ID | `za.co.learnview.nexus` | `capacitor.config.json`, Android resources | Keep unless client requests a different Android package ID before Play Store submission. |
| App icons and splash | LearnView branded local assets | `assets/icons`, `android/app/src/main/res` | No repo-specific change required. |
| External font CDN | Google Fonts Urbanist | `index.html` | No account dependency. |
| External icon CDN | Lucide UMD | `index.html` | No account dependency. |
| PDF library | Local vendor bundle copied from npm package | `assets/vendor/html2pdf.bundle.min.js`, `scripts/build-www.js` | No account dependency. |

## Client Repository Setup Guide

1. Create the client-owned GitHub repository.
2. Add the client as owner/admin before publishing production links.
3. Push the full project to the client repository.
4. Confirm `origin` points to the client repository.
5. Run `npm install` if dependencies are not already installed.
6. Run `npm test`.
7. Run `npm run build`.
8. Enable GitHub Pages from the repository root or from the selected branch.
9. Open the GitHub Pages URL and verify `index.html`, `styles.css`, `sw.js`, `manifest.webmanifest`, logo, icons, and `src/` modules load.
10. If using a custom domain, add the domain in GitHub Pages settings and update DNS.
11. Confirm the PWA install prompt/icon uses LearnView branding.
12. Sign in with the initial password and change it in Settings.
13. Enter client business details, banking details, contact details, and tutor availability.

## AI Migration Readiness

Current frontend AI dependency:

- `src/ai/service.js` sends LearnView AI requests to `https://learnview.rodgersmhlongo.workers.dev`.
- `src/ai/context.js` builds structured, relevant JSON context from the current LearnView Nexus data.
- The frontend does not hardcode an OpenRouter API key.
- The frontend does not expose an API key in the interface.
- AI chat state is UI state only and normal LearnView data remains in the app state.

When moving AI to a client Cloudflare account:

1. Create a client-owned Cloudflare Worker.
2. Add the OpenRouter API key as a Worker secret, not in source code.
3. Mirror the current Worker response shape: `{ choices: [{ message: { content } }] }`.
4. Configure CORS to allow the client's GitHub Pages/custom domain and Android WebView.
5. Update only `AI_SERVICE_URL` in `src/ai/service.js`.
6. Test LearnView AI with questions about invoices, students, attendance, schedules, and business overview.
7. Confirm the assistant still refuses to invent missing records.

## Google Integration Readiness

Current Google dependency behavior:

- `src/api.js` reads and writes through `state.settings.apiUrl`.
- `state.settings.apiUrl` defaults to an empty string.
- The tutor enters the Apps Script deployment URL in the app Setup screen.
- `apps-script/Code.gs` uses `SpreadsheetApp.getActiveSpreadsheet()`, so no spreadsheet ID is hardcoded.

Client Google setup:

1. Client creates or owns the Google Sheet.
2. Client opens Extensions > Apps Script.
3. Paste `apps-script/Code.gs`.
4. Run `setupSheets`.
5. Deploy as a web app.
6. Copy the `/exec` URL.
7. Paste it into LearnView Nexus > Setup > Connection URL.
8. Run Test connection.
9. Run Sync now or Load from Sheets.

## APK Readiness Checklist

- `capacitor.config.json` uses `webDir: "www"`.
- `npm run build` prepares `www/`.
- `npm run sync:android` syncs static assets into Android.
- Android launcher icons are LearnView branded.
- Android splash resources are LearnView branded.
- Android status and navigation bars are configured not to overlay app content.
- App name is `LearnView Nexus`.
- App ID is `za.co.learnview.nexus`.

Before producing a client APK:

1. Confirm the client wants to keep `za.co.learnview.nexus`.
2. Run `npm run sync:android`.
3. Run `cd android && gradlew.bat assembleDebug`.
4. Install the generated APK.
5. Confirm app drawer icon, home screen icon, recent apps icon, splash screen, status bar, and navigation bar.
6. Test login, navigation, print preview, PDF download/share, Google sync, and LearnView AI.

## Final Validation Checklist

- Website/static app loads from the new repository URL.
- Logo and icons load.
- Manifest loads.
- Service worker installs without stale files.
- Login persists locally.
- Navigation and browser/mobile back behavior work.
- Student, subject, schedule, attendance, assessment, invoice, payment, report card, message, and settings workflows work.
- Print previews open only the selected document.
- PDF download works for invoices, report cards, and schedules.
- Google Sheets connection test works with the client Apps Script URL.
- LearnView AI answers only from available LearnView data.
- Empty client data shows empty states, not fake records.
- APK builds after `npm run sync:android`.

## Values To Replace Only After Transfer

- Git remote: replace developer repo with the client GitHub repo.
- AI Worker URL: replace only when a client-owned Cloudflare Worker is ready.
- Apps Script deployment URL: enter in the app UI after the client deploys Apps Script.
- Business settings: enter client-owned phone, email, address, banking, tutor name, rate, terms, and availability.
- Admin password: change from the initial password before production use.
