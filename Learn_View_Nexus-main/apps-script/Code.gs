const API_VERSION = "2026-06-03";

const SCHEMA = {
  Settings: ["ID", "businessName", "tagline", "tutorName", "phone", "email", "address", "banking", "rate", "prefix", "terms", "availability", "apiUrl", "adminPassword", "setupComplete", "CreatedAt", "UpdatedAt"],
  Subjects: ["id", "name", "description", "gradeRange", "price", "status", "CreatedAt", "UpdatedAt"],
  Students: ["id", "name", "grade", "guardian", "parentPhone", "parentEmail", "studentPhone", "province", "city", "suburb", "subjectIds", "startDate", "frequency", "days", "time", "paymentType", "status", "availabilityNotes", "notes", "CreatedAt", "UpdatedAt"],
  Schedule: ["id", "studentId", "subjectId", "day", "date", "start", "end", "recurring", "status", "type", "location", "notes", "CreatedAt", "UpdatedAt"],
  Attendance: ["id", "studentId", "subjectId", "scheduleId", "date", "status", "notes", "CreatedAt", "UpdatedAt"],
  Assessments: ["id", "studentId", "subjectId", "type", "name", "date", "term", "mark", "total", "comment", "CreatedAt", "UpdatedAt"],
  Invoices: ["id", "date", "due", "studentId", "guardian", "discount", "notes", "CreatedAt", "UpdatedAt"],
  InvoiceItems: ["id", "invoiceId", "subjectId", "description", "qty", "rate", "CreatedAt", "UpdatedAt"],
  Payments: ["id", "invoiceId", "studentId", "date", "amount", "method", "reference", "CreatedAt", "UpdatedAt"],
  ReportCards: ["id", "studentId", "periodType", "periodLabel", "startDate", "endDate", "subjectIds", "tutorComments", "subjectComments", "date", "CreatedAt", "UpdatedAt"],
  BookingRequests: ["id", "submittedAt", "parentEmail", "studentName", "subject", "lessonType", "attendanceType", "preferredDate", "preferredTime", "notes", "status", "studentId", "scheduleId", "CreatedAt", "UpdatedAt"],
  Messages: ["id", "studentId", "type", "text", "date", "CreatedAt", "UpdatedAt"]
};

const PREFIXES = {
  Subjects: "SUB",
  Students: "STU",
  Schedule: "SCH",
  Attendance: "ATT",
  Assessments: "ASM",
  Invoices: "LVN",
  InvoiceItems: "IIT",
  Payments: "PAY",
  ReportCards: "RPT",
  BookingRequests: "BOOK",
  Messages: "MSG"
};

const REQUIRED = {
  Subjects: ["name"],
  Students: ["name"],
  Schedule: ["studentId", "subjectId", "date", "start", "end"],
  Attendance: ["studentId", "subjectId", "date", "status"],
  Assessments: ["studentId", "subjectId", "name", "mark", "total"],
  Invoices: ["studentId", "date", "due"],
  InvoiceItems: ["invoiceId", "description", "qty", "rate"],
  Payments: ["invoiceId", "amount"],
  ReportCards: ["studentId"],
  BookingRequests: ["parentEmail", "studentName", "subject", "preferredDate", "preferredTime"]
};

function doGet(e) {
  try {
    setupSheets();
    const params = e && e.parameter ? e.parameter : {};
    if (params.sheet) {
      const sheetName = canonicalSheetName(params.sheet);
      const data = params.id ? getRecord(sheetName, params.id) : listRecords(sheetName);
      return json({ ok: true, version: API_VERSION, sheet: sheetName, data: data });
    }
    return json({
      ok: true,
      version: API_VERSION,
      message: "LearnView Nexus Apps Script API is online.",
      sheets: Object.keys(SCHEMA)
    });
  } catch (error) {
    return jsonError(error);
  }
}

function doPost(e) {
  try {
    const request = parseRequest(e);
    setupSheets();
    return json(route(request));
  } catch (error) {
    return jsonError(error);
  }
}

function route(request) {
  const action = normalizeAction(request.action);
  if (action === "TEST") return { ok: true, version: API_VERSION, message: "Connected", timestamp: nowIso() };
  if (action === "INIT") return { ok: true, version: API_VERSION, sheets: setupSheets(), data: bulkRead() };
  if (action === "SCHEMA") return { ok: true, version: API_VERSION, schema: SCHEMA };
  if (action === "BULK_READ") return { ok: true, version: API_VERSION, data: bulkRead() };
  if (action === "BULK_SYNC") return withLock(function () {
    return { ok: true, version: API_VERSION, data: bulkSync(request.payload || {}) };
  });

  const sheetName = canonicalSheetName(request.sheet);
  const payload = request.payload || {};

  if (action === "READ") return { ok: true, version: API_VERSION, sheet: sheetName, data: payload.id ? getRecord(sheetName, payload.id) : listRecords(sheetName) };
  if (action === "CREATE") return withLock(function () {
    return { ok: true, version: API_VERSION, sheet: sheetName, data: createRecord(sheetName, payload) };
  });
  if (action === "UPDATE") return withLock(function () {
    return { ok: true, version: API_VERSION, sheet: sheetName, data: updateRecord(sheetName, payload) };
  });
  if (action === "UPSERT") return withLock(function () {
    return { ok: true, version: API_VERSION, sheet: sheetName, data: upsertRecord(sheetName, payload) };
  });
  if (action === "DELETE") return withLock(function () {
    return { ok: true, version: API_VERSION, sheet: sheetName, data: deleteRecord(sheetName, payload) };
  });

  throw new Error("Unsupported action: " + request.action);
}

function setupSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  return Object.keys(SCHEMA).map(function (name) {
    let sheet = ss.getSheetByName(name);
    if (!sheet) sheet = ss.insertSheet(name);
    repairHeaders(sheet, SCHEMA[name]);
    freezeAndResize(sheet);
    return name;
  });
}

function repairHeaders(sheet, expected) {
  const currentWidth = Math.max(sheet.getLastColumn(), expected.length, 1);
  const existing = sheet.getRange(1, 1, 1, currentWidth).getValues()[0].filter(function (header) {
    return header !== "";
  });
  const headers = existing.length ? existing.slice() : [];
  expected.forEach(function (header) {
    if (headers.indexOf(header) === -1) headers.push(header);
  });
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
}

function freezeAndResize(sheet) {
  sheet.setFrozenRows(1);
  const lastColumn = sheet.getLastColumn();
  if (lastColumn > 0) sheet.autoResizeColumns(1, lastColumn);
}

function bulkRead() {
  const data = {};
  Object.keys(SCHEMA).forEach(function (sheetName) {
    data[sheetName] = listRecords(sheetName);
  });
  return data;
}

function bulkSync(payload) {
  Object.keys(SCHEMA).forEach(function (sheetName) {
    if (!Object.prototype.hasOwnProperty.call(payload, sheetName)) return;
    const rows = Array.isArray(payload[sheetName]) ? payload[sheetName] : [];
    replaceSheetData(sheetName, rows);
  });
  return bulkRead();
}

function replaceSheetData(sheetName, rows) {
  const sheet = sheetFor(sheetName);
  clearRows(sheet);
  rows.forEach(function (row) {
    createRecord(sheetName, row, true);
  });
}

function listRecords(sheetName) {
  const sheet = sheetFor(sheetName);
  const values = sheet.getDataRange().getValues();
  if (values.length <= 1) return [];
  const headers = values[0];
  return values.slice(1).filter(rowHasData).map(function (row) {
    return rowToObject(headers, row);
  });
}

function getRecord(sheetName, id) {
  const found = findRecord(sheetName, id);
  if (!found) throw new Error(sheetName + " record not found: " + id);
  return rowToObject(found.headers, found.row);
}

function createRecord(sheetName, payload, preserveTimestamps) {
  validatePayload(sheetName, payload, false);
  const sheet = sheetFor(sheetName);
  const headers = headersFor(sheet);
  const now = new Date();
  const record = normalizeRecord(sheetName, payload);
  const idHeader = idHeaderFor(sheetName);

  if (!record[idHeader]) record[idHeader] = sheetName === "Settings" ? "settings" : nextId(sheetName);
  if (findRecord(sheetName, record[idHeader])) throw new Error(sheetName + " record already exists: " + record[idHeader]);
  if (!preserveTimestamps || !record.CreatedAt) record.CreatedAt = now;
  record.UpdatedAt = now;

  sheet.appendRow(headers.map(function (header) {
    return serialize(record[header]);
  }));
  return recordForResponse(record);
}

function updateRecord(sheetName, payload) {
  validatePayload(sheetName, payload, true);
  const idHeader = idHeaderFor(sheetName);
  const id = payload[idHeader] || payload.id || (sheetName === "Settings" ? "settings" : "");
  if (!id) throw new Error(idHeader + " is required for update");

  const found = findRecord(sheetName, id);
  if (!found) return createRecord(sheetName, payload);

  const record = normalizeRecord(sheetName, payload);
  found.headers.forEach(function (header, index) {
    if (header === "CreatedAt") return;
    if (header === "UpdatedAt") {
      found.sheet.getRange(found.rowNumber, index + 1).setValue(new Date());
      return;
    }
    if (Object.prototype.hasOwnProperty.call(record, header)) {
      found.sheet.getRange(found.rowNumber, index + 1).setValue(serialize(record[header]));
    }
  });
  return getRecord(sheetName, id);
}

function upsertRecord(sheetName, payload) {
  const idHeader = idHeaderFor(sheetName);
  const id = payload[idHeader] || payload.id || (sheetName === "Settings" ? "settings" : "");
  return id && findRecord(sheetName, id) ? updateRecord(sheetName, payload) : createRecord(sheetName, payload);
}

function deleteRecord(sheetName, payload) {
  const idHeader = idHeaderFor(sheetName);
  const id = payload[idHeader] || payload.id;
  if (!id) throw new Error(idHeader + " is required for delete");

  const found = findRecord(sheetName, id);
  if (!found) throw new Error(sheetName + " record not found: " + id);

  const statusIndex = found.headers.indexOf("status");
  if (statusIndex >= 0) {
    found.sheet.getRange(found.rowNumber, statusIndex + 1).setValue("Inactive");
    const updatedAtIndex = found.headers.indexOf("UpdatedAt");
    if (updatedAtIndex >= 0) found.sheet.getRange(found.rowNumber, updatedAtIndex + 1).setValue(new Date());
    return getRecord(sheetName, id);
  }

  found.sheet.deleteRow(found.rowNumber);
  return { id: id, deleted: true };
}

function findRecord(sheetName, id) {
  const sheet = sheetFor(sheetName);
  const values = sheet.getDataRange().getValues();
  if (values.length <= 1) return null;
  const headers = values[0];
  const idHeader = idHeaderFor(sheetName);
  const idIndex = headers.indexOf(idHeader);
  if (idIndex < 0) throw new Error(sheetName + " is missing ID column: " + idHeader);

  for (let index = 1; index < values.length; index++) {
    if (String(values[index][idIndex]) === String(id)) {
      return { sheet: sheet, headers: headers, row: values[index], rowNumber: index + 1 };
    }
  }
  return null;
}

function normalizeRecord(sheetName, payload) {
  const record = Object.assign({}, payload);
  if (sheetName === "Settings") {
    record.ID = record.ID || record.id || "settings";
    delete record.id;
  }
  if (sheetName !== "Settings" && record.ID && !record.id) {
    record.id = record.ID;
    delete record.ID;
  }
  return record;
}

function validatePayload(sheetName, payload, partial) {
  if (!payload || typeof payload !== "object") throw new Error("payload must be an object");
  const required = REQUIRED[sheetName] || [];
  required.forEach(function (field) {
    if (!partial && isBlank(payload[field])) throw new Error(sheetName + " requires " + field);
  });
}

function nextId(sheetName) {
  const prefix = sheetName === "Invoices" ? invoicePrefix() : PREFIXES[sheetName] || "REC";
  const sheet = sheetFor(sheetName);
  const headers = headersFor(sheet);
  const idIndex = headers.indexOf(idHeaderFor(sheetName));
  const values = sheet.getLastRow() > 1 ? sheet.getRange(2, idIndex + 1, sheet.getLastRow() - 1, 1).getValues() : [];
  const highest = values.reduce(function (max, row) {
    const value = String(row[0] || "");
    const match = value.match(/(\d+)$/);
    return match ? Math.max(max, Number(match[1])) : max;
  }, 0);
  return prefix + "-" + String(highest + 1).padStart(4, "0");
}

function invoicePrefix() {
  try {
    const settings = listRecords("Settings")[0] || {};
    return settings.prefix || PREFIXES.Invoices;
  } catch (error) {
    return PREFIXES.Invoices;
  }
}

function sheetFor(sheetName) {
  const name = canonicalSheetName(sheetName);
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
  if (!sheet) throw new Error("Sheet not found: " + name + ". Run INIT first.");
  return sheet;
}

function canonicalSheetName(sheetName) {
  const normalized = String(sheetName || "").trim().toLowerCase();
  const found = Object.keys(SCHEMA).find(function (name) {
    return name.toLowerCase() === normalized;
  });
  if (!found) throw new Error("Unknown sheet: " + sheetName);
  return found;
}

function headersFor(sheet) {
  return sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
}

function idHeaderFor(sheetName) {
  return sheetName === "Settings" ? "ID" : "id";
}

function clearRows(sheet) {
  const lastRow = sheet.getLastRow();
  const lastColumn = sheet.getLastColumn();
  if (lastRow > 1) sheet.getRange(2, 1, lastRow - 1, lastColumn).clearContent();
}

function rowToObject(headers, row) {
  const record = {};
  headers.forEach(function (header, index) {
    if (!header) return;
    record[header] = parseCell(row[index]);
  });
  return recordForResponse(record);
}

function recordForResponse(record) {
  const out = Object.assign({}, record);
  ["CreatedAt", "UpdatedAt"].forEach(function (field) {
    if (out[field] instanceof Date) out[field] = out[field].toISOString();
  });
  return out;
}

function rowHasData(row) {
  return row.some(function (value) {
    return value !== "" && value !== null;
  });
}

function normalizeAction(action) {
  const value = String(action || "READ").trim().toUpperCase();
  const aliases = {
    GET: "READ",
    LIST: "READ",
    READ_ONE: "READ",
    POST: "CREATE",
    CREATE: "CREATE",
    ADD: "CREATE",
    PUT: "UPDATE",
    PATCH: "UPDATE",
    UPDATE: "UPDATE",
    UPSERT: "UPSERT",
    DELETE: "DELETE",
    REMOVE: "DELETE",
    TEST: "TEST",
    INIT: "INIT",
    SETUP: "INIT",
    SCHEMA: "SCHEMA",
    BULK_READ: "BULK_READ",
    BULK_SYNC: "BULK_SYNC"
  };
  return aliases[value] || value;
}

function parseRequest(e) {
  if (!e || !e.postData || !e.postData.contents) return {};
  return JSON.parse(e.postData.contents);
}

function serialize(value) {
  if (value === undefined || value === null) return "";
  if (value instanceof Date) return value;
  if (Array.isArray(value) || typeof value === "object") return JSON.stringify(value);
  return value;
}

function parseCell(value) {
  if (value instanceof Date) return value.toISOString();
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  if (!trimmed) return "";
  if ((trimmed.charAt(0) === "[" && trimmed.charAt(trimmed.length - 1) === "]") || (trimmed.charAt(0) === "{" && trimmed.charAt(trimmed.length - 1) === "}")) {
    try {
      return JSON.parse(trimmed);
    } catch (error) {
      return value;
    }
  }
  if (trimmed === "true") return true;
  if (trimmed === "false") return false;
  return value;
}

function isBlank(value) {
  return value === undefined || value === null || String(value).trim() === "";
}

function withLock(callback) {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    return callback();
  } finally {
    lock.releaseLock();
  }
}

function json(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}

function jsonError(error) {
  return json({ ok: false, version: API_VERSION, error: error.message || String(error) });
}

function nowIso() {
  return new Date().toISOString();
}
