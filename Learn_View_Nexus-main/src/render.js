import { refreshIcons } from "./utils.js";
import { isAuthenticated, state, ui } from "./state.js";
import { analytics } from "./components/analytics.js";
import { ai } from "./components/ai.js";
import { assessments } from "./components/assessments.js";
import { attendance } from "./components/attendance.js";
import { bookings } from "./components/bookings.js";
import { communications } from "./components/communications.js";
import { dashboard } from "./components/dashboard.js";
import { invoices } from "./components/invoices.js";
import { sidebar, topbar } from "./components/navigation.js";
import { reports } from "./components/reports.js";
import { schedule } from "./components/schedule.js";
import { settings, setup } from "./components/settings.js";
import { students } from "./components/students.js";
import { subjects } from "./components/subjects.js";
import { icon, logo } from "./utils.js";
import { printPreview } from "./components/printPreview.js";

const routes = { dashboard, students, schedule, invoices, more, ai, bookings, attendance, assessments, reports, analytics, communications, subjects, settings, setup };

export function renderApp() {
  const app = document.getElementById("app");
  app.innerHTML = isAuthenticated() ? (ui.printPreview ? printPreview() : shell()) : loginScreen();
  refreshIcons();
}

function loginScreen() {
  return `<section class="login"><form class="login-card" onsubmit="loginSubmit(event)">${logo()}<p class="eyebrow">Learn Smarter.</p><h2>Welcome back</h2><label class="field"><span>Admin password</span><input id="password" type="password" required autocomplete="current-password"></label><button class="btn primary" type="submit">${icon("log-in")} Sign in</button></form></section>`;
}

function shell() {
  const route = routes[ui.view] || routes.dashboard;
  return `<section class="shell">${sidebar()}<section class="content">${topbar()}<div class="page">${route()}</div><button class="btn primary fab" onclick="quickAdd()" title="Quick add">${icon("plus")}</button></section><div class="modal" id="modal"></div><div class="toast"></div></section>`;
}

function more() {
  const items = [
    ["ai", "LearnView AI", "sparkles"],
    ["bookings", "Bookings", "calendar-check"],
    ["attendance", "Attendance", "user-check"],
    ["assessments", "Assessments", "clipboard-check"],
    ["reports", "Report Cards", "file-text"],
    ["analytics", "Analytics", "chart-column"],
    ["communications", "Messages", "message-circle"],
    ["subjects", "Subjects", "book-open"],
    ["settings", "Settings", "settings"],
    ["setup", "Setup", "database"]
  ];
  return `<section class="card"><div class="section-title"><h3>More</h3></div><div class="category-grid">${items.map(([view, title, ic]) => `<button class="category-card" onclick="go('${view}')">${icon(ic)}<span>${title}</span></button>`).join("")}</div></section>`;
}
