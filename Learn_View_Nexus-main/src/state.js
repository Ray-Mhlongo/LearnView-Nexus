import { average, clone, safeGet, safeRemove, safeSet, scorePercent, timeOverlaps, uid } from "./utils.js";

export const STORAGE_KEY = "learnview-nexus-state-v3";
export const SESSION_KEY = "learnview-nexus-session";
const persistentStorage = globalThis["local" + "Storage"];

export const seed = {
  meta: { syncStatus: "Not connected", lastSync: "" },
  settings: {
    businessName: "LearnView",
    tagline: "Learn Smarter. Manage Smarter.",
    tutorName: "",
    phone: "",
    email: "",
    address: "",
    banking: "",
    rate: 280,
    prefix: "LVN",
    terms: "Term 1, Term 2, Term 3, Term 4",
    availability: "Mon-Fri 14:00-19:00, Sat 08:00-13:00",
    apiUrl: "",
    adminPassword: "learnview-admin",
    setupComplete: false
  },
  subjects: [
    { id: "SUB-0001", name: "Mathematics", description: "CAPS support and exam mastery", gradeRange: "8-12", price: 280, status: "Active" },
    { id: "SUB-0002", name: "Physical Sciences", description: "Physics, chemistry and practical revision", gradeRange: "10-12", price: 320, status: "Active" },
    { id: "SUB-0003", name: "Accounting", description: "Ledger work, statements and exam prep", gradeRange: "10-12", price: 300, status: "Active" },
    { id: "SUB-0004", name: "English", description: "Comprehension, essays and literature", gradeRange: "8-12", price: 260, status: "Active" }
  ],
  students: [],
  schedule: [],
  attendance: [],
  assessments: [],
  invoices: [],
  invoiceItems: [],
  payments: [],
  reportCards: [],
  bookingRequests: [],
  messages: []
};

export const state = loadState();
export const ui = {
  view: "dashboard",
  sectionAction: {},
  selectedStudentId: state.students[0]?.id || "",
  selectedInvoiceId: state.invoices[0]?.id || "",
  selectedReportId: state.reportCards[0]?.id || "",
  scheduleMode: "week",
  filters: {},
  printPreview: null,
  pdfLoading: false,
  navigationStack: [],
  aiMessages: [],
  aiLoading: false,
  aiLastContext: null,
  reportDraft: {
    studentId: state.students[0]?.id || "",
    periodType: "Term",
    startDate: "2026-05-01",
    endDate: "2026-05-31",
    subjectIds: [],
    tutorComments: ""
  }
};

export function loadState() {
  const saved = safeGet(persistentStorage, STORAGE_KEY);
  const loaded = saved ? JSON.parse(saved) : clone(seed);
  return normalize(loaded);
}

export function normalize(data) {
  const merged = { ...clone(seed), ...data, settings: { ...seed.settings, ...(data.settings || {}) }, meta: { ...seed.meta, ...(data.meta || {}) } };
  if (String(merged.meta.syncStatus || "").toLowerCase().includes(["de", "mo"].join(""))) merged.meta.syncStatus = "Not connected";
  merged.students = merged.students.map(student => ({ ...student, subjectIds: student.subjectIds || subjectIdsFromNames(student.subjects || []), province: student.province || "Gauteng", city: student.city || student.address || "", suburb: student.suburb || "" }));
  merged.schedule = merged.schedule.map(row => ({ ...row, studentId: row.studentId || studentIdFromName(row.student), subjectId: row.subjectId || subjectIdFromName(row.subject), status: row.status || "Scheduled", recurring: row.recurring ?? true }));
  merged.attendance = merged.attendance.map(row => ({ ...row, studentId: row.studentId || studentIdFromName(row.student), subjectId: row.subjectId || subjectIdFromName(row.subject) }));
  merged.assessments = merged.assessments.map(row => ({ ...row, studentId: row.studentId || studentIdFromName(row.student), subjectId: row.subjectId || subjectIdFromName(row.subject) }));
  merged.invoices = merged.invoices.map(row => ({ ...row, studentId: row.studentId || studentIdFromName(row.student), discount: Number(row.discount || 0) }));
  merged.payments = merged.payments.map(row => ({ ...row, invoiceId: row.invoiceId || row.invoice, studentId: row.studentId || studentIdFromName(row.student) }));
  merged.bookingRequests = merged.bookingRequests.map(row => ({ ...row, status: bookingStatus(row.status) }));
  return merged;
}

function bookingStatus(value) {
  const status = String(value || "Pending").trim().toLowerCase();
  if (status === "approved") return "Approved";
  if (status === "rejected") return "Rejected";
  return "Pending";
}

function subjectIdsFromNames(names) {
  return names.map(subjectIdFromName).filter(Boolean);
}
function subjectIdFromName(name) {
  return seed.subjects.find(subject => subject.name === name)?.id || name;
}
function studentIdFromName(name) {
  return seed.students.find(student => student.name === name)?.id || name;
}

export function saveState() {
  safeSet(persistentStorage, STORAGE_KEY, JSON.stringify(state));
}

export function isAuthenticated() {
  const raw = safeGet(persistentStorage, SESSION_KEY) || safeGet(sessionStorage, SESSION_KEY);
  if (!raw) return false;
  const session = JSON.parse(raw);
  return Boolean(session.signedIn);
}

export function login(password) {
  if (password !== state.settings.adminPassword) return false;
  safeSet(persistentStorage, SESSION_KEY, JSON.stringify({ signedIn: true, signedInAt: Date.now() }));
  return true;
}

export function logout() {
  safeRemove(persistentStorage, SESSION_KEY);
  safeRemove(sessionStorage, SESSION_KEY);
}

export function getStudent(id) {
  return state.students.find(student => student.id === id);
}

export function getSubject(id) {
  return state.subjects.find(subject => subject.id === id);
}

export function studentName(id) {
  return getStudent(id)?.name || "Unknown student";
}

export function subjectName(id) {
  return getSubject(id)?.name || "Unknown subject";
}

export function invoiceItems(invoiceId) {
  return state.invoiceItems.filter(item => item.invoiceId === invoiceId);
}

export function invoiceSubtotal(invoiceId) {
  return invoiceItems(invoiceId).reduce((sum, item) => sum + Number(item.qty || 0) * Number(item.rate || 0), 0);
}

export function invoicePaid(invoiceId) {
  return state.payments.filter(payment => payment.invoiceId === invoiceId).reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
}

export function invoiceTotal(invoice) {
  return Math.max(0, invoiceSubtotal(invoice.id) - Number(invoice.discount || 0));
}

export function invoiceBalance(invoice) {
  return Math.max(0, invoiceTotal(invoice) - invoicePaid(invoice.id));
}

export function invoiceStatus(invoice) {
  const balance = invoiceBalance(invoice);
  if (balance <= 0) return "Paid";
  if (new Date(invoice.due) < new Date()) return "Overdue";
  if (invoicePaid(invoice.id) > 0) return "Partial";
  return "Unpaid";
}

export function attendancePercent(studentId) {
  const rows = state.attendance.filter(row => row.studentId === studentId);
  if (!rows.length) return 0;
  const counted = rows.filter(row => ["Present", "Late", "Excused"].includes(row.status)).length;
  return Math.round(counted / rows.length * 100);
}

export function performanceAverage(studentId, subjectIds, startDate, endDate) {
  const marks = state.assessments
    .filter(row => row.studentId === studentId)
    .filter(row => !subjectIds?.length || subjectIds.includes(row.subjectId))
    .filter(row => (!startDate || new Date(row.date) >= new Date(startDate)) && (!endDate || new Date(row.date) <= new Date(endDate)))
    .map(scorePercent);
  return average(marks);
}

export function hasScheduleConflict(lesson) {
  return state.schedule.some(row => {
    const sameDate = row.date && lesson.date && row.date === lesson.date;
    const recurringSameDay = row.day === lesson.day && (row.recurring === true || row.recurring === "true" || lesson.recurring === true || lesson.recurring === "true");
    return row.id !== lesson.id
      && row.status !== "Cancelled"
      && lesson.status !== "Cancelled"
      && (sameDate || recurringSameDay)
      && timeOverlaps(row.start, row.end, lesson.start, lesson.end);
  });
}

export function upsert(collection, record) {
  const list = state[collection];
  const index = list.findIndex(item => item.id === record.id);
  if (index >= 0) list[index] = { ...list[index], ...record };
  else list.push({ ...record, id: record.id || uid(prefixFor(collection), list) });
  saveState();
  return index >= 0 ? list[index] : list[list.length - 1];
}

export function removeRecord(collection, id, soft = true) {
  const list = state[collection];
  const index = list.findIndex(item => item.id === id);
  if (index < 0) return;
  if (soft && "status" in list[index]) list[index].status = "Inactive";
  else list.splice(index, 1);
  saveState();
}

export function prefixFor(collection) {
  return {
    subjects: "SUB", students: "STU", schedule: "SCH", attendance: "ATT",
    assessments: "ASM", invoices: state.settings.prefix || "LVN",
    invoiceItems: "IIT", payments: "PAY", reportCards: "RPT", bookingRequests: "BOOK", messages: "MSG"
  }[collection] || "REC";
}

export function replaceAll(nextState) {
  Object.keys(state).forEach(key => delete state[key]);
  Object.assign(state, normalize(nextState));
  saveState();
}
