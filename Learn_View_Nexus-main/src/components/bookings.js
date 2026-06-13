import { badge, emptyState, esc, icon } from "../utils.js";
import { state } from "../state.js";
import { kpi } from "./dashboard.js";

export function bookings() {
  const rows = bookingRows();
  const pending = rows.filter(row => row.status === "Pending");
  const approved = rows.filter(row => row.status === "Approved");
  const rejected = rows.filter(row => row.status === "Rejected");

  return `<section class="panel bookings-hero"><div class="profile-hero"><div><p class="eyebrow">Website bookings</p><h2 style="margin:0">Review parent booking requests from the LearnView website.</h2><p class="muted">Refresh data after a parent submits the public form, then approve, reject or convert the request into student and schedule records.</p></div><div class="actions"><button class="btn ghost" onclick="loadSheets()">${icon("refresh-cw")} Refresh data</button></div></div></section>
  <div class="grid cols-3">${kpi("Pending Bookings", pending.length, "clock")}${kpi("Approved Bookings", approved.length, "check-circle")}${kpi("Rejected Bookings", rejected.length, "x-circle")}</div>
  <div class="booking-board">
    ${bookingSection("Pending Bookings", pending)}
    ${bookingSection("Approved Bookings", approved)}
    ${bookingSection("Rejected Bookings", rejected)}
  </div>`;
}

function bookingRows() {
  return (state.bookingRequests || [])
    .map(row => ({ ...row, status: normalizedStatus(row.status) }))
    .sort((a, b) => String(b.submittedAt || "").localeCompare(String(a.submittedAt || "")));
}

function normalizedStatus(value) {
  const status = String(value || "Pending").trim().toLowerCase();
  if (status === "approved") return "Approved";
  if (status === "rejected") return "Rejected";
  return "Pending";
}

function bookingSection(title, rows) {
  return `<section class="card booking-status-section"><div class="section-title"><h3>${title}</h3><span class="badge">${rows.length}</span></div><div class="booking-card-list">${rows.length ? rows.map(bookingCard).join("") : emptyState(`No ${title.toLowerCase()} yet.`)}</div></section>`;
}

function bookingCard(row) {
  const student = state.students.find(item => item.id === row.studentId);
  const schedule = state.schedule.find(item => item.id === row.scheduleId);

  return `<article class="booking-request-card">
    <div class="booking-card-head">
      <div>
        <h3>${esc(row.studentName || "Unnamed learner")}</h3>
        <p class="muted">${esc(row.parentEmail || "No parent email")}</p>
      </div>
      ${badge(row.status || "Pending")}
    </div>
    <div class="booking-detail-grid">
      ${detail("Subject", row.subject)}
      ${detail("Lesson type", row.lessonType)}
      ${detail("Attendance type", row.attendanceType)}
      ${detail("Preferred date", formatDate(row.preferredDate))}
      ${detail("Preferred time", row.preferredTime)}
      ${detail("Submitted", formatDateTime(row.submittedAt))}
    </div>
    <p class="booking-notes"><strong>Notes:</strong> ${esc(row.notes || "No notes provided.")}</p>
    <p class="muted">${student ? `Linked student: ${esc(student.name)}` : "No linked student yet."}${schedule ? ` - Schedule: ${esc(schedule.id)}` : ""}</p>
    <div class="booking-card-actions">
      <button class="btn ghost" onclick="updateBookingStatus('${row.id}','Approved')">Approve</button>
      <button class="btn danger" onclick="updateBookingStatus('${row.id}','Rejected')">Reject</button>
      <button class="btn ghost" onclick="convertBookingToStudent('${row.id}')">Convert to Student</button>
      <button class="btn primary" onclick="convertBookingToSchedule('${row.id}')">Convert to Schedule</button>
    </div>
  </article>`;
}

function detail(label, value) {
  return `<div><span>${label}</span><strong>${esc(value || "Not provided")}</strong></div>`;
}

function formatDate(value) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("en-ZA");
}

function formatDateTime(value) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString("en-ZA", { dateStyle: "medium", timeStyle: "short" });
}
