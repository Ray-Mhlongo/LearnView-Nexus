import { badge, logo, money } from "../utils.js";
import { getStudent, invoiceBalance, invoiceItems, invoicePaid, invoiceStatus, invoiceSubtotal, state, subjectName } from "../state.js";

export function invoicePrint(invoice) {
  if (!invoice) return "";
  const student = getStudent(invoice.studentId);
  const status = invoiceStatus(invoice);
  const items = invoiceItems(invoice.id);
  return `<section class="print-doc invoice-template only-printable">${watermark()}<div class="doc-content">
    <header class="print-head">
      <div>${logo("logo-doc")}<p class="muted">${state.settings.tagline}</p></div>
      <div class="print-title"><h1>INVOICE</h1><span>${invoice.id}</span><dl><dt>Invoice Date</dt><dd>${invoice.date}</dd><dt>Due Date</dt><dd>${invoice.due}</dd><dt>Status</dt><dd>${badge(status)}</dd></dl></div>
    </header>
    <div class="print-info-grid">
      <section class="print-box"><h3>Billed To</h3><p><strong>${invoice.guardian || student?.guardian || ""}</strong><br>Parent / Guardian of<br><strong class="strong-value">${student?.name || ""}</strong><br>${student?.parentPhone || ""}<br>${student?.parentEmail || ""}<br>${studentLocation(student)}</p></section>
      <section class="print-box"><h3>Student Details</h3><dl><dt>Student Name</dt><dd>${student?.name || ""}</dd><dt>Grade</dt><dd>${student?.grade || ""}</dd><dt>Student ID</dt><dd>${student?.id || ""}</dd><dt>Subjects</dt><dd>${(student?.subjectIds || []).map(subjectName).join(", ")}</dd></dl></section>
    </div>
    <table class="print-table"><thead><tr><th>Description</th><th>Subject</th><th>Qty</th><th>Rate (R)</th><th>Amount (R)</th></tr></thead><tbody>${items.map(item => `<tr><td>${item.description}</td><td>${subjectName(item.subjectId)}</td><td>${item.qty}</td><td>${Number(item.rate).toFixed(2)}</td><td>${(Number(item.qty) * Number(item.rate)).toFixed(2)}</td></tr>`).join("")}</tbody></table>
    <div class="invoice-lower">
      <section class="bank-strip"><strong>Banking Details</strong><span>${state.settings.banking}</span><span>Payment reference: ${invoice.id}</span></section>
      <section class="totals-box"><dl><dt>Subtotal</dt><dd>${money(invoiceSubtotal(invoice.id))}</dd><dt>Discount</dt><dd>${money(invoice.discount)}</dd><dt>Amount Paid</dt><dd>${money(invoicePaid(invoice.id))}</dd></dl><div><strong>Balance Due</strong><b>${money(invoiceBalance(invoice))}</b></div></section>
    </div>
    <div class="print-notes"><section><h3>Notes</h3><p>${invoice.notes || "Thank you for choosing LearnView."}</p></section><section><h3>Tutor Contact</h3><p>${state.settings.tutorName}<br>${state.settings.phone}<br>${state.settings.email}</p></section></div>
    <footer class="print-footer">${state.settings.phone} - ${state.settings.email} - ${state.settings.address}</footer>
  </div></section>`;
}

export function watermark() {
  return `<div class="watermark">${logo("logo-doc")}</div>`;
}

export function docHead(title, meta) {
  return `<div class="doc-head"><div>${logo("logo-doc")}<p><strong>${state.settings.businessName}</strong><br>${state.settings.tutorName}<br>${state.settings.phone} - ${state.settings.email}<br>${state.settings.address}</p></div><div><div class="doc-title">${title}</div><p class="muted">${meta}</p></div></div>`;
}

function studentLocation(student) {
  return [student?.suburb, student?.city, student?.province].filter(Boolean).join(", ");
}
