import { average, dateInRange, logo, scorePercent } from "../utils.js";
import { attendancePercent, getStudent, performanceAverage, state, subjectName } from "../state.js";
import { watermark } from "./invoice.js";

export function reportCardPrint(report) {
  const student = getStudent(report.studentId);
  if (!student) return "";
  const subjectIds = report.subjectIds?.length ? report.subjectIds : student.subjectIds;
  const marks = state.assessments
    .filter(mark => mark.studentId === student.id)
    .filter(mark => subjectIds.includes(mark.subjectId))
    .filter(mark => dateInRange(mark.date, report.startDate, report.endDate));
  const overall = performanceAverage(student.id, subjectIds, report.startDate, report.endDate);
  const rows = subjectIds.map(subjectId => {
    const subjectMarks = marks.filter(mark => mark.subjectId === subjectId);
    return [
      subjectName(subjectId),
      subjectMarks.map(mark => `${mark.name}: ${scorePercent(mark)}%`).join("<br>"),
      `${average(subjectMarks.map(scorePercent))}%`,
      grade(`${average(subjectMarks.map(scorePercent))}%`),
      report.subjectComments?.[subjectId] || "Continued practice recommended."
    ];
  });
  return `<section class="print-doc report-template only-printable">${watermark()}<div class="doc-content">
    <header class="print-head">
      <div>${logo("logo-doc")}<p class="muted">Learn Smarter.</p></div>
      <div class="print-title"><h1>REPORT CARD</h1><span>${report.periodLabel || report.periodType}</span><dl><dt>Date Generated</dt><dd>${new Date().toLocaleDateString("en-ZA")}</dd><dt>Report ID</dt><dd>${report.id}</dd></dl></div>
    </header>
    <div class="print-info-grid report-top">
      <section class="print-box"><h3>Student Details</h3><dl><dt>Student Name</dt><dd>${student.name}</dd><dt>Grade</dt><dd>${student.grade}</dd><dt>Parent / Guardian</dt><dd>${student.guardian}</dd><dt>Subjects</dt><dd>${subjectIds.map(subjectName).join(", ")}</dd></dl></section>
      <section class="print-box"><h3>Performance Summary</h3><div class="report-metrics">${metric("Overall Average", `${overall}%`)}${metric("Performance", overall >= 75 ? "Very Good" : overall >= 60 ? "Good" : "Support")}${metric("Subjects", subjectIds.length)}${metric("Attendance", `${attendancePercent(student.id)}%`)}</div><h3>Tutor Comments</h3><p>${report.tutorComments || "Consistent effort and positive attitude towards learning. Keep focusing on exam technique and time management."}</p></section>
    </div>
    <table class="print-table report-table"><thead><tr><th>Subject</th><th>Assessment Marks</th><th>Average</th><th>Grade</th><th>Comment</th></tr></thead><tbody>${rows.map(row => `<tr><td>${row[0]}</td><td>${row[1] || "No marks"}</td><td><strong class="strong-value">${row[2]}</strong></td><td>${row[3]}</td><td>${row[4]}</td></tr>`).join("")}</tbody></table>
    <div class="report-bottom"><section class="print-box"><h3>Improvement Areas</h3><p>${improvementAreas(overall)}</p></section><section class="print-box"><h3>Next Steps</h3><p>${nextSteps(overall)}</p></section><section class="print-box"><h3>Attendance</h3><p>${attendancePercent(student.id)}% attendance for the selected period where records are available.</p></section></div>
    <footer class="print-footer">${state.settings.phone} - ${state.settings.email} - ${state.settings.address}</footer>
  </div></section>`;
}

function metric(label, value) {
  return `<section class="metric-box"><strong>${value}</strong><span>${label}</span></section>`;
}

function improvementAreas(overall) {
  if (overall >= 75) return "Maintain consistency, deepen exam technique, and continue timed revision.";
  if (overall >= 60) return "Focus on weaker topics, practise past papers, and review mistakes weekly.";
  return "Prioritise foundational gaps, attendance consistency, and guided revision after each lesson.";
}

function nextSteps(overall) {
  if (overall >= 75) return "Set stretch targets and prepare advanced revision tasks for the next cycle.";
  if (overall >= 60) return "Create a focused improvement plan with measurable weekly assessment goals.";
  return "Schedule parent feedback and add structured support before the next assessment.";
}

function grade(value) {
  const n = Number(String(value).replace("%", ""));
  if (n >= 90) return "A+";
  if (n >= 80) return "A";
  if (n >= 70) return "B";
  if (n >= 60) return "C";
  if (n >= 50) return "D";
  return "E";
}
