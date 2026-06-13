import { replaceAll, saveState, state } from "./state.js";

const sheetMap = {
  settings: "Settings",
  subjects: "Subjects",
  students: "Students",
  schedule: "Schedule",
  attendance: "Attendance",
  assessments: "Assessments",
  invoices: "Invoices",
  invoiceItems: "InvoiceItems",
  payments: "Payments",
  reportCards: "ReportCards",
  bookingRequests: "BookingRequests",
  messages: "Messages"
};

export function isConnected() {
  return Boolean(state.settings.apiUrl);
}

export async function request(action, sheet, payload = {}) {
  if (!state.settings.apiUrl) {
    state.meta.syncStatus = "Not connected";
    saveState();
    return { ok: true, offline: true };
  }
  state.meta.syncStatus = "Syncing";
  saveState();
  try {
    const response = await fetch(state.settings.apiUrl, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action, sheet, payload })
    });
    const data = await response.json();
    if (!data.ok) throw new Error(data.error || "Google Sheets request failed");
    state.meta.syncStatus = "Connected";
    state.meta.lastSync = new Date().toISOString();
    saveState();
    return data;
  } catch (error) {
    state.meta.syncStatus = "Sync failed";
    state.meta.lastError = error.message;
    saveState();
    return { ok: false, error: error.message };
  }
}

export async function testConnection(url = state.settings.apiUrl) {
  if (!url) return { ok: false, error: "Enter an Apps Script web app URL first." };
  const previous = state.settings.apiUrl;
  state.settings.apiUrl = url;
  const result = await request("TEST", "Settings", {});
  if (!result.ok) state.settings.apiUrl = previous;
  saveState();
  return result;
}

export async function syncCollection(collection, action, record) {
  return request(action, sheetMap[collection], record);
}

export async function loadFromSheets() {
  if (!isConnected()) return { ok: true, offline: true };
  const result = await request("BULK_READ", "All", {});
  if (result.ok && result.data) replaceAll(fromSheets(result.data));
  return result;
}

export async function bulkSync() {
  if (!isConnected()) return { ok: true, offline: true };
  return request("BULK_SYNC", "All", toSheets(state));
}

function toSheets(appState) {
  return Object.fromEntries(Object.entries(sheetMap).map(([key, sheet]) => [sheet, key === "settings" ? [{ ID: "settings", ...appState.settings }] : appState[key] || []]));
}

function fromSheets(data) {
  const out = {};
  Object.entries(sheetMap).forEach(([key, sheet]) => {
    if (data[sheet]) out[key] = data[sheet];
  });
  if (Array.isArray(out.settings)) out.settings = out.settings[0] || state.settings;
  return { ...state, ...out };
}
