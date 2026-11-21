/**
 * One-time import of a school's existing data from a Termbook project into this portal.
 * The browser signs in to the Termbook Firebase project as that school's admin (read only), then copies the school's
 * records into the KBI school. Nothing leaves the browser and nothing in Termbook is changed. Re-running is safe:
 * records keep their ids, so a second run overwrites the same documents instead of duplicating them.
 */
import { initializeApp, deleteApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, collection, getDocs, getDoc, doc, writeBatch } from "firebase/firestore";
import { db } from "./firebase.js";

/** Students first: other collections' write rules look the student up. */
export const COLLECTIONS = [
  ["students", "Students"], ["studentAttendance", "Student attendance"], ["attendance", "Class registers"], ["holidays", "Holidays"], ["terms", "Terms"],
  ["sheets", "Score sheets"], ["remarks", "Conduct ratings and comments"], ["reports", "Report cards"], ["accessCodes", "Parent access codes"],
];
/** School fields that belong to this school and must never be overwritten by the import. */
const KEEP = ["adminUid", "status", "createdAt", "name", "state", "lga", "address", "phone", "email", "type", "verified", "verifiedAt", "verifiedBy"];

export const chunk = (list, n = 400) => Array.from({ length: Math.ceil(list.length / n) }, (_, i) => list.slice(i * n, i * n + n));
export const importableSchoolFields = (data) => Object.fromEntries(Object.entries(data || {}).filter(([k]) => !KEEP.includes(k)));

/** Pulls the Firebase web-app settings out of pasted text: either a JSON object or the `const firebaseConfig = {...}` snippet. */
export function parseFirebaseConfig(text) {
  const out = {}; const t = String(text || "");
  for (const k of ["apiKey", "authDomain", "projectId", "storageBucket", "messagingSenderId", "appId"]) { const m = t.match(new RegExp(`["']?${k}["']?\\s*:\\s*["']([^"']+)["']`)); if (m) out[k] = m[1].trim(); }
  return out.apiKey && out.projectId && out.appId ? out : null;
}

export async function connectTermbook(config, email, password) {
  const app = initializeApp(config, `termbook-${Date.now()}`);
  try {
    const auth = getAuth(app); const cred = await signInWithEmailAndPassword(auth, email, password);
    const tdb = getFirestore(app); const profile = await getDoc(doc(tdb, `users/${cred.user.uid}`));
    const schoolId = profile.data()?.schoolId; if (!schoolId) throw new Error("This account has no school in Termbook. Use the school admin's email.");
    const school = await getDoc(doc(tdb, `schools/${schoolId}`));
    return { app, tdb, schoolId, schoolName: school.data()?.name || schoolId, school: school.data() || {}, close: () => deleteApp(app) };
  } catch (e) { await deleteApp(app).catch(() => {}); throw e; }
}

/** Copies the chosen collections. onProgress({collection, done, total}) is called as it goes. Returns counts and any per-collection errors. */
export async function runImport({ conn, dstSchoolId, include, onProgress = () => {} }) {
  const result = { counts: {}, errors: {} }; const dst = `schools/${dstSchoolId}`;
  const write = async (items, merge = false) => { for (const part of chunk(items)) { const b = writeBatch(db); part.forEach(([path, data]) => b.set(doc(db, path), data, { merge })); await b.commit(); } };
  if (include.settings) { try { await write([[dst, importableSchoolFields(conn.school)]], true); } catch (e) { result.errors.settings = e.message; } }
  for (const [name] of COLLECTIONS.filter(([n]) => include[n])) {
    try {
      const snap = await getDocs(collection(conn.tdb, `schools/${conn.schoolId}/${name}`)); const items = snap.docs.map((d) => [`${dst}/${name}/${d.id}`, d.data()]);
      if (name === "students") for (const d of snap.docs) { const p = await getDoc(doc(conn.tdb, `schools/${conn.schoolId}/students/${d.id}/private/info`)).catch(() => null); if (p?.exists()) items.push([`${dst}/students/${d.id}/private/info`, p.data()]); }
      onProgress({ collection: name, done: 0, total: items.length }); await write(items); onProgress({ collection: name, done: items.length, total: items.length }); result.counts[name] = items.length;
    } catch (e) { result.errors[name] = e.message || String(e); }
  }
  return result;
}
