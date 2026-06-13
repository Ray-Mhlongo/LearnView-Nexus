import { actionMenu, badge, emptyState, initials, scorePercent, spark, table } from "../utils.js";
import { attendancePercent, getStudent, invoiceBalance, performanceAverage, state, subjectName, ui } from "../state.js";
import { kpi } from "./dashboard.js";
import { citiesForProvince, provinces } from "../data/southAfricaLocations.js";

export function students() {
  const action = ui.sectionAction.students;
  if (!action) return actionMenu("Students", [
    { section: "students", action: "add", icon: "user-plus", title: "Add Student" },
    { section: "students", action: "view", icon: "list", title: "View Students" },
    { section: "students", action: "profiles", icon: "user-round", title: "Student Profiles" },
    { section: "students", action: "inactive", icon: "user-x", title: "Inactive Students" }
  ]);
  if (action === "add") return `<section class="card"><div class="section-title"><h3>Add Student</h3><button class="btn ghost" onclick="navigateBack()">Back</button></div><button class="btn primary" onclick="openStudent()">Open student form</button></section>`;
  const rows = filteredStudents();
  const visibleRows = action === "inactive" ? rows.filter(student => student.status === "Inactive") : rows;
  const selected = getStudent(ui.selectedStudentId) || rows[0] || state.students[0];
  if (selected) ui.selectedStudentId = selected.id;
  return `<section class="card no-print">${filters()}</section>
  <div class="grid cols-3"><section class="card"><div class="section-title"><h3>${action === "profiles" ? "Profiles" : "Students"}</h3><button class="btn ghost" onclick="navigateBack()">Back</button></div><div class="timeline">${visibleRows.map(studentListItem).join("") || emptyState("No students match these filters.")}</div></section><section class="card" style="grid-column:span 2">${action === "view" ? table("Student list", ["Student", "Grade", "Guardian", "Location", "Status"], visibleRows.map(student => [student.name, student.grade, student.guardian, studentLocation(student), badge(student.status)])) : profile(selected)}</section></div>`;
}

function filters() {
  return `<div class="toolbar"><input placeholder="Search students" oninput="setFilter('search',this.value)" value="${ui.filters.search || ""}"><select onchange="setFilter('grade',this.value)"><option value="">All grades</option>${["Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12"].map(grade => `<option ${ui.filters.grade === grade ? "selected" : ""}>${grade}</option>`).join("")}</select><select onchange="setFilter('subjectId',this.value)"><option value="">All subjects</option>${state.subjects.map(subject => `<option value="${subject.id}" ${ui.filters.subjectId === subject.id ? "selected" : ""}>${subject.name}</option>`).join("")}</select><select onchange="setFilter('status',this.value)"><option value="">All statuses</option><option>Active</option><option>Inactive</option></select></div>`;
}

function filteredStudents() {
  return state.students.filter(student => (!ui.filters.search || JSON.stringify(student).toLowerCase().includes(ui.filters.search.toLowerCase())) && (!ui.filters.grade || student.grade === ui.filters.grade) && (!ui.filters.subjectId || student.subjectIds.includes(ui.filters.subjectId)) && (!ui.filters.status || student.status === ui.filters.status));
}

function studentListItem(student) {
  return `<button class="timeline-card" style="text-align:left;border:0" onclick="selectStudent('${student.id}')"><div class="profile-hero" style="grid-template-columns:auto 1fr"><div class="avatar">${initials(student.name)}</div><div><strong>${student.name}</strong><br><span class="muted">${student.grade} - ${student.subjectIds.map(subjectName).join(", ")}</span><br>${badge(student.status)}</div></div></button>`;
}

function profile(student) {
  if (!student) return emptyState("Create a student profile to begin.");
  const marks = state.assessments.filter(mark => mark.studentId === student.id);
  const invoices = state.invoices.filter(invoice => invoice.studentId === student.id);
  const attendance = state.attendance.filter(row => row.studentId === student.id);
  return `<div class="profile-hero"><div class="avatar">${initials(student.name)}</div><div><h2 style="margin:0">${student.name}</h2><p class="muted">${student.grade} - ${student.subjectIds.map(subjectName).join(", ")}</p></div><div class="actions"><button class="btn ghost" onclick="editRecord('students','${student.id}')">Edit</button><button class="btn primary" onclick="composeMessage('${student.id}','performance')">Message</button></div></div>
  <div class="grid cols-4" style="margin-top:18px">${kpi("Performance", `${performanceAverage(student.id)}%`, "trending-up")}${kpi("Attendance", `${attendancePercent(student.id)}%`, "badge-check")}${kpi("Outstanding", `R ${invoices.reduce((s, i) => s + invoiceBalance(i), 0).toFixed(0)}`, "receipt")}${kpi("Lessons/week", student.frequency, "calendar-clock")}</div>
  <div class="grid cols-2" style="margin-top:18px"><section class="card"><h3>Parent information</h3><p><strong>${student.guardian}</strong><br>${student.parentPhone}<br>${student.parentEmail}<br>${studentLocation(student)}</p></section><section class="card"><h3>Performance trend</h3>${spark(marks.map(scorePercent).concat([performanceAverage(student.id)]))}</section><section class="card">${table("Attendance", ["Date", "Subject", "Status", "Notes"], attendance.map(row => [row.date, subjectName(row.subjectId), badge(row.status), row.notes]))}</section><section class="card">${table("Assessments", ["Date", "Subject", "Assessment", "Score"], marks.map(mark => [mark.date, subjectName(mark.subjectId), mark.name, `${scorePercent(mark)}%`]))}</section><section class="card">${table("Invoices", ["Invoice", "Balance", "Due"], invoices.map(invoice => [invoice.id, `R ${invoiceBalance(invoice).toFixed(2)}`, invoice.due]))}</section><section class="card"><h3>Notes</h3><p>${student.notes}</p><p><strong>Availability:</strong> ${student.availabilityNotes || "Not specified"}</p></section></div>`;
}

export function studentForm(record = {}) {
  const province = record.province || "Gauteng";
  const cityOptions = citiesForProvince(province);
  return `<div class="form-grid"><label class="field"><span>Full name</span><input name="name" required value="${record.name || ""}"></label><label class="field"><span>Grade</span><select name="grade">${["Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12"].map(v => `<option ${record.grade === v ? "selected" : ""}>${v}</option>`).join("")}</select></label><label class="field"><span>Guardian</span><input name="guardian" value="${record.guardian || ""}"></label><label class="field"><span>Parent phone</span><input name="parentPhone" value="${record.parentPhone || ""}"></label><label class="field"><span>Parent email</span><input name="parentEmail" value="${record.parentEmail || ""}"></label><label class="field"><span>Student phone</span><input name="studentPhone" value="${record.studentPhone || ""}"></label><label class="field"><span>Province</span><select name="province" id="student-province" onchange="refreshStudentCities(this.value)">${provinces.map(item => `<option value="${item}" ${province === item ? "selected" : ""}>${item}</option>`).join("")}</select></label><label class="field"><span>City or town</span><select name="city" id="student-city">${cityOptions.map(city => `<option value="${city}" ${record.city === city ? "selected" : ""}>${city}</option>`).join("")}</select></label><label class="field"><span>Suburb or area</span><input name="suburb" value="${record.suburb || ""}"></label><label class="field"><span>Subjects</span><select name="subjectIds" multiple>${state.subjects.map(subject => `<option value="${subject.id}" ${record.subjectIds?.includes(subject.id) ? "selected" : ""}>${subject.name}</option>`).join("")}</select></label><label class="field"><span>Start date</span><input name="startDate" type="date" value="${record.startDate || ""}"></label><label class="field"><span>Lessons per week</span><input name="frequency" type="number" value="${record.frequency || 1}"></label><label class="field"><span>Preferred days</span><input name="days" value="${record.days || ""}"></label><label class="field"><span>Preferred time</span><input name="time" value="${record.time || ""}"></label><label class="field"><span>Payment type</span><select name="paymentType"><option ${record.paymentType === "Monthly" ? "selected" : ""}>Monthly</option><option ${record.paymentType === "Per lesson" ? "selected" : ""}>Per lesson</option></select></label><label class="field"><span>Status</span><select name="status"><option ${record.status === "Active" ? "selected" : ""}>Active</option><option ${record.status === "Inactive" ? "selected" : ""}>Inactive</option></select></label><label class="field"><span>Availability notes</span><textarea name="availabilityNotes">${record.availabilityNotes || ""}</textarea></label><label class="field"><span>Notes</span><textarea name="notes">${record.notes || ""}</textarea></label></div>`;
}

function studentLocation(student) {
  return [student.suburb, student.city, student.province].filter(Boolean).join(", ");
}
