import { dayNames, logo } from "../utils.js";
import { hasScheduleConflict, state, studentName, subjectName } from "../state.js";
import { watermark } from "./invoice.js";

export function schedulePrint(rows = state.schedule) {
  return `<section class="print-doc schedule-template only-printable">${watermark()}<div class="doc-content">
    <div class="doc-head"><div>${logo("logo-doc")}<p><strong>${state.settings.businessName}</strong><br>${state.settings.tutorName}<br>${state.settings.phone} - ${state.settings.email}</p></div><div><div class="doc-title">Weekly Schedule</div><p class="muted">Filtered teaching schedule</p></div></div>
    <div class="calendar-week">${dayNames().map(day => `<div class="day"><strong>${day}</strong>${rows.filter(lesson => lesson.day === day).sort((a, b) => a.start.localeCompare(b.start)).map(lesson => `<div class="lesson ${hasScheduleConflict(lesson) ? "conflict" : ""}"><strong>${lesson.start}-${lesson.end}</strong><br>${studentName(lesson.studentId)}<br>${subjectName(lesson.subjectId)}<br><span class="muted">${lesson.status} - ${lesson.location}</span></div>`).join("")}</div>`).join("")}</div>
  </div></section>`;
}
