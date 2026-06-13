# LearnView Nexus

Premium tutor management web app for LearnView.

Tagline: **Learn Smarter. Manage Smarter.**

## What is included

- SaaS-style dashboard with login, KPIs, quick actions and empty-state onboarding.
- Official LearnView logo asset in `assets/learnview-logo.jpeg`, used across app and print documents.
- Modular frontend under `src/` with separated state, API, rendering, components and print templates.
- Configurable data connection URL from the Setup screen, with connection test, load and sync controls.
- Sync status indicators for connected, syncing, unavailable and failed states.
- ID-based relationships for students, subjects, schedules, attendance, assessments, invoices, invoice items, payments, reports and messages.
- Website booking requests from the public LearnView site, with approve/reject and conversion into student or schedule records.
- Dedicated student profile workflow with parent details, subjects, attendance, assessments, invoices, payments, trends, notes and report history.
- Advanced schedule views for weekly calendar, monthly calendar and daily agenda, with conflict warnings and drag/drop lesson movement.
- Attendance tracking for Present, Absent, Late and Excused statuses.
- Parent communication tools for WhatsApp-ready invoice, attendance and performance messages.
- BI dashboard for revenue, growth, attendance, subject, student and assessment analytics.
- Premium printable invoice, report card and weekly schedule layouts with 6% logo watermark and QR-style verification block.
- PWA manifest and service worker for installation and basic caching.
- Central data API hook in `src/api.js`.
- Google Apps Script backend in `apps-script/Code.gs`.
- GitHub Pages-ready static files.
- Capacitor preparation notes in `CAPACITOR.md`.

## Local use

Open `index.html` in a browser. The initial admin password is:

```text
learnview-admin
```

Change the password in **Settings > Password and Security** before production use. The app works offline with local records until a data connection URL is saved in **Setup > Connection URL**.

## Google Sheets setup

1. Create a Google Sheet.
2. Open **Extensions > Apps Script**.
3. Paste the contents of `apps-script/Code.gs`.
4. Save and run `setupSheets` once, or use the connection test after deployment. The script creates and repairs these sheets:
   `Settings`, `Subjects`, `Students`, `Schedule`, `Attendance`, `Assessments`, `Invoices`, `InvoiceItems`, `Payments`, `ReportCards`, `BookingRequests`, `Messages`.
5. Deploy as a web app with access set to the tutor account or anyone with the link, depending on your deployment needs.
6. Open LearnView Nexus, go to **Connection Setup**, paste the deployment URL, and click **Test connection**.
7. Use **Sync now** to push current data or **Load from Sheets** to pull existing data.

## GitHub Pages deployment

1. Push this repository to GitHub.
2. In GitHub, open **Settings > Pages**.
3. Select the `main` branch and root folder.
4. Save. GitHub Pages will serve the static web app.

## Repository migration

Use `MIGRATION_CHECKLIST.md` before transferring the project to a client-owned repository. It lists repository cleanup checks, account-dependent services, Google Apps Script ownership steps, AI Worker handover notes and APK validation steps.

## Notes

The app is static and GitHub Pages-ready, with Capacitor Android support included for APK builds.
