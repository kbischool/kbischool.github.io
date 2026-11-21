/** Notices, lesson notes, assignments and timetables: staff screens and the read/submit panels for parents and students. */
import { h, mount, toast, empty, skeleton, field, formDialog, confirmDialog } from "../lib/dom.js";
import { state, roleOf } from "../lib/store.js";
import { studentsOnce } from "../lib/data.js";
import { isEnrolled, classKey } from "../lib/students.js";
import { subjectsForClass, armsOf } from "../lib/structure.js";
import { classLabel, friendlyAuthError } from "./common.js";
import * as C from "../lib/classroom.js";

const isAdmin = () => roleOf() === "owner" || roleOf() === "admin";
const when = (t) => (t?.seconds ? new Date(t.seconds * 1000).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" }) : "just now");
const sel = (id, opts, value) => { const s = h("select", { id }, opts.map(([v, l]) => h("option", { value: v, selected: v === value }, l))); return s; };
const links = (list) => (list?.length ? h("div", { class: "hint" }, list.map((u) => h("a", { href: u, target: "_blank", rel: "noopener noreferrer", class: "lnk" }, u.replace(/^https?:\/\//, "").slice(0, 48), " "))) : null);
const bodyText = (t) => h("div", { class: "prose" }, String(t || "").split("\n").map((l) => h("p", {}, l)));

/** Classes and subjects this person may work on: everything for the admin, assigned ones for a teacher. */
export function staffOptions() {
  const s = state.school;
  if (isAdmin()) return s.structure.classes.flatMap((c) => armsOf(c).flatMap((a) => subjectsForClass(s.structure, c.name).map((sub) => ({ subject: sub, key: classKey(c.name, a) }))));
  return (state.profile.assignmentsList || []).map((a) => ({ subject: a.subject, key: classKey(a.class, a.arm) }));
}
const allClassKeys = () => { const s = state.school; return s.structure.classes.flatMap((c) => armsOf(c).map((a) => classKey(c.name, a))); };
const myClassKeys = () => (isAdmin() ? allClassKeys() : [...new Set([...(state.profile.classKeys || []), state.profile.classTeacherKey].filter(Boolean))]);

/** Class + subject chooser shared by the notes and assignments screens. */
function picker(opts, onChange) {
  const keys = [...new Set(opts.map((o) => o.key))]; const cur = { key: keys[0], subject: opts[0].subject };
  const host = h("div", { class: "pickers2" });
  const draw = () => { const subs = [...new Set(opts.filter((o) => o.key === cur.key).map((o) => o.subject))]; if (!subs.includes(cur.subject)) cur.subject = subs[0];
    const k = sel("pk", keys.map((x) => [x, classLabel(x)]), cur.key), s = sel("ps", subs.map((x) => [x, x]), cur.subject);
    k.onchange = () => { cur.key = k.value; draw(); onChange(cur); }; s.onchange = () => { cur.subject = s.value; onChange(cur); };
    mount(host, field("Class", k), field("Subject", s)); };
  draw(); return { el: host, cur };
}

// ---------- notices ----------
export async function noticesView(host) {
  mount(host, h("h1", {}, "Notices"), skeleton(3));
  try {
    const list = C.visibleNotices(await C.listNotices(), { role: roleOf(), classKeys: myClassKeys() });
    mount(host, h("div", { class: "toolbar" }, h("h1", { class: "grow" }, "Notices"), h("button", { class: "btn btn-primary", onclick: () => noticeDialog(() => noticesView(host)) }, "Post a notice")),
      list.length ? h("div", { class: "list" }, list.map((n) => noticeCard(n, () => noticesView(host), true))) : empty("No notices yet", "Post a notice to tell parents, students or teachers something important."));
  } catch (e) { mount(host, h("h1", {}, "Notices"), empty("Cannot load notices", friendlyAuthError(e))); }
}
const AUD = [["all", "Everyone"], ["parents", "Parents"], ["students", "Students"], ["teachers", "Teachers"]];
export function noticeCard(n, refresh, canEdit) {
  const mine = canEdit && (isAdmin() || n.createdBy === state.user?.uid);
  return h("article", { class: "row-card notice" }, h("div", {}, h("strong", {}, n.pinned ? "📌 " : "", n.title), h("div", { class: "hint" }, `${when(n.createdAt)} · ${n.createdByName || "School"}${n.classKey ? ` · ${classLabel(n.classKey)}` : ""} · ${AUD.find((a) => a[0] === n.audience)?.[1] || "Everyone"}`), bodyText(n.body)),
    mine ? h("button", { class: "btn btn-sm btn-danger-quiet", onclick: async () => { if (await confirmDialog({ title: "Delete this notice?", confirmLabel: "Delete", danger: true })) { await C.removeNotice(n.id); toast("Notice deleted"); refresh(); } } }, "Delete") : null);
}
function noticeDialog(done) {
  formDialog("Post a notice", (close) => {
    const keys = myClassKeys(); const out = h("p", { role: "alert", hidden: true });
    const title = h("input", { id: "nt", maxlength: 120 }), body = h("textarea", { id: "nb", rows: 5, maxlength: 2000 });
    const aud = sel("na", AUD, "all"), cls = sel("nc", [...(isAdmin() ? [["", "Whole school"]] : []), ...keys.map((k) => [k, classLabel(k)])], isAdmin() ? "" : keys[0]); const pin = h("input", { type: "checkbox", id: "np" });
    return h("form", { novalidate: true, onsubmit: async (e) => { e.preventDefault(); if (!title.value.trim() || !body.value.trim()) { out.hidden = false; out.textContent = "Add a title and the message."; return; }
      try { await C.postNotice({ title: title.value.trim(), body: body.value.trim(), audience: aud.value, classKey: cls.value || null, pinned: isAdmin() && pin.checked }); toast("Notice posted"); close(); done(); } catch (err) { out.hidden = false; out.textContent = friendlyAuthError(err); } } },
      field("Title", title), field("Message", body), field("Who should see it", aud), field("Class", cls, isAdmin() ? "Leave as Whole school for everyone." : "Teachers post to their own classes."), isAdmin() ? h("label", { class: "chk" }, pin, "Pin to the top") : null, out,
      h("div", { class: "stack-row" }, h("button", { class: "btn btn-primary", type: "submit" }, "Post"), h("button", { class: "btn", type: "button", onclick: () => close() }, "Cancel")));
  });
}

// ---------- lesson notes ----------
export async function notesView(host) {
  const opts = staffOptions(); if (!opts.length) return mount(host, h("h1", {}, "Lesson notes"), empty("No class assigned", "Your admin has not given you a subject and class yet."));
  const body = h("div", {}); const p = picker(opts, () => draw());
  async function draw() { mount(body, skeleton(3)); try { const all = (await C.listNotes(p.cur.key)).filter((n) => n.subject === p.cur.subject);
    mount(body, all.length ? h("div", { class: "list" }, all.map((n) => h("article", { class: "row-card notice" }, h("div", {}, h("strong", {}, n.title), h("div", { class: "hint" }, `${n.week ? n.week + " · " : ""}${when(n.createdAt)} · ${n.createdByName || ""}`), bodyText(n.body), links(n.links)),
      h("div", { class: "stack-row" }, h("button", { class: "btn btn-sm", onclick: () => noteDialog(p.cur, n, draw) }, "Edit"), h("button", { class: "btn btn-sm btn-danger-quiet", onclick: async () => { if (await confirmDialog({ title: "Delete this note?", confirmLabel: "Delete", danger: true })) { await C.removeNote(n.id); draw(); } } }, "Delete"))))) : empty("No notes yet", "Add the first lesson note for this class and subject.")); } catch (e) { mount(body, empty("Cannot load notes", friendlyAuthError(e))); } }
  mount(host, h("div", { class: "toolbar" }, h("h1", { class: "grow" }, "Lesson notes"), h("button", { class: "btn btn-primary", onclick: () => noteDialog(p.cur, null, draw) }, "Add a note")), p.el, body); draw();
}
function noteDialog(cur, note, done) {
  formDialog(note ? "Edit lesson note" : "New lesson note", (close) => {
    const out = h("p", { role: "alert", hidden: true }); const title = h("input", { id: "lt", value: note?.title || "", maxlength: 140 }), week = h("input", { id: "lw", value: note?.week || "", placeholder: "Week 3" }), text = h("textarea", { id: "lb", rows: 8, maxlength: 6000 }, note?.body || ""), lk = h("textarea", { id: "ll", rows: 2, placeholder: "https://…" }, (note?.links || []).join("\n"));
    return h("form", { novalidate: true, onsubmit: async (e) => { e.preventDefault(); if (!title.value.trim() || !text.value.trim()) { out.hidden = false; out.textContent = "Add a title and the note."; return; }
      try { await C.saveNote({ id: note?.id, classKey: cur.key, subject: cur.subject, title: title.value.trim(), week: week.value.trim(), body: text.value.trim(), links: C.cleanLinks(lk.value) }); toast("Note saved"); close(); done(); } catch (err) { out.hidden = false; out.textContent = friendlyAuthError(err); } } },
      h("p", { class: "muted" }, `${classLabel(cur.key)} · ${cur.subject}`), field("Topic", title), field("Week or date", week), field("Note", text), field("Links (optional)", lk, "Video, slides or documents. One per line, starting with https://."), out,
      h("div", { class: "stack-row" }, h("button", { class: "btn btn-primary", type: "submit" }, "Save note"), h("button", { class: "btn", type: "button", onclick: () => close() }, "Cancel")));
  }, true);
}

// ---------- assignments ----------
export async function assignmentsView(host) {
  const opts = staffOptions(); if (!opts.length) return mount(host, h("h1", {}, "Assignments"), empty("No class assigned", "Your admin has not given you a subject and class yet."));
  const body = h("div", {}); const p = picker(opts, () => draw());
  async function draw() { mount(body, skeleton(3)); try { const all = (await C.listAssignments(p.cur.key)).filter((a) => a.subject === p.cur.subject);
    mount(body, all.length ? h("div", { class: "list" }, all.map((a) => h("article", { class: "row-card notice" }, h("div", {}, h("strong", {}, a.title), h("div", { class: "hint" }, `${a.due ? `Due ${a.due}${C.isOverdue(a.due) ? " (closed)" : ""} · ` : ""}Out of ${a.maxScore}`), bodyText(a.instructions), links(a.links)),
      h("div", { class: "stack-row" }, h("button", { class: "btn btn-sm btn-primary", onclick: () => submissionsDialog(a) }, "Submissions"), h("button", { class: "btn btn-sm", onclick: () => assignmentDialog(p.cur, a, draw) }, "Edit"),
        h("button", { class: "btn btn-sm btn-danger-quiet", onclick: async () => { if (await confirmDialog({ title: "Delete this assignment?", body: "Student submissions stay on record but the task disappears from their list.", confirmLabel: "Delete", danger: true })) { await C.removeAssignment(a.id); draw(); } } }, "Delete"))))) : empty("No assignments yet", "Set the first assignment for this class and subject.")); } catch (e) { mount(body, empty("Cannot load assignments", friendlyAuthError(e))); } }
  mount(host, h("div", { class: "toolbar" }, h("h1", { class: "grow" }, "Assignments"), h("button", { class: "btn btn-primary", onclick: () => assignmentDialog(p.cur, null, draw) }, "Set an assignment")), p.el, body); draw();
}
function assignmentDialog(cur, a, done) {
  formDialog(a ? "Edit assignment" : "New assignment", (close) => {
    const out = h("p", { role: "alert", hidden: true }); const title = h("input", { id: "at", value: a?.title || "", maxlength: 140 }), ins = h("textarea", { id: "ai", rows: 6, maxlength: 4000 }, a?.instructions || ""), due = h("input", { id: "ad", type: "date", value: a?.due || "" }), max = h("input", { id: "am", type: "number", min: 1, max: 100, value: a?.maxScore || 10 }), lk = h("textarea", { id: "al", rows: 2 }, (a?.links || []).join("\n"));
    return h("form", { novalidate: true, onsubmit: async (e) => { e.preventDefault(); if (!title.value.trim() || !ins.value.trim()) { out.hidden = false; out.textContent = "Add a title and the instructions."; return; }
      try { await C.saveAssignment({ id: a?.id, classKey: cur.key, subject: cur.subject, title: title.value.trim(), instructions: ins.value.trim(), due: due.value, maxScore: Math.max(1, Math.min(100, +max.value || 10)), links: C.cleanLinks(lk.value) }); toast("Assignment saved"); close(); done(); } catch (err) { out.hidden = false; out.textContent = friendlyAuthError(err); } } },
      h("p", { class: "muted" }, `${classLabel(cur.key)} · ${cur.subject}`), field("Title", title), field("Instructions", ins), field("Due date", due), field("Marks", max), field("Links (optional)", lk), out,
      h("div", { class: "stack-row" }, h("button", { class: "btn btn-primary", type: "submit" }, "Save"), h("button", { class: "btn", type: "button", onclick: () => close() }, "Cancel")));
  }, true);
}
async function submissionsDialog(a) {
  formDialog(`Submissions: ${a.title}`, (close) => {
    const box = h("div", {}, skeleton(4));
    (async () => { try { const [roster, subs] = await Promise.all([studentsOnce(), C.classSubmissions(a.classKey, a.subject)]);
      const rows = C.tally(roster.filter((s) => s.classKey === a.classKey && isEnrolled(s)), subs.filter((s) => s.assignmentId === a.id)); const n = rows.filter((r) => r.sub).length;
      mount(box, h("p", { class: "muted" }, `${n} of ${rows.length} handed in.`), rows.map((r) => {
        const score = h("input", { type: "number", min: 0, max: a.maxScore, value: r.sub?.score ?? "", "aria-label": `Score for ${r.student.name}` }), fb = h("input", { value: r.sub?.feedback || "", placeholder: "Feedback", maxlength: 300, "aria-label": `Feedback for ${r.student.name}` });
        return h("div", { class: "row-card notice" }, h("div", {}, h("strong", {}, r.student.name), h("span", { class: "chip" }, r.status === "missing" ? "Not handed in" : r.status === "graded" ? "Graded" : "Handed in"), r.sub ? [bodyText(r.sub.text), links(C.cleanLinks(r.sub.link))] : null),
          r.sub ? h("div", { class: "stack-row" }, score, fb, h("button", { class: "btn btn-sm btn-primary", onclick: async () => { const v = Number(score.value); if (score.value === "" || v < 0 || v > a.maxScore) return toast(`Enter a score from 0 to ${a.maxScore}`, "error"); try { await C.gradeSubmission(r.sub, { score: v, feedback: fb.value.trim() }); toast("Saved"); } catch (err) { toast(friendlyAuthError(err), "error"); } } }, "Save")) : null); }));
    } catch (e) { mount(box, empty("Cannot load submissions", friendlyAuthError(e))); } })();
    return h("div", {}, box, h("div", { class: "stack-row" }, h("button", { class: "btn", onclick: () => close() }, "Close")));
  }, true);
}

// ---------- timetable ----------
export async function timetableView(host) {
  const keys = isAdmin() ? allClassKeys() : myClassKeys(); if (!keys.length) return mount(host, h("h1", {}, "Timetable"), empty("No class assigned", "Your admin has not given you a class yet."));
  const body = h("div", {}); let key = keys[0]; const k = sel("tk", keys.map((x) => [x, classLabel(x)]), key); k.onchange = () => { key = k.value; draw(); };
  async function draw() { mount(body, skeleton(3)); try { const days = await C.loadTimetable(key); mount(body, timetableGrid(days), isAdmin() ? h("button", { class: "btn btn-primary", onclick: () => timetableEditor(key, days, draw) }, "Edit timetable") : null); } catch (e) { mount(body, empty("Cannot load timetable", friendlyAuthError(e))); } }
  mount(host, h("h1", {}, "Timetable"), field("Class", k), body); draw();
}
export function timetableGrid(days) {
  const has = C.DAYS.some((d) => days[d]?.length); if (!has) return empty("No timetable yet", "The school has not published this class's timetable.");
  return h("div", { class: "tt" }, C.DAYS.map((d) => h("section", { class: "card" }, h("h3", {}, d), days[d]?.length ? h("ul", { class: "plain" }, days[d].map((p) => h("li", {}, h("b", {}, p.time), " ", p.subject, p.teacher ? h("span", { class: "hint" }, ` · ${p.teacher}`) : null))) : h("p", { class: "hint" }, "No lessons"))));
}
function timetableEditor(key, days, done) {
  formDialog(`Timetable: ${classLabel(key)}`, (close) => {
    const out = h("p", { role: "alert", hidden: true }); const areas = Object.fromEntries(C.DAYS.map((d) => [d, h("textarea", { id: `d${d}`, rows: 5, placeholder: "08:00 | Mathematics | Mr Ade" }, C.periodsText(days[d]))]));
    return h("form", { novalidate: true, onsubmit: async (e) => { e.preventDefault(); try { await C.saveTimetable(key, Object.fromEntries(C.DAYS.map((d) => [d, C.parsePeriods(areas[d].value)]))); toast("Timetable saved"); close(); done(); } catch (err) { out.hidden = false; out.textContent = friendlyAuthError(err); } } },
      h("p", { class: "muted" }, "One lesson per line: time | subject | teacher (teacher is optional)."), C.DAYS.map((d) => field(d, areas[d])), out, h("div", { class: "stack-row" }, h("button", { class: "btn btn-primary", type: "submit" }, "Save"), h("button", { class: "btn", type: "button", onclick: () => close() }, "Cancel")));
  }, true);
}

// ---------- parents and students ----------
export async function learnerPanel(kind, { link, child, student }) {
  const wrap = h("div", {}, skeleton(3)); const sid = link.schoolId, ck = child.classKey || classKey(child.class, child.arm);
  try {
    if (kind === "notices") { const l = C.visibleNotices(await C.listNotices(sid), { role: student ? "student" : "parent", classKeys: [ck] }); mount(wrap, l.length ? h("div", { class: "list" }, l.map((n) => noticeCard(n, () => {}, false))) : empty("No notices", "School and class notices will appear here.")); }
    else if (kind === "notes") { const l = await C.listNotes(ck, sid); mount(wrap, l.length ? h("div", { class: "list" }, l.map((n) => h("article", { class: "row-card notice" }, h("div", {}, h("strong", {}, `${n.subject}: ${n.title}`), h("div", { class: "hint" }, `${n.week ? n.week + " · " : ""}${when(n.createdAt)}`), bodyText(n.body), links(n.links))))) : empty("No lesson notes yet", "Notes from teachers will appear here.")); }
    else if (kind === "timetable") mount(wrap, timetableGrid(await C.loadTimetable(ck, sid)));
    else { const draw = async () => { const [as, subs] = await Promise.all([C.listAssignments(ck, sid), C.mySubmissions(child.id || link.studentId, sid)]); const by = new Map(subs.map((s) => [s.assignmentId, s]));
      mount(wrap, as.length ? h("div", { class: "list" }, as.map((a) => assignmentCard(a, by.get(a.id), student, () => submitDialog(a, by.get(a.id), link, draw)))) : empty("No assignments", "Assignments from teachers will appear here.")); }; await draw(); }
  } catch (e) { mount(wrap, empty("Cannot load", friendlyAuthError(e))); }
  return wrap;
}
function assignmentCard(a, sub, student, onSubmit) {
  const status = !sub ? (C.isOverdue(a.due) ? "Overdue" : "To do") : sub.gradedAt ? `Graded: ${sub.score}/${a.maxScore}` : "Handed in";
  return h("article", { class: "row-card notice" }, h("div", {}, h("strong", {}, `${a.subject}: ${a.title}`), h("span", { class: "chip" }, status), h("div", { class: "hint" }, `${a.due ? `Due ${a.due} · ` : ""}Out of ${a.maxScore}`), bodyText(a.instructions), links(a.links), sub?.feedback ? h("p", { class: "hl" }, `Teacher's feedback: ${sub.feedback}`) : null),
    student && !sub?.gradedAt ? h("button", { class: "btn btn-sm btn-primary", onclick: onSubmit }, sub ? "Change my answer" : "Hand in") : null);
}
function submitDialog(a, existing, link, done) {
  formDialog(`Hand in: ${a.title}`, (close) => {
    const out = h("p", { role: "alert", hidden: true }); const text = h("textarea", { id: "sx", rows: 8, maxlength: 6000 }, existing?.text || ""), lk = h("input", { id: "sl", value: existing?.link || "", placeholder: "https://… (optional)" });
    return h("form", { novalidate: true, onsubmit: async (e) => { e.preventDefault(); if (!text.value.trim() && !lk.value.trim()) { out.hidden = false; out.textContent = "Write your answer or paste a link."; return; }
      if (lk.value.trim() && !C.cleanLinks(lk.value).length) { out.hidden = false; out.textContent = "The link must start with https://"; return; }
      try { await C.submitWork({ assignment: a, studentId: link.studentId, text: text.value.trim(), link: lk.value.trim(), existing }, link.schoolId); toast("Handed in"); close(); done(); } catch (err) { out.hidden = false; out.textContent = friendlyAuthError(err); } } },
      bodyText(a.instructions), field("Your answer", text), field("Link to your work", lk, "Optional: a Google Docs or Drive link. Make sure your teacher can open it."), out,
      h("div", { class: "stack-row" }, h("button", { class: "btn btn-primary", type: "submit" }, "Hand in"), h("button", { class: "btn", type: "button", onclick: () => close() }, "Cancel")));
  }, true);
}
