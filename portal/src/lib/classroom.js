/** Notices, lesson notes, assignments, submissions and timetables. All text and links: no file uploads, so no paid storage is needed. */
import { db, auth } from "./firebase.js";
import { state, effectiveSchoolId } from "./store.js";
import { collection, doc, getDocs, setDoc, addDoc, updateDoc, deleteDoc, query, where, serverTimestamp, orderBy, limit } from "firebase/firestore";

export const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const base = (sid) => `schools/${sid || effectiveSchoolId()}`;
const c = (name, sid) => collection(db, `${base(sid)}/${name}`);
const d = (name, id, sid) => doc(db, `${base(sid)}/${name}/${id}`);
const me = () => ({ createdBy: auth.currentUser.uid, createdByName: state.profile?.name || (state.isOwner ? "School owner" : ""), createdAt: serverTimestamp() });
const newest = (list) => list.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
const rows = (s) => s.docs.map((x) => ({ id: x.id, ...x.data() }));
export const safeKey = (classKey) => String(classKey).replace(/[|/ ]/g, "_");

/** Keeps only http(s) links so a pasted "javascript:" address can never become a clickable link. */
export function cleanLinks(text) {
  return String(text || "").split(/[\s,]+/).filter(Boolean).filter((u) => /^https?:\/\/\S+$/i.test(u)).slice(0, 5);
}
export const isOverdue = (due, now = new Date()) => !!due && new Date(`${due}T23:59:59`) < now;

// ---- notices ----
/** audience: "all" | "parents" | "students" | "teachers". classKey: null for the whole school (admin only). */
export const postNotice = (n, sid) => addDoc(c("notices", sid), { title: n.title, body: n.body, audience: n.audience || "all", classKey: n.classKey || null, pinned: !!n.pinned, ...me() });
export const listNotices = async (sid) => newest(rows(await getDocs(query(c("notices", sid), orderBy("createdAt", "desc"), limit(60)))));
export const removeNotice = (id, sid) => deleteDoc(d("notices", id, sid));
/** What one person should see: the audience matches their role and the class matches one of their classes (or the notice is for everyone). */
export function visibleNotices(list, { role, classKeys = [] }) {
  const aud = { parent: "parents", student: "students", teacher: "teachers" }[role];
  return list.filter((n) => (n.audience === "all" || !aud || n.audience === aud || role === "admin" || role === "owner") && (!n.classKey || role === "admin" || role === "owner" || classKeys.includes(n.classKey)))
    .sort((a, b) => (b.pinned === true) - (a.pinned === true) || (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
}

// ---- lesson notes ----
export const saveNote = (n, sid) => (n.id ? updateDoc(d("notes", n.id, sid), { title: n.title, body: n.body, links: n.links || [], week: n.week || "" })
  : addDoc(c("notes", sid), { classKey: n.classKey, subject: n.subject, title: n.title, body: n.body, links: n.links || [], week: n.week || "", ...me() }));
export const listNotes = async (classKey, sid) => newest(rows(await getDocs(query(c("notes", sid), where("classKey", "==", classKey), limit(80)))));
export const removeNote = (id, sid) => deleteDoc(d("notes", id, sid));

// ---- assignments ----
export const saveAssignment = (a, sid) => (a.id ? updateDoc(d("assignments", a.id, sid), { title: a.title, instructions: a.instructions, links: a.links || [], due: a.due || "", maxScore: a.maxScore || 10 })
  : addDoc(c("assignments", sid), { classKey: a.classKey, subject: a.subject, title: a.title, instructions: a.instructions, links: a.links || [], due: a.due || "", maxScore: a.maxScore || 10, ...me() }));
export const listAssignments = async (classKey, sid) => newest(rows(await getDocs(query(c("assignments", sid), where("classKey", "==", classKey), limit(80)))));
export const removeAssignment = (id, sid) => deleteDoc(d("assignments", id, sid));

// ---- submissions ----
export const submissionId = (assignmentId, studentId) => `${assignmentId}_${studentId}`;
export async function submitWork({ assignment, studentId, text, link, existing }, sid) {
  const id = submissionId(assignment.id, studentId);
  if (existing) return updateDoc(d("submissions", id, sid), { text, link, submittedAt: serverTimestamp() });
  return setDoc(d("submissions", id, sid), { assignmentId: assignment.id, studentId, classKey: assignment.classKey, subject: assignment.subject, text, link, uid: auth.currentUser.uid, submittedAt: serverTimestamp() });
}
export const mySubmissions = async (studentId, sid) => rows(await getDocs(query(c("submissions", sid), where("studentId", "==", studentId))));
export const classSubmissions = async (classKey, subject, sid) => rows(await getDocs(query(c("submissions", sid), where("classKey", "==", classKey), where("subject", "==", subject))));
export const gradeSubmission = (sub, { score, feedback }, sid) => updateDoc(d("submissions", sub.id, sid), { score, feedback, gradedAt: serverTimestamp(), gradedBy: auth.currentUser.uid });
/** Per-assignment tally for the teacher: who handed in, who is graded, who is still missing. */
export function tally(roster, subs) {
  const by = new Map(subs.map((s) => [s.studentId, s]));
  return roster.map((s) => ({ student: s, sub: by.get(s.id) || null })).map((r) => ({ ...r, status: !r.sub ? "missing" : r.sub.gradedAt ? "graded" : "submitted" }));
}

// ---- timetable ----
export const emptyTimetable = () => Object.fromEntries(DAYS.map((x) => [x, []]));
export async function loadTimetable(classKey, sid) {
  const s = await getDocs(query(c("timetables", sid), where("classKey", "==", classKey)));
  return s.empty ? emptyTimetable() : { ...emptyTimetable(), ...s.docs[0].data().days };
}
export const saveTimetable = (classKey, days, sid) => setDoc(d("timetables", safeKey(classKey), sid), { classKey, days, updatedAt: serverTimestamp() });
/** "08:00 | Mathematics | Mr Ade" lines -> periods. Blank lines are skipped. */
export const parsePeriods = (text) => String(text || "").split("\n").map((l) => l.split("|").map((x) => x.trim())).filter((p) => p[0] && p[1]).map(([time, subject, teacher = ""]) => ({ time, subject, teacher }));
export const periodsText = (list) => (list || []).map((p) => [p.time, p.subject, p.teacher].filter((x, i) => i < 2 || x).join(" | ")).join("\n");
