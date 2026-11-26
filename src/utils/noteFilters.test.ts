import { describe, expect, it } from "vitest";
import type { Note } from "../redux/types";
import {
  NO_NOTE_FILTERS,
  NoteFilters,
  filterNotes,
  hasNoteFilters,
} from "./noteFilters";

const NOW = new Date(2026, 10, 25, 12, 0); // Nov 25, 2026, local time

const note = (id: string, date: string, over: Partial<Note> = {}): Note => ({
  id,
  _id: id,
  note: `note ${id}`,
  date,
  artistId: "a1",
  ...over,
});

const notes: Note[] = [
  // written before notes had kinds: an artist note
  note("old", "2025-03-02T15:00:00.000Z", {
    note: "Client prefers soft brows",
  }),
  note("photo-note", "2026-10-01T15:00:00.000Z", {
    imageUrl: "https://x/1.jpg",
  }),
  note("email", "2026-11-20T15:00:00.000Z", {
    kind: "email",
    subject: "Your aftercare",
    note: "Email to jane",
  }),
  note("client-photo", "2026-11-22T15:00:00.000Z", {
    kind: "client-photo",
    imageUrl: "https://x/2.jpg",
  }),
  // scheduled on the 19th, goes out Dec 3: dated by when it goes out
  note("scheduled", "2026-11-19T15:00:00.000Z", {
    kind: "scheduled-email",
    sendAt: "2026-12-03T15:00:00.000Z",
    subject: "How is it healing?",
  }),
];

const run = (over: Partial<NoteFilters>) =>
  filterNotes(notes, { ...NO_NOTE_FILTERS, ...over }, NOW);
const ids = (over: Partial<NoteFilters>) => run(over).notes.map((n) => n.id);

describe("note filters", () => {
  it("shows everything, newest first, with counts for each type", () => {
    const { notes: shown, counts } = run({});
    expect(shown.map((n) => n.id)).toEqual([
      "scheduled",
      "client-photo",
      "email",
      "photo-note",
      "old",
    ]);
    expect(counts).toEqual({
      all: 5,
      note: 2,
      email: 1,
      "scheduled-email": 1,
      "client-photo": 1,
    });
  });

  it("treats old notes without a kind as the artist's own", () => {
    expect(ids({ type: "note" })).toEqual(["photo-note", "old"]);
  });

  it("filters by a recent period", () => {
    expect(ids({ range: "30d" })).toEqual([
      "scheduled",
      "client-photo",
      "email",
    ]);
    expect(ids({ range: "3m" })).toEqual([
      "scheduled",
      "client-photo",
      "email",
      "photo-note",
    ]);
  });

  it("filters by custom dates, whole days included, either way round", () => {
    expect(
      ids({ range: "custom", from: "2026-11-20", to: "2026-11-22" }),
    ).toEqual(["client-photo", "email"]);
    expect(
      ids({ range: "custom", from: "2026-11-22", to: "2026-11-20" }),
    ).toEqual(["client-photo", "email"]);
    // open-ended
    expect(ids({ range: "custom", to: "2025-12-31" })).toEqual(["old"]);
    expect(ids({ range: "custom", from: "2026-12-01" })).toEqual(["scheduled"]);
  });

  it("filters by photos and searches text and subjects", () => {
    expect(ids({ photosOnly: true })).toEqual(["client-photo", "photo-note"]);
    expect(ids({ search: "SOFT brows" })).toEqual(["old"]);
    expect(ids({ search: "healing" })).toEqual(["scheduled"]);
  });

  it("counts types within the other filters, and sorts oldest first", () => {
    const { counts } = run({ range: "30d" });
    expect(counts.note).toBe(0);
    expect(counts.email).toBe(1);
    expect(ids({ sort: "oldest", type: "note" })).toEqual([
      "old",
      "photo-note",
    ]);
  });

  it("knows when a filter is on", () => {
    expect(hasNoteFilters(NO_NOTE_FILTERS)).toBe(false);
    expect(hasNoteFilters({ ...NO_NOTE_FILTERS, range: "custom" })).toBe(false);
    expect(hasNoteFilters({ ...NO_NOTE_FILTERS, sort: "oldest" })).toBe(false);
    expect(hasNoteFilters({ ...NO_NOTE_FILTERS, range: "30d" })).toBe(true);
    expect(
      hasNoteFilters({
        ...NO_NOTE_FILTERS,
        range: "custom",
        from: "2026-01-01",
      }),
    ).toBe(true);
  });
});
