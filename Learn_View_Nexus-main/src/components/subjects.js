import { badge, table } from "../utils.js";
import { money } from "../utils.js";
import { state } from "../state.js";

export function subjects() {
  return `<section class="card"><div class="section-title"><h3>Subject catalogue</h3><button class="btn primary" onclick="openSubject()">Add subject</button></div>${table("", ["Name", "Description", "Grades", "Default price", "Status", ""], state.subjects.map(subject => [subject.name, subject.description, subject.gradeRange, money(subject.price), badge(subject.status), `<div class="actions"><button class="btn ghost" onclick="editRecord('subjects','${subject.id}')">Edit</button><button class="btn danger" onclick="deleteRecord('subjects','${subject.id}')">Deactivate</button></div>`]))}</section>`;
}

export function subjectForm(record = {}) {
  return `<div class="form-grid"><label class="field"><span>Subject name</span><input name="name" required value="${record.name || ""}"></label><label class="field"><span>Description</span><input name="description" value="${record.description || ""}"></label><label class="field"><span>Grade range</span><input name="gradeRange" value="${record.gradeRange || ""}"></label><label class="field"><span>Default price</span><input name="price" type="number" value="${record.price || ""}"></label><label class="field"><span>Status</span><select name="status"><option ${record.status === "Active" ? "selected" : ""}>Active</option><option ${record.status === "Inactive" ? "selected" : ""}>Inactive</option></select></label></div>`;
}
