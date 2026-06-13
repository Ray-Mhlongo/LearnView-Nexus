import { barChart, money, scorePercent, table } from "../utils.js";
import { attendancePercent, invoiceBalance, invoicePaid, performanceAverage, state, studentName, subjectName } from "../state.js";
import { kpi } from "./dashboard.js";

export function analytics() {
  return `<div class="grid cols-4">${kpi("Monthly income", money(state.payments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0)), "banknote")}${kpi("Outstanding", money(state.invoices.reduce((sum, invoice) => sum + invoiceBalance(invoice), 0)), "alert-circle")}${kpi("Growth", "+18%", "trending-up")}${kpi("At-risk", atRisk().length, "radar")}</div><div class="grid cols-2"><section class="card">${barChart("Students per grade", groupCount(state.students, "grade"))}</section><section class="card">${barChart("Students per subject", subjectCounts())}</section><section class="card">${barChart("Assessment analytics", subjectAverages(), "%")}</section><section class="card">${barChart("Attendance analytics", Object.fromEntries(state.students.map(student => [student.name, attendancePercent(student.id)])), "%")}</section></div><section class="card">${table("Students needing attention", ["Student", "Performance", "Attendance", "Action"], atRisk().map(student => [student.name, `${performanceAverage(student.id)}%`, `${attendancePercent(student.id)}%`, `<button class="btn ghost" onclick="composeMessage('${student.id}','performance')">Notify</button>`]))}</section>`;
}

function groupCount(list, key) {
  return list.reduce((out, item) => { out[item[key]] = (out[item[key]] || 0) + 1; return out; }, {});
}

function subjectCounts() {
  const out = {};
  state.students.forEach(student => student.subjectIds.forEach(subjectId => out[subjectName(subjectId)] = (out[subjectName(subjectId)] || 0) + 1));
  return out;
}

function subjectAverages() {
  return Object.fromEntries(state.subjects.map(subject => {
    const rows = state.assessments.filter(mark => mark.subjectId === subject.id);
    return [subject.name, rows.length ? Math.round(rows.reduce((sum, row) => sum + scorePercent(row), 0) / rows.length) : 0];
  }));
}

function atRisk() {
  return state.students.filter(student => performanceAverage(student.id) < 65 || attendancePercent(student.id) < 80);
}
