import { bulkSync, loadFromSheets, syncCollection, testConnection } from "./api.js";
import { dayNames, formData, safeSet, toast, uid } from "./utils.js";
import { hasScheduleConflict, invoiceStatus, logout, login, prefixFor, removeRecord, saveState, state, ui, upsert } from "./state.js";
import { renderApp } from "./render.js";
import { askLearnViewAi } from "./ai/service.js";
import { aiSettingsForm } from "./components/ai.js";
import { studentForm } from "./components/students.js";
import { subjectForm } from "./components/subjects.js";
import { scheduleForm } from "./components/schedule.js";
import { attendanceForm } from "./components/attendance.js";
import { assessmentForm } from "./components/assessments.js";
import { invoiceForm, paymentForm } from "./components/invoices.js";
import { reportForm } from "./components/reports.js";
import { citiesForProvince } from "./data/southAfricaLocations.js";

const forms = {
  students: studentForm,
  subjects: subjectForm,
  schedule: scheduleForm,
  attendance: attendanceForm,
  assessments: assessmentForm,
  invoices: invoiceForm,
  reportCards: reportForm
};

window.ui = ui;
window.renderApp = renderApp;

function screenSnapshot() {
  return {
    view: ui.view,
    sectionAction: { ...ui.sectionAction },
    selectedStudentId: ui.selectedStudentId,
    selectedInvoiceId: ui.selectedInvoiceId,
    selectedReportId: ui.selectedReportId,
    scheduleMode: ui.scheduleMode,
    printPreview: ui.printPreview ? { ...ui.printPreview } : null,
    filters: { ...ui.filters }
  };
}

function sameScreen(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

function applyScreen(screen) {
  if (!screen) return;
  ui.view = screen.view || "dashboard";
  ui.sectionAction = { ...(screen.sectionAction || {}) };
  ui.selectedStudentId = screen.selectedStudentId || ui.selectedStudentId;
  ui.selectedInvoiceId = screen.selectedInvoiceId || ui.selectedInvoiceId;
  ui.selectedReportId = screen.selectedReportId || ui.selectedReportId;
  ui.scheduleMode = screen.scheduleMode || "week";
  ui.printPreview = screen.printPreview || null;
  ui.filters = { ...(screen.filters || {}) };
}

function pushScreen(next) {
  const current = screenSnapshot();
  if (sameScreen(current, next)) return false;
  ui.navigationStack.push(current);
  applyScreen(next);
  history.pushState({ learnview: true, screen: screenSnapshot() }, "", location.href);
  renderApp();
  return true;
}

function currentModalIsOpen() {
  return document.getElementById("modal")?.classList.contains("open");
}

function closeModalNow() {
  document.getElementById("modal")?.classList.remove("open");
}

function seedBrowserState() {
  if (!history.state?.learnview) {
    history.replaceState({ learnview: true, screen: screenSnapshot() }, "", location.href);
  }
}

window.navigateTo = view => {
  const next = screenSnapshot();
  next.view = view;
  pushScreen(next);
};

window.navigateBack = () => {
  if (currentModalIsOpen()) {
    window.closeModal();
    return;
  }
  if (ui.navigationStack.length) {
    history.back();
    return;
  }
  if (ui.printPreview) {
    const next = screenSnapshot();
    next.printPreview = null;
    history.replaceState({ learnview: true, screen: next }, "", location.href);
    applyScreen(next);
    renderApp();
    return;
  }
  if (ui.view !== "dashboard" || ui.sectionAction[ui.view]) {
    const next = screenSnapshot();
    next.view = "dashboard";
    next.sectionAction = {};
    history.replaceState({ learnview: true, screen: next }, "", location.href);
    applyScreen(next);
    renderApp();
  }
};

window.setSectionActionWithHistory = (section, action) => {
  const next = screenSnapshot();
  next.printPreview = null;
  next.sectionAction = { ...next.sectionAction, [section]: action };
  if (section === "schedule" && ["week", "month", "day", "print"].includes(action)) {
    next.scheduleMode = action === "print" ? "week" : action;
  }
  pushScreen(next);
};

window.openPrintPreview = (type, id = "") => {
  const next = screenSnapshot();
  next.printPreview = { type, id };
  pushScreen(next);
};

window.loginSubmit = event => {
  event.preventDefault();
  if (login(document.getElementById("password").value.trim())) {
    renderApp();
    seedBrowserState();
    if (state.settings.apiUrl) loadFromSheets().then(renderApp);
    toast("Signed in");
  } else {
    toast("Incorrect password");
  }
};

window.confirmLogout = () => {
  if (confirm("Log out of LearnView Nexus?")) {
    logout();
    renderApp();
  }
};

window.go = view => {
  window.navigateTo(view);
};

window.setSectionAction = (section, action) => {
  window.setSectionActionWithHistory(section, action);
};

window.setFilter = (key, value) => {
  ui.filters[key] = value;
  renderApp();
};

window.refreshStudentCities = province => {
  const select = document.getElementById("student-city");
  if (!select) return;
  select.innerHTML = citiesForProvince(province).map(city => `<option value="${city}">${city}</option>`).join("");
};

window.subjectOptionsForStudent = studentId => {
  const student = state.students.find(row => row.id === studentId);
  const preferred = student?.subjectIds?.length ? student.subjectIds : state.subjects.map(subject => subject.id);
  return preferred.map(id => state.subjects.find(subject => subject.id === id)).filter(Boolean);
};

window.refreshStudentSubjectOptions = (studentId, targetId = "subjectId") => {
  const select = document.getElementById(targetId);
  if (!select) return;
  const current = select.value;
  const subjects = window.subjectOptionsForStudent(studentId);
  select.innerHTML = subjects.map(subject => `<option value="${subject.id}" ${current === subject.id ? "selected" : ""}>${subject.name}</option>`).join("");
};

window.refreshInvoiceStudentDetails = studentId => {
  const student = state.students.find(row => row.id === studentId);
  if (!student) return;
  const setValue = (id, value) => {
    const element = document.getElementById(id);
    if (element) element.value = value || "";
  };
  setValue("invoice-guardian", student.guardian);
  setValue("invoice-parent-phone", student.parentPhone);
  setValue("invoice-parent-email", student.parentEmail);
  setValue("invoice-grade", student.grade);
  setValue("invoice-student-id", student.id);
  setValue("invoice-location", [student.suburb, student.city, student.province].filter(Boolean).join(", "));
  window.refreshStudentSubjectOptions(studentId, "invoice-subject");
};

window.refreshScheduleStudentDetails = studentId => {
  const student = state.students.find(row => row.id === studentId);
  if (!student) return;
  const panel = document.getElementById("schedule-student-summary");
  if (panel) {
    panel.innerHTML = `<strong>Student preferences</strong><br>Subjects: ${(student.subjectIds || []).map(id => state.subjects.find(subject => subject.id === id)?.name).filter(Boolean).join(", ") || "None selected"}<br>Preferred days: ${student.days || "Not specified"}<br>Preferred time: ${student.time || "Not specified"}<br>Lessons/week: ${student.frequency || "Not specified"}<br>Availability: ${student.availabilityNotes || "Not specified"}`;
  }
  window.refreshStudentSubjectOptions(studentId, "subjectId");
};

window.selectStudent = id => {
  const next = screenSnapshot();
  next.selectedStudentId = id;
  pushScreen(next);
};

window.selectInvoice = id => {
  const next = screenSnapshot();
  next.selectedInvoiceId = id;
  next.sectionAction = { ...next.sectionAction, invoices: "view" };
  pushScreen(next);
};

window.setScheduleMode = mode => {
  const next = screenSnapshot();
  next.scheduleMode = mode;
  pushScreen(next);
};

window.dragLesson = (event, id) => {
  event.dataTransfer.setData("text/plain", id);
};

window.dropLesson = async (event, day) => {
  const id = event.dataTransfer.getData("text/plain");
  const lesson = state.schedule.find(row => row.id === id);
  if (!lesson) return;

  const previous = { ...lesson };
  lesson.day = day;

  const date = new Date(lesson.date || Date.now());
  const target = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].indexOf(day);

  if (target >= 0) {
    const current = (date.getDay() + 6) % 7;
    date.setDate(date.getDate() + (target - current));
    lesson.date = date.toISOString().slice(0, 10);
  }

  if (hasScheduleConflict(lesson)) {
    Object.assign(lesson, previous);
    renderApp();
    toast("This time slot is already booked. Please choose another time.");
    return;
  }

  saveState();
  await syncCollection("schedule", "UPDATE", lesson);
  renderApp();
  toast(hasScheduleConflict(lesson) ? "Lesson moved with conflict warning" : "Lesson moved");
};

window.openModal = (title, body, onSubmit) => {
  document.getElementById("modal").innerHTML = `
    <form class="modal-card" onsubmit="${onSubmit}(event)">
      <div class="section-title">
        <h3>${title}</h3>
        <button class="btn ghost" type="button" onclick="closeModal()">Close</button>
      </div>
      ${body}
      <div class="actions">
        <button class="btn primary" type="submit">Save</button>
      </div>
    </form>
  `;
  document.getElementById("modal").classList.add("open");
  history.pushState({ learnview: true, modal: true, screen: screenSnapshot() }, "", location.href);
};

window.closeModal = preserveCurrentState => {
  if (!preserveCurrentState && history.state?.modal) {
    history.back();
    return;
  }
  closeModalNow();
  if (history.state?.modal) {
    const previousScreen = history.state.screen;
    const currentScreen = screenSnapshot();
    if (previousScreen && !sameScreen(previousScreen, currentScreen)) ui.navigationStack.push(previousScreen);
    history.replaceState({ learnview: true, screen: currentScreen }, "", location.href);
  }
};

window.openAiSettings = () => {
  window.openModal("LearnView AI Settings", aiSettingsForm(), "saveAiSettingsForm");
};

window.saveAiSettingsForm = event => {
  event.preventDefault();
  window.closeModal(true);
  renderApp();
  toast("LearnView AI settings saved");
};

window.clearAiKeySetting = () => {
  window.closeModal(true);
  renderApp();
  toast("No API key is stored inside the app");
};

window.sendAiMessage = async event => {
  event.preventDefault();

  const input = document.getElementById("ai-question");
  const question = input.value.trim();

  if (!question || ui.aiLoading) return;

  ui.aiMessages = [...(ui.aiMessages || []), { role: "user", content: question }];
  ui.aiLoading = true;
  input.value = "";
  renderApp();

  try {
    if (state.settings.apiUrl) {
      const syncResult = await loadFromSheets();

      if (!syncResult.ok) {
        throw new Error(syncResult.error || "Could not refresh LearnView data before asking AI.");
      }
    }

    const result = await askLearnViewAi(question);

    ui.aiLastContext = result.context;
    ui.aiMessages.push({
      role: "assistant",
      content: result.answer
    });
  } catch (error) {
    ui.aiMessages.push({
      role: "assistant",
      content: error.message || "LearnView AI could not generate a response right now."
    });
  } finally {
    ui.aiLoading = false;
    renderApp();
  }
};

window.clearAiChat = () => {
  ui.aiMessages = [];
  ui.aiLastContext = null;
  renderApp();
};

window.refreshAiData = async () => {
  const result = await loadFromSheets();
  renderApp();
  toast(result.ok ? "AI data source refreshed" : result.error || "Could not refresh data");
};

window.openStudent = () => openRecordEditor("students");
window.openSubject = () => openRecordEditor("subjects");
window.openSchedule = () => openRecordEditor("schedule");
window.openAttendance = () => openRecordEditor("attendance");
window.openAssessment = () => openRecordEditor("assessments");
window.openInvoice = () => openRecordEditor("invoices");
window.openReport = () => openRecordEditor("reportCards");

window.updateBookingStatus = async (id, status) => {
  const booking = state.bookingRequests.find(row => row.id === id);
  if (!booking) {
    toast("Booking request not found.");
    return;
  }

  await saveBookingRequest({ ...booking, status });
  toast(`Booking ${status.toLowerCase()}`);
};

window.convertBookingToStudent = async id => {
  const booking = state.bookingRequests.find(row => row.id === id);
  if (!booking) {
    toast("Booking request not found.");
    return;
  }

  if (booking.studentId && state.students.some(student => student.id === booking.studentId)) {
    openStudentProfile(booking.studentId);
    return;
  }

  const duplicate = duplicateStudentForBooking(booking);

  if (duplicate) {
    window.openModal(
      "Possible duplicate student",
      `<p>A student named <strong>${duplicate.name}</strong> with this parent email already exists.</p><p class="muted">Open the existing profile instead of creating a duplicate.</p><div class="actions"><button class="btn primary" type="button" onclick="openExistingStudentFromBooking('${duplicate.id}')">Open existing student</button></div>`,
      "closeOnly"
    );
    return;
  }

  const subject = subjectForBooking(booking);
  const student = {
    id: uid("STU", state.students),
    name: booking.studentName || "",
    grade: "",
    guardian: "",
    parentPhone: "",
    parentEmail: booking.parentEmail || "",
    studentPhone: "",
    province: "",
    city: "",
    suburb: "",
    subjectIds: subject ? [subject.id] : [],
    startDate: "",
    frequency: "",
    days: "",
    time: booking.preferredTime || "",
    paymentType: "",
    status: "Active",
    availabilityNotes: [booking.lessonType, booking.attendanceType, booking.preferredDate, booking.preferredTime].filter(Boolean).join(" - "),
    notes: booking.notes || ""
  };

  upsert("students", student);
  await syncCollection("students", "POST", student);
  await saveBookingRequest({ ...booking, studentId: student.id, status: "Approved" });
  openStudentProfile(student.id);
  toast("Student profile created from booking");
};

window.openExistingStudentFromBooking = studentId => {
  window.closeModal(true);
  openStudentProfile(studentId);
};

window.convertBookingToSchedule = async id => {
  const booking = state.bookingRequests.find(row => row.id === id);
  if (!booking) {
    toast("Booking request not found.");
    return;
  }

  const student = booking.studentId
    ? state.students.find(row => row.id === booking.studentId)
    : duplicateStudentForBooking(booking);

  if (!student) {
    toast("Create student profile first before creating a schedule.");
    return;
  }

  const subject = subjectForBooking(booking);
  if (!subject) {
    toast("Add a matching subject first before creating a schedule.");
    return;
  }

  if (!booking.preferredDate || !booking.preferredTime) {
    toast("Preferred date and time are required before creating a schedule.");
    return;
  }

  const lesson = {
    id: uid("SCH", state.schedule),
    studentId: student.id,
    subjectId: subject.id,
    day: dayFromDate(booking.preferredDate),
    date: booking.preferredDate,
    start: booking.preferredTime,
    end: addOneHour(booking.preferredTime),
    recurring: false,
    status: "Scheduled",
    type: booking.lessonType || "",
    location: booking.attendanceType || "",
    notes: [`Website booking ${booking.id}`, booking.notes].filter(Boolean).join(": ")
  };

  if (hasScheduleConflict(lesson)) {
    toast("This booking conflicts with an existing lesson.");
    return;
  }

  upsert("schedule", lesson);
  await syncCollection("schedule", "POST", lesson);
  await saveBookingRequest({ ...booking, studentId: student.id, scheduleId: lesson.id, status: "Approved" });
  renderApp();
  toast("Schedule lesson created from booking");
};

async function saveBookingRequest(booking) {
  upsert("bookingRequests", booking);
  await syncCollection("bookingRequests", "UPDATE", booking);
  renderApp();
}

function duplicateStudentForBooking(booking) {
  const name = normalizeText(booking.studentName);
  const email = normalizeText(booking.parentEmail);
  return state.students.find(student => normalizeText(student.name) === name && normalizeText(student.parentEmail) === email);
}

function subjectForBooking(booking) {
  const subject = normalizeText(booking.subject);
  return state.subjects.find(row => normalizeText(row.id) === subject || normalizeText(row.name) === subject);
}

function normalizeText(value) {
  return String(value || "").trim().toLowerCase();
}

function openStudentProfile(studentId) {
  const next = screenSnapshot();
  next.view = "students";
  next.sectionAction = { ...next.sectionAction, students: "profiles" };
  next.selectedStudentId = studentId;
  pushScreen(next);
}

function dayFromDate(value) {
  const date = new Date(`${value}T00:00:00`);
  return dayNames()[(date.getDay() + 6) % 7] || "";
}

function addOneHour(time) {
  const [hours, minutes] = String(time || "00:00").split(":").map(Number);
  const nextHour = (Number.isFinite(hours) ? hours + 1 : 1) % 24;
  const safeMinutes = Number.isFinite(minutes) ? minutes : 0;
  return `${String(nextHour).padStart(2, "0")}:${String(safeMinutes).padStart(2, "0")}`;
}

function openRecordEditor(collection, id) {
  const record = id ? state[collection].find(item => item.id === id) : {};

  window.openModal(
    `${id ? "Edit" : "New"} ${collection}`,
    `<input type="hidden" name="id" value="${id || ""}">${forms[collection](record || {})}`,
    `saveRecord_${collection}`
  );
}

Object.keys(forms).forEach(collection => {
  window[`saveRecord_${collection}`] = async event => {
    event.preventDefault();

    const data = formData(event.target);
    const existingId = data.id;
    const record = {
      ...data,
      id: existingId || uid(prefixFor(collection), state[collection])
    };

    let extraSync = null;

    if (collection === "schedule" && hasScheduleConflict(record)) {
      toast("This time slot is already booked. Please choose another time.");
      return;
    }

    if (collection === "invoices") {
      extraSync = saveInvoiceWithItem(record, data);
    } else {
      upsert(collection, record);
    }

    await syncCollection(collection, existingId ? "UPDATE" : "POST", record);

    if (extraSync) {
      await syncCollection("invoiceItems", extraSync.existing ? "UPDATE" : "POST", extraSync.record);
    }

    window.closeModal(true);
    renderApp();
    toast(`${collection} saved`);
  };
});

function saveInvoiceWithItem(invoice, data) {
  upsert("invoices", invoice);

  const first = state.invoiceItems.find(item => item.invoiceId === invoice.id);

  const item = {
    id: first?.id || uid("IIT", state.invoiceItems),
    invoiceId: invoice.id,
    description: data.itemDescription,
    subjectId: data.itemSubjectId,
    qty: Number(data.itemQty || 1),
    rate: Number(data.itemRate || 0)
  };

  upsert("invoiceItems", item);

  ui.selectedInvoiceId = invoice.id;
  ui.sectionAction.invoices = "view";

  return {
    record: item,
    existing: Boolean(first)
  };
}

window.editRecord = (collection, id) => openRecordEditor(collection, id);

window.deleteRecord = async (collection, id) => {
  if (!confirm("Delete or deactivate this record?")) return;

  removeRecord(collection, id);
  await syncCollection(collection, "DELETE", { id });
  renderApp();
  toast("Record updated");
};

window.openPayment = invoiceId => {
  window.openModal("Record payment", paymentForm(invoiceId), "savePayment");
};

window.savePayment = async event => {
  event.preventDefault();

  const data = formData(event.target);
  const invoice = state.invoices.find(row => row.id === data.invoiceId);

  const record = {
    ...data,
    id: uid("PAY", state.payments),
    studentId: invoice?.studentId,
    amount: Number(data.amount || 0)
  };

  upsert("payments", record);
  await syncCollection("payments", "POST", record);

  window.closeModal(true);
  renderApp();
  toast(`Payment recorded. Invoice is ${invoice ? invoiceStatus(invoice) : "updated"}.`);
};

window.composeMessage = async (studentId, type) => {
  const student = state.students.find(row => row.id === studentId);

  if (!student) {
    toast("Student not found");
    return;
  }

  const text = {
    invoice: `Hi ${student.guardian}, this is LearnView. Please review ${student.name}'s latest invoice and payment status. Current invoice reminders are available in LearnView Nexus.`,
    attendance: `Hi ${student.guardian}, attendance update for ${student.name}: please note the current attendance record in LearnView Nexus.`,
    performance: `Hi ${student.guardian}, performance update for ${student.name}: we are monitoring progress and will focus the next lesson on key improvement areas.`
  }[type];

  const record = {
    id: uid("MSG", state.messages),
    studentId,
    type,
    text,
    date: new Date().toLocaleDateString("en-ZA")
  };

  upsert("messages", record);
  await syncCollection("messages", "POST", record);

  window.openModal(
    "WhatsApp ready message",
    `<textarea readonly>${text}</textarea><p class="muted">Copy this into WhatsApp. The message is saved in the Messages log.</p>`,
    "closeOnly"
  );
};

window.closeOnly = event => {
  event.preventDefault();
  window.closeModal(true);
};

window.saveSettings = async () => {
  Object.keys(state.settings).forEach(key => {
    const element = document.getElementById(`set-${key}`);

    if (!element) return;

    state.settings[key] = element.value === "true"
      ? true
      : element.value === "false"
        ? false
        : element.value;
  });

  saveState();
  await syncCollection("settings", "UPDATE", state.settings);
  renderApp();
  toast("Settings saved");
};

window.saveApiUrl = () => {
  state.settings.apiUrl = document.getElementById("api-url").value.trim();
  saveState();
  renderApp();
  toast("API URL saved");
};

window.testApiUrl = async () => {
  state.settings.apiUrl = document.getElementById("api-url").value.trim();

  const result = await testConnection();

  renderApp();
  toast(result.ok ? "Connected to Google Sheets" : result.error);
};

window.syncNow = async () => {
  const result = await bulkSync();

  renderApp();
  toast(result.ok ? "Sync complete" : result.error);
};

window.loadSheets = async () => {
  const result = await loadFromSheets();

  renderApp();
  toast(result.ok ? "Loaded from Sheets" : result.error);
};

window.quickAdd = () => {
  const actions = {
    students: window.openStudent,
    schedule: window.openSchedule,
    attendance: window.openAttendance,
    assessments: window.openAssessment,
    invoices: window.openInvoice,
    subjects: window.openSubject,
    reports: window.openReport
  };

  (actions[ui.view] || window.openStudent)();
};

window.printCurrent = () => {
  const doc = document.querySelector(".print-preview .print-doc") || document.querySelector(".only-printable.print-doc");
  if (!doc) {
    toast("No printable document is available.");
    return;
  }

  document.body.classList.add("print-document");
  window.print();
  setTimeout(() => document.body.classList.remove("print-document"), 300);
};

window.downloadCurrentPdf = async () => {
  if (ui.pdfLoading) return;
  if (!window.html2pdf) {
    toast("PDF download failed. Please use Print and Save as PDF.");
    return;
  }

  const preview = ui.printPreview || {};
  const orientation = preview.type === "schedule" ? "landscape" : "portrait";
  const filename = window.currentPdfFilename?.() || "LearnView_Document.pdf";
  const pdfOptions = {
    margin: 6,
    filename,
    image: { type: "jpeg", quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true, backgroundColor: "#FFFFFF", scrollY: 0 },
    jsPDF: { unit: "mm", format: "a4", orientation },
    pagebreak: { mode: ["avoid-all", "css", "legacy"] }
  };

  try {
    ui.pdfLoading = true;
    renderApp();
    await new Promise(resolve => requestAnimationFrame(resolve));

    const doc = document.querySelector(".print-preview .print-doc") || document.querySelector(".only-printable.print-doc");
    if (!doc) throw new Error("No printable document is available.");

    const worker = window.html2pdf().set(pdfOptions).from(doc).toPdf();
    const blob = await worker.outputPdf("blob");
    await savePdfBlob(blob, filename);
    toast("PDF downloaded");
  } catch {
    toast("PDF download failed. Please use Print and Save as PDF.");
  } finally {
    ui.pdfLoading = false;
    renderApp();
  }
};

async function savePdfBlob(blob, filename) {
  const plugins = window.Capacitor?.Plugins || {};
  const isNative = window.Capacitor?.isNativePlatform?.();

  if (isNative && plugins.Filesystem) {
    try {
      const uri = await savePdfNatively(plugins.Filesystem, blob, filename);
      if (plugins.Share) {
        try {
          await plugins.Share.share({
            title: filename,
            text: "LearnView PDF document",
            files: [uri],
            dialogTitle: "Save or share PDF"
          });
        } catch {}
      }
      return;
    } catch {
      downloadBlob(blob, filename);
      return;
    }
  }

  downloadBlob(blob, filename);
}

async function savePdfNatively(filesystem, blob, filename) {
  await filesystem.requestPermissions?.();
  const data = await blobToBase64(blob);
  const result = await filesystem.writeFile({
    path: `LearnView/${filename}`,
    data,
    directory: "DOCUMENTS",
    recursive: true
  });
  return result.uri;
}

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(String(reader.result || "").split(",")[1] || "");
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1200);
}

window.addEventListener("popstate", event => {
  if (currentModalIsOpen()) {
    closeModalNow();
    if (event.state?.screen) applyScreen(event.state.screen);
    renderApp();
    return;
  }

  if (document.body.classList.contains("print-document")) {
    document.body.classList.remove("print-document");
  }

  if (event.state?.learnview && event.state.screen) {
    if (ui.navigationStack.length) ui.navigationStack.pop();
    applyScreen(event.state.screen);
    renderApp();
    return;
  }

  if (ui.view !== "dashboard" || ui.sectionAction[ui.view]) {
    const next = screenSnapshot();
    next.view = "dashboard";
    next.sectionAction = {};
    history.replaceState({ learnview: true, screen: next }, "", location.href);
    applyScreen(next);
    renderApp();
  }
});

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("./sw.js").catch(() => {});
}

try {
  const systemBars = window.Capacitor?.Plugins?.SystemBars;
  systemBars?.show?.();
  systemBars?.setStyle?.({ style: "LIGHT" });

  const statusBar = window.Capacitor?.Plugins?.StatusBar;
  statusBar?.setOverlaysWebView?.({ overlay: false });
  statusBar?.show?.();
  statusBar?.setStyle?.({ style: "LIGHT" });
  statusBar?.setBackgroundColor?.({ color: "#FFFFFF" });
} catch {}

renderApp();
seedBrowserState();

if (state.settings.apiUrl) {
  loadFromSheets().then(renderApp);
}
