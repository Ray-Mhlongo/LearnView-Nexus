import { icon, logo } from "../utils.js";
import { state, ui } from "../state.js";

export const views = {
  dashboard: { title: "Home", icon: "home" },
  students: { title: "Student Profiles", icon: "users" },
  schedule: { title: "Scheduling", icon: "calendar-days" },
  invoices: { title: "Invoices", icon: "receipt" },
  more: { title: "More", icon: "grid-3x3" },
  ai: { title: "LearnView AI", icon: "sparkles" },
  bookings: { title: "Bookings", icon: "calendar-check" },
  attendance: { title: "Attendance", icon: "user-check" },
  assessments: { title: "Assessments", icon: "clipboard-check" },
  reports: { title: "Report Cards", icon: "file-text" },
  analytics: { title: "Business Intelligence", icon: "chart-column" },
  communications: { title: "Parent Communication", icon: "message-circle" },
  subjects: { title: "Subjects", icon: "book-open" },
  settings: { title: "Settings", icon: "settings" },
  setup: { title: "Connection Setup", icon: "database" }
};

export function sidebar() {
  return `<aside class="sidebar"><div class="brand">${logo("logo-main")}</div><nav class="nav">${Object.entries(views).map(([key, meta]) => `<button class="${ui.view === key ? "active" : ""}" onclick="go('${key}')">${icon(meta.icon)}<span>${meta.title}</span></button>`).join("")}</nav><div class="sidebar-card"><strong>${state.settings.apiUrl ? "Connected" : "Not connected"}</strong><p>${state.settings.apiUrl ? "Your data connection is ready." : "Connect your data source in Setup."}</p></div></aside>`;
}

export function topbar() {
  const view = views[ui.view];
  return `<header class="topbar"><div><div class="mobile-brand">${logo("logo-mini")}<strong>LearnView</strong></div><h2>${view.title}</h2><p>${state.settings.businessName} - ${state.settings.tagline}</p></div><div class="actions"><button class="btn ghost back-btn" onclick="navigateBack()">${icon("arrow-left")} Back</button><button class="btn" onclick="confirmLogout()">${icon("log-out")} Exit</button></div></header>`;
}
