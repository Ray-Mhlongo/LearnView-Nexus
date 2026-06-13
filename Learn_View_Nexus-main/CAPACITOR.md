# Capacitor Preparation

Build and approve the web app first. After the LearnView Nexus web version is stable on GitHub Pages and connected to Google Sheets, wrap it with Capacitor.

## Suggested steps

```bash
npm init -y
npm install @capacitor/core @capacitor/cli @capacitor/android
npx cap init "LearnView Nexus" "za.co.learnview.nexus" --web-dir .
npx cap add android
npx cap sync android
```

## Branding assets

The project already includes LearnView-branded PWA and Android resources:

- `assets/icons/learnview-icon-48.png`
- `assets/icons/learnview-icon-72.png`
- `assets/icons/learnview-icon-96.png`
- `assets/icons/learnview-icon-144.png`
- `assets/icons/learnview-icon-192.png`
- `assets/icons/learnview-icon-512.png`
- `assets/icons/learnview-icon-maskable-512.png`
- `assets/icons/learnview-splash.png`
- `android/app/src/main/res/mipmap-*`
- `android/app/src/main/res/mipmap-anydpi-v26`
- `android/app/src/main/res/drawable/splash.png`

The launcher icon uses the LV mark from the official LearnView logo so it stays legible in Android app drawers, recent apps, and PWA home-screen installs. The splash asset uses the full LearnView logo on a white background.

## Web-first rules

- Keep `index.html`, `styles.css` and the modular files under `src/` working directly in the browser.
- Do not add Android-only paths that break GitHub Pages.
- Keep Google Apps Script as the backend API.
- Test printing from the browser before APK conversion.
