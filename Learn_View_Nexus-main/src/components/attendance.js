import { actionMenu, badge, emptyState, table } from "../utils.js";
import { attendancePercent, state, studentName, subjectName, ui } from "../state.js";
import { kpi } from "./dashboard.js";

export function attendance() {
  const action = ui.sectionAction.attendance;
  if (!action) return actionMenu("Attendance", [
    { section: "attendance", action: "mark", icon: "clipboard-plus", title: "Mark Attendance" },
    { section: "attendance", action: "history", icon: "list", title: "Attendance History" },
    { section: "attendance", action: "reports", icon: "chart-column", title: "Attendance Reports" },
    { section: "attendance", action: "poor", icon: "alert-circle", title: "Poor Attendance" }
  ]);
  if (action === "mark") return `<section class="card"><div class="section-title"><h3>Mark Attendance</h3><button class="btn ghost" onclick="navigateBack()">Back</button></div><button class="btn primary" onclick="openAttendance()">Open attendance form</button></section>`;

  const rows = filteredAttendanceRows();
  const selectedStudentId = ui.filters.attendanceStudentId || "";
  const selectedStudent = state.students.find(student => student.id === selectedStudentId);
  const poorStudents = filteredPoorStudents();
  const title = {
    history: "Attendance register",
    reports: "Attendance reports",
    poor: "Poor attendance"
  }[action] || "Attendance register";

  return `${attendanceFilter()}
    <div class="grid cols-4">${attendanceKpis(rows, selectedStudentId)}</div>
    <section class="card">
      <div class="section-title"><h3>${title}</h3><div class="actions"><button class="btn ghost" onclick="navigateBack()">Back</button><button class="btn primary" onclick="openAttendance()">Mark attendance</button></div></div>
      ${action === "poor" ? poorAttendanceView(poorStudents, selectedStudent) : attendanceTable(rows, selectedStudent)}
    </section>`;
}

function attendanceFilter() {
  return `<section class="card attendance-filter"><label class="field compact-field"><span>Filter by student</span><select onchange="setFilter('attendanceStudentId',this.value)"><option value="">All Students</option>${state.students.map(student => `<option value="${student.id}" ${ui.filters.attendanceStudentId === student.id ? "selected" : ""}>${student.name}</option>`).join("")}</select></label></section>`;
}

function filteredAttendanceRows() {
  const studentId = ui.filters.attendanceStudentId || "";
  return state.attendance.filter(row => !studentId || row.studentId === studentId);
}

function filteredPoorStudents() {
  const studentId = ui.filters.attendanceStudentId || "";
  return state.students
    .filter(student => !studentId || student.id === studentId)
    .map(student => ({ ...student, attendanceRate: attendancePercent(student.id), records: state.attendance.filter(row => row.studentId === student.id).length }))
    .filter(student => student.records > 0 && student.attendanceRate < 75);
}

function attendanceKpis(rows, selectedStudentId) {
  const rate = selectedStudentId
    ? attendancePercent(selectedStudentId)
    : state.students.length
      ? Math.round(state.students.reduce((sum, student) => sum + attendancePercent(student.id), 0) / state.students.length)
      : 0;
  return `${kpi("Attendance rate", `${rate}%`, "badge-check")}${kpi("Present", count(rows, "Present"), "check")}${kpi("Late", count(rows, "Late"), "clock")}${kpi("Absent", count(rows, "Absent"), "x")}`;
}

function attendanceTable(rows, selectedStudent) {
  if (!rows.length && selectedStudent) return emptyState("No attendance records found for this student.");
  return table("", ["Date", "Student", "Subject", "Status", "Notes", ""], rows.map(row => [row.date, studentName(row.studentId), subjectName(row.subjectId), badge(row.status), row.notes, actions("attendance", row.id)]));
}

function poorAttendanceView(students, selectedStudent) {
  const selectedRecords = selectedStudent ? state.attendance.filter(row => row.studentId === selectedStudent.id).length : 0;
  if (!students.length && selectedStudent && !selectedRecords) return emptyState("No attendance records found for this student.");
  if (!students.length && selectedStudent) return emptyState("No poor attendance records found for this student.");
  if (!students.length) return emptyState("No poor attendance records found.");
  return table("", ["Student", "Attendance", "Records", "Recommendation"], students.map(student => [
    student.name,
    `${student.attendanceRate}%`,
    student.records,
    student.attendanceRate < 60 ? "Prioritise a parent follow up." : "Monitor attendance and reinforce lesson consistency."
  ]));
}

function count(rows, status) {
  return rows.filter(row => row.status === status).length;
}

function actions(collection, id) {
  return `<div class="actions"><button class="btn ghost" onclick="editRecord('${collection}','${id}')">Edit</button><button class="btn danger" onclick="deleteRecord('${collection}','${id}')">Delete</button></div>`;
}

export function attendanceForm(record = {}) {
  const student = state.students.find(row => row.id === record.studentId) || state.students[0] || {};
  const subjects = student.subjectIds?.length ? state.subjects.filter(subject => student.subjectIds.includes(subject.id)) : state.subjects;
  return `<div class="form-grid"><label class="field"><span>Student</span><select name="studentId" onchange="refreshStudentSubjectOptions(this.value,'subjectId')">${state.students.map(item => `<option value="${item.id}" ${student.id === item.id ? "selected" : ""}>${item.name}</option>`).join("")}</select></label><label class="field"><span>Subject</span><select id="subjectId" name="subjectId">${subjects.map(subject => `<option value="${subject.id}" ${record.subjectId === subject.id ? "selected" : ""}>${subject.name}</option>`).join("")}</select></label><label class="field"><span>Date</span><input name="date" type="date" value="${record.date || ""}"></label><label class="field"><span>Status</span><select name="status">${["Present", "Absent", "Late", "Excused"].map(status => `<option ${record.status === status ? "selected" : ""}>${status}</option>`).join("")}</select></label><label class="field"><span>Notes</span><textarea name="notes">${record.notes || ""}</textarea></label></div>`;
}
