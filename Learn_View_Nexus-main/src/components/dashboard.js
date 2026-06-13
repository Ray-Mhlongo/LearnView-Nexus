import { icon, money } from "../utils.js";
import { attendancePercent, invoiceBalance, invoiceStatus, performanceAverage, state, studentName, subjectName, ui } from "../state.js";

export function kpi(label, value, ic) {
  return `<section class="card kpi"><div class="icon-pill">${icon(ic)}</div><div><div class="value">${value}</div><div class="label">${label}</div></div></section>`;
}

export function dashboard() {
  const active = state.students.filter(student => student.status === "Active").length;
  const outstanding = state.invoices.reduce((sum, invoice) => sum + invoiceBalance(invoice), 0);
  const today = new Date().toLocaleDateString("en-US", { weekday: "long" });
  const lessonsToday = state.schedule.filter(row => row.day === today);
  return `<section class="panel home-welcome"><div><p class="eyebrow">Welcome back</p><h1>LearnView</h1><p class="muted">${new Date().toLocaleDateString("en-ZA", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</p></div></section>
  <div class="summary-strip">${miniKpi("Students", state.students.length)}${miniKpi("Today", lessonsToday.length)}${miniKpi("Outstanding", money(outstanding))}${miniKpi("Average", `${Math.round(state.students.reduce((s, x) => s + performanceAverage(x.id), 0) / state.students.length)}%`)}</div>
  <section class="card"><div class="section-title"><h3>Main categories</h3></div><div class="category-grid">${[
    ["students", "Students", "users"], ["schedule", "Schedule", "calendar-days"], ["invoices", "Invoices", "receipt"], ["reports", "Report Cards", "file-text"], ["assessments", "Assessments", "clipboard-check"], ["more", "More", "grid-3x3"]
  ].map(([view, title, ic]) => `<button class="category-card" onclick="go('${view}')">${icon(ic)}<span>${title}</span></button>`).join("")}</div></section>
  <div class="grid cols-2"><section class="card home-next"><div class="section-title"><h3>Next lesson</h3><span class="badge">${today}</span></div>${agendaRows(lessonsToday.slice(0, 2))}</section><section class="card"><div class="section-title"><h3>Recent activity</h3></div><p class="muted">${state.assessments.at(-1)?.name || "No recent activity"} - ${state.messages.length} messages logged</p></section></div>`;
}

function miniKpi(label, value) {
  return `<div class="mini-kpi"><strong>${value}</strong><span>${label}</span></div>`;
}

function agendaRows(rows) {
  if (!rows.length) return "<p class='muted'>No lessons scheduled today.</p>";
  return rows.sort((a, b) => a.start.localeCompare(b.start)).map(row => `<div class="agenda-row"><strong>${row.start}</strong><div class="lesson"><strong>${studentName(row.studentId)}</strong><br>${subjectName(row.subjectId)} - ${row.status}<br><span class="muted">${row.location}</span></div></div>`).join("");
}
