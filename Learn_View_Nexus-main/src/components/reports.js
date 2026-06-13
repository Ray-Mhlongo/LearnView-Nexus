import { actionMenu, badge, emptyState, table } from "../utils.js";
import { getStudent, state, ui } from "../state.js";
import { reportCardPrint } from "../print/reportCard.js";

export function reports() {
  const action = ui.sectionAction.reports;
  const report = state.reportCards.find(row => row.id === ui.selectedReportId) || buildDraftReport();
  if (!action) return actionMenu("Report Cards", [
    { section: "reports", action: "generate", icon: "file-plus", title: "Generate Report Card" },
    { section: "reports", action: "view", icon: "list", title: "View Report Cards" },
    { section: "reports", action: "performance", icon: "trending-up", title: "Student Performance" },
    { section: "reports", action: "settings", icon: "settings", title: "Report Settings" }
  ]);
  if (action === "view") return `<section class="card"><div class="section-title"><h3>Saved report cards</h3><button class="btn ghost" onclick="navigateBack()">Back</button></div>${table("", ["Report", "Student", "Period", "Date", ""], state.reportCards.map(row => [row.id, getStudent(row.studentId)?.name, row.periodLabel, row.date, `<button class="btn primary" onclick="openPrintPreview('report','${row.id}')">Print Preview</button>`]))}</section>`;
  if (action === "performance") return `<section class="card"><div class="section-title"><h3>Student Performance</h3><div class="actions"><button class="btn ghost" onclick="navigateBack()">Back</button><button class="btn primary" onclick="openPrintPreview('report','${report.id}')">Print Preview</button></div></div>${reportControls(report)}</section>${reportCardPrint(report)}`;
  if (action === "settings") return `<section class="card"><div class="section-title"><h3>Report Settings</h3><button class="btn ghost" onclick="navigateBack()">Back</button></div><p class="muted">Change term labels, comments, grading scale and print settings in Settings.</p><button class="btn primary" onclick="go('settings')">Open Settings</button></section>`;
  return `<section class="card no-print"><div class="section-title"><h3>Generate Report Card</h3><div class="actions"><button class="btn ghost" onclick="navigateBack()">Back</button><button class="btn primary" onclick="openReport()">Open report form</button><button class="btn ghost" onclick="openPrintPreview('report','${report.id}')">Print Preview</button></div></div>${reportControls(report)}</section>${reportCardPrint(report)}`;
}

function buildDraftReport() {
  const student = getStudent(ui.reportDraft.studentId) || state.students[0];
  return {
    id: "Preview",
    studentId: student?.id || "",
    periodType: ui.reportDraft.periodType,
    periodLabel: `${ui.reportDraft.periodType} preview`,
    startDate: ui.reportDraft.startDate,
    endDate: ui.reportDraft.endDate,
    subjectIds: ui.reportDraft.subjectIds.length ? ui.reportDraft.subjectIds : student?.subjectIds || [],
    tutorComments: ui.reportDraft.tutorComments
  };
}

function reportControls(report) {
  if (!state.students.length) return emptyState("Add a student before generating report cards.");
  return `<div class="toolbar"><select onchange="ui.reportDraft.studentId=this.value;renderApp()">${state.students.map(student => `<option value="${student.id}" ${report.studentId === student.id ? "selected" : ""}>${student.name}</option>`).join("")}</select><select onchange="ui.reportDraft.periodType=this.value;renderApp()">${["Month", "Quarter", "Term", "Custom"].map(type => `<option ${report.periodType === type ? "selected" : ""}>${type}</option>`).join("")}</select><input type="date" value="${report.startDate || ""}" onchange="ui.reportDraft.startDate=this.value;renderApp()"><input type="date" value="${report.endDate || ""}" onchange="ui.reportDraft.endDate=this.value;renderApp()"></div><p>${badge(report.periodType || "Term")} The print template filters assessments by selected period and subjects.</p>`;
}

export function reportForm(record = {}) {
  const student = getStudent(record.studentId) || state.students[0] || {};
  return `<div class="form-grid"><label class="field"><span>Student</span><select name="studentId">${state.students.map(item => `<option value="${item.id}" ${record.studentId === item.id ? "selected" : ""}>${item.name}</option>`).join("")}</select></label><label class="field"><span>Period type</span><select name="periodType">${["Month", "Quarter", "Term", "Custom"].map(type => `<option ${record.periodType === type ? "selected" : ""}>${type}</option>`).join("")}</select></label><label class="field"><span>Period label</span><input name="periodLabel" value="${record.periodLabel || ""}"></label><label class="field"><span>Start date</span><input name="startDate" type="date" value="${record.startDate || ""}"></label><label class="field"><span>End date</span><input name="endDate" type="date" value="${record.endDate || ""}"></label><label class="field"><span>Subjects</span><select name="subjectIds" multiple>${state.subjects.map(subject => `<option value="${subject.id}" ${(record.subjectIds || student.subjectIds || []).includes(subject.id) ? "selected" : ""}>${subject.name}</option>`).join("")}</select></label><label class="field"><span>Tutor comments</span><textarea name="tutorComments">${record.tutorComments || ""}</textarea></label></div>`;
}
