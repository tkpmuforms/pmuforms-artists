import type { Note } from "../redux/types";

/**
 * Filters for a client's notes. Everything here works on notes of any age:
 * every note has a date and text, and notes written before kinds existed
 * have no kind, which means a note the artist wrote.
 */

export type NoteType =
  "all" | "note" | "email" | "client-photo" | "scheduled-email";
export type NoteRange = "any" | "30d" | "3m" | "12m" | "custom";
export type NoteSort = "newest" | "oldest";

export interface NoteFilters {
  type: NoteType;
  range: NoteRange;
  /** yyyy-mm-dd, inclusive; used when range is "custom" */
  from: string;
  to: string;
  photosOnly: boolean;
  search: string;
  sort: NoteSort;
}

export const NO_NOTE_FILTERS: NoteFilters = {
  type: "all",
  range: "any",
  from: "",
  to: "",
  photosOnly: false,
  search: "",
  sort: "newest",
};

export const NOTE_TYPES: { value: NoteType; label: string }[] = [
  { value: "all", label: "All" },
  { value: "note", label: "My notes" },
  { value: "email", label: "Emails sent" },
  { value: "scheduled-email", label: "Scheduled" },
  { value: "client-photo", label: "Client photos" },
];

export const NOTE_RANGES: { value: NoteRange; label: string }[] = [
  { value: "any", label: "Any time" },
  { value: "30d", label: "Last 30 days" },
  { value: "3m", label: "Last 3 months" },
  { value: "12m", label: "Last 12 months" },
  { value: "custom", label: "Custom dates" },
];

export const typeOf = (note: Note): Exclude<NoteType, "all"> =>
  note.kind ?? "note";

/** When it happened: when a scheduled email goes out, otherwise its date. */
export const whenOf = (note: Note): Date | null => {
  const raw =
    note.kind === "scheduled-email" ? (note.sendAt ?? note.date) : note.date;
  const when = raw ? new Date(raw) : null;
  return when && !Number.isNaN(when.getTime()) ? when : null;
};

/** a yyyy-mm-dd day in the viewer's time zone, at its start or end */
const localDay = (day: string, end: boolean): Date | null => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(day);
  if (!match) return null;
  const [, y, m, d] = match.map(Number);
  return end
    ? new Date(y, m - 1, d, 23, 59, 59, 999)
    : new Date(y, m - 1, d, 0, 0, 0, 0);
};

/** The first and last moment the range covers; null ends are open. */
export const rangeBounds = (
  filters: Pick<NoteFilters, "range" | "from" | "to">,
  now: Date = new Date(),
): { start: Date | null; end: Date | null } => {
  const ago = (months: number, days = 0) => {
    const start = new Date(now);
    start.setMonth(start.getMonth() - months);
    start.setDate(start.getDate() - days);
    start.setHours(0, 0, 0, 0);
    return start;
  };
  switch (filters.range) {
    case "30d":
      return { start: ago(0, 30), end: null };
    case "3m":
      return { start: ago(3), end: null };
    case "12m":
      return { start: ago(12), end: null };
    case "custom": {
      let start = localDay(filters.from, false);
      let end = localDay(filters.to, true);
      // dates typed the wrong way round still mean the days between them
      if (start && end && start > end) {
        start = localDay(filters.to, false);
        end = localDay(filters.from, true);
      }
      return { start, end };
    }
    default:
      return { start: null, end: null };
  }
};

const inRange = (
  note: Note,
  bounds: { start: Date | null; end: Date | null },
) => {
  if (!bounds.start && !bounds.end) return true;
  const when = whenOf(note);
  if (!when) return false;
  return (
    (!bounds.start || when >= bounds.start) &&
    (!bounds.end || when <= bounds.end)
  );
};

const matchesSearch = (note: Note, search: string) => {
  const words = search.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length) return true;
  const text = [note.note, note.subject]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return words.every((word) => text.includes(word));
};

/** Every filter except the type, so the type chips can show their counts. */
const matchesAllButType = (
  note: Note,
  filters: NoteFilters,
  bounds: { start: Date | null; end: Date | null },
) =>
  inRange(note, bounds) &&
  (!filters.photosOnly || !!note.imageUrl) &&
  matchesSearch(note, filters.search);

export const filterNotes = (
  notes: Note[],
  filters: NoteFilters,
  now: Date = new Date(),
) => {
  const bounds = rangeBounds(filters, now);
  const matching = notes.filter((note) =>
    matchesAllButType(note, filters, bounds),
  );
  const counts = NOTE_TYPES.reduce(
    (acc, { value }) => ({
      ...acc,
      [value]:
        value === "all"
          ? matching.length
          : matching.filter((note) => typeOf(note) === value).length,
    }),
    {} as Record<NoteType, number>,
  );
  const shown = matching
    .filter((note) => filters.type === "all" || typeOf(note) === filters.type)
    .map((note, index) => ({ note, index, time: whenOf(note)?.getTime() }))
    .sort((a, b) => {
      // undated notes keep their place at the end
      if (a.time === undefined || b.time === undefined) {
        return a.time === undefined && b.time === undefined
          ? a.index - b.index
          : a.time === undefined
            ? 1
            : -1;
      }
      const diff =
        filters.sort === "oldest" ? a.time - b.time : b.time - a.time;
      return diff || a.index - b.index;
    })
    .map(({ note }) => note);

  return { notes: shown, counts };
};

export const hasNoteFilters = (filters: NoteFilters) =>
  filters.type !== "all" ||
  (filters.range === "custom"
    ? !!(filters.from || filters.to)
    : filters.range !== "any") ||
  filters.photosOnly ||
  !!filters.search.trim();
