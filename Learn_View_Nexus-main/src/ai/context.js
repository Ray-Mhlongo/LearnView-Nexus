import { average, dateInRange, scorePercent } from "../utils.js";
import {
  attendancePercent,
  invoiceBalance,
  invoiceItems,
  invoicePaid,
  invoiceStatus,
  invoiceTotal,
  state,
  studentName,
  subjectName
} from "../state.js";

export const SYSTEM_PROMPT = `You are LearnView AI.

You are the built in business assistant for LearnView.

Your job is to analyse students, booking requests, schedules, attendance, assessments, invoices, payments, report cards, and tutoring operations.

Always answer using the provided LearnView data.

Never invent students, booking requests, marks, invoices, attendance records, schedules, report cards, guardians, or payments.

If information is unavailable, clearly state what data is missing.

When summarising the business:

Include:

Business overview
Student count
Subject count
Attendance insights
Academic performance insights
Revenue collected
Outstanding balances
Upcoming lessons
Business recommendations

When discussing students:

Include attendance percentage
Assessment average
Subjects enrolled
Performance concerns
Improvement recommendations

When discussing finances:

Calculate totals
Identify overdue invoices
Identify outstanding balances
Suggest follow up actions

Be concise but professional.

Use headings and bullet points.

You may use a few relevant emojis to make responses friendly and easy to scan, but keep the tone professional and suitable for a tutoring business.

Always behave like a tutoring operations analyst, not a generic chatbot.

Never say "As an AI language model."

Never discuss your model or provider.

Never discuss AI providers, model names, routing services, or technical infrastructure.

Focus only on LearnView data.`;

const TOPICS = {
  students: ["student", "learner", "parent", "guardian", "profile", "contact", "grade", "subject"],
  attendance: ["attendance", "present", "absent", "late", "excused", "missed", "attend"],
  assessments: ["assessment", "mark", "marks", "result", "score", "test", "quiz", "average", "performance", "progress"],
  bookings: ["booking", "request", "parent enquiry", "session request", "website form", "approve", "reject"],
  schedules: ["schedule", "lesson", "calendar", "agenda", "timetable", "availability", "time", "booking"],
  invoices: ["invoice", "unpaid", "outstanding", "balance", "due", "overdue", "revenue", "income", "billing"],
  payments: ["payment", "paid", "eft", "cash", "receipt"],
  reportCards: ["report", "card", "term", "summary"],
  business: ["business", "setting", "operation", "tutor", "bank", "contact", "activity", "draft", "message", "whatsapp", "reminder", "notification"]
};

export function buildRelevantContext(question = "") {
  const topics = relevantTopics(question);
  const requested = topics.length ? topics : ["business"];
  const data = {};

  if (requested.includes("students")) data.students = buildStudents();
  if (requested.includes("attendance")) data.attendance = buildAttendance();
  if (requested.includes("assessments")) data.assessments = buildAssessments();
  if (requested.includes("bookings")) data.bookingRequests = buildBookingRequests();
  if (requested.includes("schedules")) data.schedules = buildSchedules();
  if (requested.includes("invoices")) data.invoices = buildInvoices();
  if (requested.includes("payments")) data.payments = buildPayments();
  if (requested.includes("reportCards")) data.reportCards = buildReportCards();
  if (requested.includes("business")) data.business = buildBusinessSummary();

  if (mentionsPerformance(question) && !data.assessments) data.assessments = buildAssessments();
  if (mentionsPerformance(question) && !data.attendance) data.attendance = buildAttendance();
  if (mentionsMoney(question) && !data.payments) data.payments = buildPayments();
  if (mentionsMoney(question) && !data.invoices) data.invoices = buildInvoices();

  return {
    generatedAt: new Date().toISOString(),
    syncStatus: state.meta.syncStatus,
    topics: Object.keys(data),
    data,
    hasData: Object.values(data).some(value => Array.isArray(value) ? value.length > 0 : Boolean(value && Object.keys(value).length))
  };
}

function relevantTopics(question) {
  const text = question.toLowerCase();
  return Object.entries(TOPICS)
    .filter(([, words]) => words.some(word => text.includes(word)))
    .map(([topic]) => topic);
}

function mentionsPerformance(question) {
  return ["performance", "progress", "mark", "assessment", "report", "average"].some(word => question.toLowerCase().includes(word));
}

function mentionsMoney(question) {
  return ["invoice", "payment", "paid", "unpaid", "balance", "due", "revenue", "income"].some(word => question.toLowerCase().includes(word));
}

function buildStudents() {
  return state.students.map(student => ({
    id: student.id,
    name: student.name,
    grade: student.grade,
    status: student.status,
    guardian: student.guardian,
    parentPhone: student.parentPhone,
    parentEmail: student.parentEmail,
    subjects: (student.subjectIds || []).map(subjectName),
    startDate: student.startDate,
    frequency: student.frequency,
    days: student.days,
    preferredTime: student.time,
    attendancePercent: attendancePercent(student.id),
    notes: student.notes || ""
  }));
}

function buildAttendance() {
  return state.attendance.map(row => ({
    id: row.id,
    studentId: row.studentId,
    studentName: studentName(row.studentId),
    subject: subjectName(row.subjectId),
    date: row.date,
    status: row.status,
    notes: row.notes || ""
  }));
}

function buildAssessments() {
  return state.assessments.map(row => ({
    id: row.id,
    studentId: row.studentId,
    studentName: studentName(row.studentId),
    subject: subjectName(row.subjectId),
    type: row.type,
    name: row.name,
    date: row.date,
    term: row.term,
    mark: Number(row.mark || 0),
    total: Number(row.total || 0),
    percent: scorePercent(row),
    comment: row.comment || ""
  }));
}

function buildSchedules() {
  return state.schedule.map(row => ({
    id: row.id,
    studentId: row.studentId,
    studentName: studentName(row.studentId),
    subject: subjectName(row.subjectId),
    day: row.day,
    date: row.date,
    start: row.start,
    end: row.end,
    recurring: Boolean(row.recurring),
    status: row.status,
    type: row.type,
    location: row.location,
    notes: row.notes || ""
  }));
}

function buildBookingRequests() {
  return (state.bookingRequests || []).map(row => ({
    id: row.id,
    submittedAt: row.submittedAt,
    parentEmail: row.parentEmail,
    studentName: row.studentName,
    subject: row.subject,
    lessonType: row.lessonType,
    attendanceType: row.attendanceType,
    preferredDate: row.preferredDate,
    preferredTime: row.preferredTime,
    notes: row.notes || "",
    status: row.status || "Pending",
    studentId: row.studentId || "",
    scheduleId: row.scheduleId || ""
  }));
}

function buildInvoices() {
  return state.invoices.map(invoice => ({
    id: invoice.id,
    studentId: invoice.studentId,
    studentName: studentName(invoice.studentId),
    guardian: invoice.guardian,
    date: invoice.date,
    due: invoice.due,
    status: invoiceStatus(invoice),
    total: invoiceTotal(invoice),
    paid: invoicePaid(invoice.id),
    balance: invoiceBalance(invoice),
    discount: Number(invoice.discount || 0),
    notes: invoice.notes || "",
    items: invoiceItems(invoice.id).map(item => ({
      description: item.description,
      subject: subjectName(item.subjectId),
      qty: Number(item.qty || 0),
      rate: Number(item.rate || 0),
      amount: Number(item.qty || 0) * Number(item.rate || 0)
    }))
  }));
}

function buildPayments() {
  return state.payments.map(payment => ({
    id: payment.id,
    invoiceId: payment.invoiceId,
    studentId: payment.studentId,
    studentName: studentName(payment.studentId),
    date: payment.date,
    amount: Number(payment.amount || 0),
    method: payment.method,
    reference: payment.reference || ""
  }));
}

function buildReportCards() {
  return state.reportCards.map(report => {
    const student = state.students.find(row => row.id === report.studentId);
    const subjectIds = report.subjectIds?.length ? report.subjectIds : student?.subjectIds || [];
    const marks = state.assessments
      .filter(mark => mark.studentId === report.studentId)
      .filter(mark => subjectIds.includes(mark.subjectId))
      .filter(mark => dateInRange(mark.date, report.startDate, report.endDate));
    return {
      id: report.id,
      studentId: report.studentId,
      studentName: studentName(report.studentId),
      periodType: report.periodType,
      periodLabel: report.periodLabel,
      startDate: report.startDate,
      endDate: report.endDate,
      subjects: subjectIds.map(subjectName),
      overallAverage: average(marks.map(scorePercent)),
      attendancePercent: attendancePercent(report.studentId),
      tutorComments: report.tutorComments || "",
      date: report.date
    };
  });
}

function buildBusinessSummary() {
  const invoices = buildInvoices();
  const bookingRequests = buildBookingRequests();
  return {
    businessName: state.settings.businessName,
    tutorName: state.settings.tutorName,
    syncStatus: state.meta.syncStatus,
    lastSync: state.meta.lastSync || "",
    counts: {
      students: state.students.length,
      subjects: state.subjects.length,
      lessons: state.schedule.length,
      attendanceRecords: state.attendance.length,
      assessments: state.assessments.length,
      invoices: state.invoices.length,
      payments: state.payments.length,
      reportCards: state.reportCards.length,
      bookingRequests: (state.bookingRequests || []).length
    },
    invoiceSummary: {
      totalBilled: invoices.reduce((sum, invoice) => sum + invoice.total, 0),
      totalPaid: invoices.reduce((sum, invoice) => sum + invoice.paid, 0),
      totalOutstanding: invoices.reduce((sum, invoice) => sum + invoice.balance, 0),
      unpaidInvoiceIds: invoices.filter(invoice => invoice.balance > 0).map(invoice => invoice.id)
    },
    bookingSummary: {
      pending: bookingRequests.filter(row => row.status === "Pending").length,
      approved: bookingRequests.filter(row => row.status === "Approved").length,
      rejected: bookingRequests.filter(row => row.status === "Rejected").length,
      upcomingPreferredDates: bookingRequests
        .filter(row => row.status !== "Rejected" && row.preferredDate)
        .map(row => ({ id: row.id, studentName: row.studentName, subject: row.subject, preferredDate: row.preferredDate, preferredTime: row.preferredTime }))
    },
    contact: {
      phone: state.settings.phone,
      email: state.settings.email,
      address: state.settings.address
    }
  };
}
