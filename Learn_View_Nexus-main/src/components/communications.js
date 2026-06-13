import { actionMenu, table } from "../utils.js";
import { attendancePercent, invoiceBalance, performanceAverage, state } from "../state.js";

export function communications() {
  const action = window.ui.sectionAction.communications;
  if (!action) return actionMenu("Messages", [
    { section: "communications", action: "invoice", icon: "receipt", title: "Invoice Reminder" },
    { section: "communications", action: "attendance", icon: "user-check", title: "Attendance Message" },
    { section: "communications", action: "performance", icon: "trending-up", title: "Performance Message" },
    { section: "communications", action: "custom", icon: "message-circle", title: "Custom WhatsApp Message" },
    { section: "communications", action: "history", icon: "list", title: "Message History" }
  ]);
  return `<section class="panel"><div class="profile-hero"><div><p class="eyebrow">Parent communication</p><h2 style="margin:0">Generate WhatsApp-ready messages from live records.</h2><p class="muted">Invoice reminders, attendance notices and performance updates are stored in the Messages sheet when connected.</p></div></div></section><div class="grid cols-3">${state.students.map(card).join("")}</div><section class="card">${table("Message log", ["Date", "Student", "Type", "Message", ""], state.messages.slice().reverse().map(message => [message.date, state.students.find(s => s.id === message.studentId)?.name, message.type, message.text, `<button class="btn ghost" onclick="editRecord('messages','${message.id}')">Edit</button>`]))}</section>`;
}

function card(student) {
  const due = state.invoices.filter(invoice => invoice.studentId === student.id).reduce((sum, invoice) => sum + invoiceBalance(invoice), 0);
  return `<section class="card"><h3>${student.name}</h3><p class="muted">${student.guardian} · ${student.parentPhone}</p><p>Balance: R ${due.toFixed(2)}<br>Attendance: ${attendancePercent(student.id)}%<br>Performance: ${performanceAverage(student.id)}%</p><div class="actions"><button class="btn ghost" onclick="composeMessage('${student.id}','invoice')">Invoice</button><button class="btn ghost" onclick="composeMessage('${student.id}','attendance')">Attendance</button><button class="btn primary" onclick="composeMessage('${student.id}','performance')">Performance</button></div></section>`;
}
