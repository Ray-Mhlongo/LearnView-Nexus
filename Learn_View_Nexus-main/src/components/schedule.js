import { actionMenu, badge, dayNames, emptyState } from "../utils.js";
import { hasScheduleConflict, state, studentName, subjectName, ui } from "../state.js";
import { schedulePrint } from "../print/schedule.js";

export function schedule() {
  const action = ui.sectionAction.schedule;
  if (!action) return actionMenu("Schedule", [
    { section: "schedule", action: "add", icon: "calendar-plus", title: "Add Lesson" },
    { section: "schedule", action: "week", icon: "calendar-days", title: "Weekly Schedule" },
    { section: "schedule", action: "day", icon: "list", title: "Daily Agenda" },
    { section: "schedule", action: "month", icon: "calendar", title: "Monthly Calendar" },
    { section: "schedule", action: "print", icon: "printer", title: "Print Schedule" }
  ]);
  if (action === "add") return `<section class="card"><div class="section-title"><h3>Add Lesson</h3><button class="btn ghost" onclick="navigateBack()">Back</button></div><button class="btn primary" onclick="openSchedule()">Open lesson form</button></section>`;
  const rows = filteredSchedule();
  return `<section class="card no-print"><div class="calendar-toolbar"><div class="tabs">${["week", "month", "day"].map(mode => `<button class="${ui.scheduleMode === mode ? "active" : ""}" onclick="setScheduleMode('${mode}')">${mode}</button>`).join("")}</div><div class="actions"><button class="btn ghost" onclick="navigateBack()">Back</button><button class="btn primary" onclick="openPrintPreview('schedule')">Print Preview</button></div></div></section>${scheduleFilters()}<section class="card no-print"><div class="section-title"><h3>Tutor availability</h3><span class="badge active">Conflict detection active</span></div><div class="availability">${state.settings.availability.split(",").map(item => `<div>${item.trim()}</div>`).join("")}</div></section>${action === "print" ? schedulePrint(rows) : `<section class="print-doc only-printable">${scheduleGrid(rows)}</section>`}`;
}

function scheduleFilters() {
  return `<section class="card no-print"><div class="toolbar compact-toolbar"><select onchange="setFilter('scheduleStudentId',this.value)"><option value="">All students</option>${state.students.map(student => `<option value="${student.id}" ${ui.filters.scheduleStudentId === student.id ? "selected" : ""}>${student.name}</option>`).join("")}</select><select onchange="setFilter('scheduleSubjectId',this.value)"><option value="">All subjects</option>${state.subjects.map(subject => `<option value="${subject.id}" ${ui.filters.scheduleSubjectId === subject.id ? "selected" : ""}>${subject.name}</option>`).join("")}</select><select onchange="setFilter('scheduleMonth',this.value)"><option value="">All months</option>${monthOptions().map(month => `<option value="${month.value}" ${ui.filters.scheduleMonth === month.value ? "selected" : ""}>${month.label}</option>`).join("")}</select><select onchange="setFilter('scheduleDay',this.value)"><option value="">All days</option>${dayNames().map(day => `<option value="${day}" ${ui.filters.scheduleDay === day ? "selected" : ""}>${day}</option>`).join("")}</select><select onchange="setFilter('scheduleStatus',this.value)"><option value="">All statuses</option>${["Scheduled", "Completed", "Cancelled", "Missed", "Rescheduled"].map(status => `<option value="${status}" ${ui.filters.scheduleStatus === status ? "selected" : ""}>${status}</option>`).join("")}</select></div></section>`;
}

function filteredSchedule() {
  return state.schedule.filter(row =>
    (!ui.filters.scheduleStudentId || row.studentId === ui.filters.scheduleStudentId)
    && (!ui.filters.scheduleSubjectId || row.subjectId === ui.filters.scheduleSubjectId)
    && (!ui.filters.scheduleDay || row.day === ui.filters.scheduleDay)
    && (!ui.filters.scheduleStatus || row.status === ui.filters.scheduleStatus)
    && (!ui.filters.scheduleMonth || String(row.date || "").slice(0, 7) === ui.filters.scheduleMonth)
  );
}

export function scheduleGrid(rows = filteredSchedule()) {
  if (!rows.length) return emptyState("No lessons match these filters.");
  if (ui.scheduleMode === "day") return dayAgenda(rows);
  if (ui.scheduleMode === "month") return `<div class="calendar-month">${Array.from({ length: 35 }, (_, index) => `<div class="month-day" ondragover="event.preventDefault()" ondrop="dropLesson(event,'${dayNames()[index % 7]}')"><strong>${index + 1}</strong>${rows.filter(row => dayNames().indexOf(row.day) === index % 7).slice(0, 2).map(lessonCard).join("")}</div>`).join("")}</div>`;
  return `<div class="calendar-week">${dayNames().map(day => `<div class="day" ondragover="event.preventDefault()" ondrop="dropLesson(event,'${day}')"><strong>${day}</strong>${rows.filter(row => row.day === day).sort((a, b) => a.start.localeCompare(b.start)).map(lessonCard).join("")}</div>`).join("")}</div>`;
}

function dayAgenda(rows) {
  return `<div class="timeline">${rows.sort((a, b) => a.start.localeCompare(b.start)).map(row => `<div class="agenda-row"><strong>${row.start}</strong>${lessonCard(row)}</div>`).join("")}</div>`;
}

function lessonCard(row) {
  return `<div class="lesson ${hasScheduleConflict(row) ? "conflict" : ""}" draggable="true" ondragstart="dragLesson(event,'${row.id}')"><strong>${row.start}-${row.end}</strong><br>${studentName(row.studentId)}<br>${subjectName(row.subjectId)}<br>${badge(row.status)} <span class="muted">${row.location}</span></div>`;
}

function monthOptions() {
  const months = Array.from(new Set(state.schedule.map(row => String(row.date || "").slice(0, 7)).filter(Boolean))).sort();
  return months.map(value => ({ value, label: new Date(`${value}-01T00:00:00`).toLocaleDateString("en-ZA", { month: "long", year: "numeric" }) }));
}

export function scheduleForm(record = {}) {
  const student = state.students.find(row => row.id === record.studentId) || state.students[0] || {};
  const subjects = student.subjectIds?.length ? state.subjects.filter(subject => student.subjectIds.includes(subject.id)) : state.subjects;
  return `<div class="form-grid"><label class="field"><span>Student</span><select name="studentId" onchange="refreshScheduleStudentDetails(this.value)">${state.students.map(item => `<option value="${item.id}" ${student.id === item.id ? "selected" : ""}>${item.name}</option>`).join("")}</select></label><label class="field"><span>Subject</span><select id="subjectId" name="subjectId">${subjects.map(subject => `<option value="${subject.id}" ${record.subjectId === subject.id ? "selected" : ""}>${subject.name}</option>`).join("")}</select></label><div class="form-help" id="schedule-student-summary"><strong>Student preferences</strong><br>Subjects: ${subjects.map(subject => subject.name).join(", ") || "None selected"}<br>Preferred days: ${student.days || "Not specified"}<br>Preferred time: ${student.time || "Not specified"}<br>Lessons/week: ${student.frequency || "Not specified"}<br>Availability: ${student.availabilityNotes || "Not specified"}</div><label class="field"><span>Date</span><input name="date" type="date" value="${record.date || ""}"></label><label class="field"><span>Day</span><select name="day">${dayNames().map(day => `<option ${record.day === day ? "selected" : ""}>${day}</option>`).join("")}</select></label><label class="field"><span>Start</span><input name="start" type="time" value="${record.start || ""}"></label><label class="field"><span>End</span><input name="end" type="time" value="${record.end || ""}"></label><label class="field"><span>Status</span><select name="status">${["Scheduled", "Completed", "Cancelled", "Missed", "Rescheduled"].map(status => `<option ${record.status === status ? "selected" : ""}>${status}</option>`).join("")}</select></label><label class="field"><span>Recurring weekly</span><select name="recurring"><option value="true" ${record.recurring !== false ? "selected" : ""}>Yes</option><option value="false" ${record.recurring === false ? "selected" : ""}>No</option></select></label><label class="field"><span>Lesson type</span><select name="type"><option>Individual</option><option>Group</option></select></label><label class="field"><span>Location</span><input name="location" value="${record.location || ""}"></label><label class="field"><span>Notes</span><textarea name="notes">${record.notes || ""}</textarea></label></div>`;
}
