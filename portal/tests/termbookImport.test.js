import { describe, it, expect, vi } from "vitest";
vi.mock("../src/lib/firebase.js", () => ({ db: {} }));
vi.mock("firebase/app", () => ({ initializeApp: vi.fn(), deleteApp: vi.fn() }));
vi.mock("firebase/auth", () => ({ getAuth: vi.fn(), signInWithEmailAndPassword: vi.fn() }));
vi.mock("firebase/firestore", () => ({ getFirestore: vi.fn(), collection: vi.fn(), getDocs: vi.fn(), getDoc: vi.fn(), doc: vi.fn(), writeBatch: vi.fn() }));
const { parseFirebaseConfig, chunk, importableSchoolFields, COLLECTIONS } = await import("../src/lib/termbookImport.js");

describe("Termbook import helpers", () => {
  it("reads a pasted firebaseConfig snippet", () => {
    const c = parseFirebaseConfig('const firebaseConfig = {\n  apiKey: "AIza123",\n  authDomain: "tb.firebaseapp.com",\n  projectId: "tb-1",\n  appId: "1:2:web:3"\n};');
    expect(c).toMatchObject({ apiKey: "AIza123", projectId: "tb-1", appId: "1:2:web:3" });
  });
  it("reads JSON and rejects incomplete config", () => {
    expect(parseFirebaseConfig('{"apiKey":"a","projectId":"p","appId":"x"}')).toBeTruthy();
    expect(parseFirebaseConfig('{"apiKey":"a"}')).toBeNull();
    expect(parseFirebaseConfig("")).toBeNull();
  });
  it("splits writes into batches under Firestore's 500 limit", () => {
    expect(chunk(Array.from({ length: 1000 }, (_, i) => i)).map((c) => c.length)).toEqual([400, 400, 200]);
  });
  it("never overwrites this school's identity fields", () => {
    const f = importableSchoolFields({ name: "Old", adminUid: "x", status: "verified", structure: { classes: [] }, scoring: {} });
    expect(Object.keys(f).sort()).toEqual(["scoring", "structure"]);
  });
  it("copies students before the collections whose rules look them up", () => {
    expect(COLLECTIONS[0][0]).toBe("students");
  });
});
