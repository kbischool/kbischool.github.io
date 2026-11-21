import { describe, it, expect, vi } from "vitest";
vi.mock("../src/lib/firebase.js", () => ({ db: {}, auth: { currentUser: { uid: "u" } } }));
vi.mock("firebase/firestore", () => ({ collection: vi.fn(), doc: vi.fn(), getDocs: vi.fn(), setDoc: vi.fn(), addDoc: vi.fn(), updateDoc: vi.fn(), deleteDoc: vi.fn(), query: vi.fn(), where: vi.fn(), serverTimestamp: vi.fn(), orderBy: vi.fn(), limit: vi.fn() }));
const C = await import("../src/lib/classroom.js");

describe("classroom helpers", () => {
  it("keeps only http(s) links", () => {
    expect(C.cleanLinks("https://a.com javascript:alert(1) http://b.org, ftp://x")).toEqual(["https://a.com", "http://b.org"]);
  });
  it("detects overdue work after the due day ends", () => {
    expect(C.isOverdue("2026-11-10", new Date("2026-11-11T08:00:00"))).toBe(true);
    expect(C.isOverdue("2026-11-10", new Date("2026-11-10T20:00:00"))).toBe(false);
    expect(C.isOverdue("")).toBe(false);
  });
  it("shows each person only the notices meant for them, pinned first", () => {
    const l = [{ id: 1, audience: "all", classKey: null }, { id: 2, audience: "teachers", classKey: null }, { id: 3, audience: "parents", classKey: "SS2|A", pinned: true }, { id: 4, audience: "all", classKey: "JSS1|A" }];
    expect(C.visibleNotices(l, { role: "parent", classKeys: ["SS2|A"] }).map((n) => n.id)).toEqual([3, 1]);
    expect(C.visibleNotices(l, { role: "teacher", classKeys: ["JSS1|A"] }).map((n) => n.id).sort()).toEqual([1, 2, 4]);
    expect(C.visibleNotices(l, { role: "admin" })).toHaveLength(4);
  });
  it("tallies who handed in, who is graded and who is missing", () => {
    const r = C.tally([{ id: "a" }, { id: "b" }, { id: "c" }], [{ studentId: "a" }, { studentId: "b", gradedAt: 1 }]);
    expect(r.map((x) => x.status)).toEqual(["submitted", "graded", "missing"]);
  });
  it("round-trips timetable text", () => {
    const p = C.parsePeriods("08:00 | Maths | Mr Ade\n\n09:00 | English\nbad");
    expect(p).toEqual([{ time: "08:00", subject: "Maths", teacher: "Mr Ade" }, { time: "09:00", subject: "English", teacher: "" }]);
    expect(C.periodsText(p)).toBe("08:00 | Maths | Mr Ade\n09:00 | English");
  });
});
