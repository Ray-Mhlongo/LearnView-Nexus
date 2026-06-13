const CACHE_NAME = "learnview-nexus-v8";
const ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./manifest.webmanifest",
  "./assets/learnview-logo.jpeg",
  "./assets/icons/learnview-icon-48.png",
  "./assets/icons/learnview-icon-72.png",
  "./assets/icons/learnview-icon-96.png",
  "./assets/icons/learnview-icon-144.png",
  "./assets/icons/learnview-icon-192.png",
  "./assets/icons/learnview-icon-512.png",
  "./assets/icons/learnview-icon-maskable-512.png",
  "./assets/icons/learnview-splash.png",
  "./assets/vendor/html2pdf.bundle.min.js",
  "./src/main.js",
  "./src/state.js",
  "./src/api.js",
  "./src/render.js",
  "./src/utils.js",
  "./src/data/southAfricaLocations.js",
  "./src/components/navigation.js",
  "./src/components/printPreview.js",
  "./src/components/ai.js",
  "./src/components/dashboard.js",
  "./src/components/students.js",
  "./src/components/schedule.js",
  "./src/components/attendance.js",
  "./src/components/assessments.js",
  "./src/components/invoices.js",
  "./src/components/reports.js",
  "./src/components/bookings.js",
  "./src/components/analytics.js",
  "./src/components/settings.js",
  "./src/components/communications.js",
  "./src/components/subjects.js",
  "./src/print/invoice.js",
  "./src/print/reportCard.js",
  "./src/print/schedule.js",
  "./src/ai/context.js",
  "./src/ai/service.js"
];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)));
});

self.addEventListener("activate", event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))));
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  event.respondWith(fetch(event.request).catch(() => caches.match(event.request)));
});
