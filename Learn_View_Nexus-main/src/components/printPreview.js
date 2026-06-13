import { icon } from "../utils.js";
import { state, getStudent, ui } from "../state.js";
import { invoicePrint } from "../print/invoice.js";
import { reportCardPrint } from "../print/reportCard.js";
import { schedulePrint } from "../print/schedule.js";

export function printPreview() {
  const { type, id } = ui.printPreview || {};
  const documentHtml = printDocument(type, id);
  const downloadLabel = ui.pdfLoading ? "Generating PDF..." : "Download PDF";
  return `<section class="print-preview">
    <header class="print-preview-toolbar no-print">
      <button class="btn ghost" onclick="navigateBack()">${icon("arrow-left")} Back</button>
      <div><strong>${previewTitle(type)}</strong><p class="muted">Previewing the selected document only.</p></div>
      <div class="actions">
        <button class="btn ghost" onclick="printCurrent()">${icon("printer")} Print</button>
        <button class="btn primary" onclick="downloadCurrentPdf()" ${ui.pdfLoading ? "disabled" : ""}>${icon("download")} ${downloadLabel}</button>
      </div>
    </header>
    <main class="print-preview-stage">${documentHtml || emptyPreview()}</main>
  </section>`;
}

export function printDocument(type, id) {
  if (type === "invoice") {
    return invoicePrint(state.invoices.find(invoice => invoice.id === id) || state.invoices[0]);
  }

  if (type === "report") {
    return reportCardPrint(state.reportCards.find(report => report.id === id) || state.reportCards[0] || draftReport());
  }

  if (type === "schedule") {
    return schedulePrint(filteredSchedule());
  }

  return "";
}

window.currentPdfFilename = () => {
  const { type, id } = ui.printPreview || {};

  if (type === "invoice") {
    const invoice = state.invoices.find(row => row.id === id) || state.invoices[0];
    return `LearnView_Invoice_${safeFileName(invoice?.id || "Selected")}.pdf`;
  }

  if (type === "report") {
    const report = state.reportCards.find(row => row.id === id) || state.reportCards[0] || draftReport();
    const student = getStudent(report.studentId);
    const term = safeFileName(report.periodLabel || report.periodType || "Report");
    return `LearnView_ReportCard_${safeFileName(student?.name || report.studentId || "Student")}_${term}.pdf`;
  }

  const date = new Date().toISOString().slice(0, 10);
  return `LearnView_Schedule_${date}.pdf`;
};

function safeFileName(value) {
  return String(value || "Document").trim().replace(/[^a-z0-9-]+/gi, "_").replace(/^_+|_+$/g, "") || "Document";
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

function draftReport() {
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

function previewTitle(type) {
  return {
    invoice: "Invoice preview",
    report: "Report card preview",
    schedule: "Schedule preview"
  }[type] || "Print preview";
}

function emptyPreview() {
  return `<section class="card"><p class="muted">No document is available to preview.</p></section>`;
}
