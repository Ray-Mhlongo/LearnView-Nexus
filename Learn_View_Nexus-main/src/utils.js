export const LOGO_SRC = "assets/learnview-logo.jpeg";

export function logo(cls = "logo-main") {
  return `<img class="logo ${cls}" src="${LOGO_SRC}" alt="LearnView logo">`;
}

export function icon(name) {
  return `<i data-lucide="${name}" aria-hidden="true"></i>`;
}

export function refreshIcons() {
  if (window.lucide) window.lucide.createIcons();
}

export function money(value) {
  return `R ${Number(value || 0).toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function percent(value) {
  return `${Math.round(Number(value || 0))}%`;
}

export function average(values) {
  const usable = values.map(Number).filter(value => !Number.isNaN(value));
  return usable.length ? Math.round(usable.reduce((sum, value) => sum + value, 0) / usable.length) : 0;
}

export function scorePercent(row) {
  return Math.round((Number(row.mark || 0) / Number(row.total || 1)) * 100);
}

export function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

export function uid(prefix, list) {
  return `${prefix}-${String((list?.length || 0) + 1).padStart(4, "0")}`;
}

export function initials(name = "") {
  return name.split(" ").filter(Boolean).map(part => part[0]).slice(0, 2).join("").toUpperCase() || "LV";
}

export function safeGet(storage, key) {
  try { return storage.getItem(key); } catch (error) { return null; }
}

export function safeSet(storage, key, value) {
  try { storage.setItem(key, value); } catch (error) {}
}

export function safeRemove(storage, key) {
  try { storage.removeItem(key); } catch (error) {}
}

export function toast(message) {
  let element = document.querySelector(".toast");
  if (!element) {
    element = document.createElement("div");
    element.className = "toast";
    document.body.appendChild(element);
  }
  element.textContent = message;
  element.classList.add("show");
  setTimeout(() => element.classList.remove("show"), 2800);
}

export function badge(value) {
  return `<span class="badge ${String(value).toLowerCase()}">${value}</span>`;
}

export function table(title, headings, rows) {
  const head = title ? `<div class="section-title"><h3>${title}</h3></div>` : "";
  const body = rows.length
    ? rows.map(row => `<tr>${row.map((cell, index) => `<td data-label="${headings[index]}">${cell ?? ""}</td>`).join("")}</tr>`).join("")
    : `<tr><td colspan="${headings.length}">${emptyState("No records found.")}</td></tr>`;
  return `${head}<div class="table-wrap"><table><thead><tr>${headings.map(heading => `<th>${heading}</th>`).join("")}</tr></thead><tbody>${body}</tbody></table></div>`;
}

export function emptyState(text) {
  return `<div class="empty">${logo("logo-mini")}<strong>${text}</strong></div>`;
}

export function actionMenu(section, items) {
  return `<section class="card module-menu"><div class="section-title"><h3>${section}</h3></div><div class="category-grid">${items.map(item => `<button class="category-card" onclick="${item.onclick || `setSectionActionWithHistory('${item.section || section.toLowerCase()}','${item.action}')`}">${icon(item.icon)}<span>${item.title}</span><small>${item.description || ""}</small></button>`).join("")}</div></section>`;
}

export function barChart(title, data, suffix = "") {
  const entries = Object.entries(data);
  const max = Math.max(1, ...entries.map(([, value]) => Number(value)));
  return `<div class="section-title"><h3>${title}</h3></div><div class="chart-bar">${entries.map(([label, value]) => `<div class="bar-row"><strong>${label}</strong><div class="bar"><span style="width:${Math.max(4, Number(value) / max * 100)}%"></span></div><b>${suffix === "money" ? money(value) : `${value}${suffix}`}</b></div>`).join("")}</div>`;
}

export function spark(values) {
  const max = Math.max(1, ...values.map(Number));
  return `<div class="sparkline">${values.map(value => `<span style="height:${Math.max(8, Number(value) / max * 100)}%"></span>`).join("")}</div>`;
}

export function dateInRange(date, start, end) {
  if (!date) return false;
  const value = new Date(date);
  if (start && value < new Date(start)) return false;
  if (end && value > new Date(end)) return false;
  return true;
}

export function dayNames() {
  return ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
}

export function timeOverlaps(aStart, aEnd, bStart, bEnd) {
  return aStart < bEnd && bStart < aEnd;
}

export function formData(form) {
  const data = Object.fromEntries(new FormData(form).entries());
  form.querySelectorAll("select[multiple]").forEach(select => {
    data[select.name] = Array.from(select.selectedOptions).map(option => option.value);
  });
  return data;
}

export function esc(value = "") {
  return String(value).replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[char]));
}
