import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import NoteCard from "./NoteCard";
import EditCard from "./EditNoteCard";
import { Note } from "../../../redux/types";

const note = (overrides: Partial<Note> = {}): Note => ({
  id: "n1",
  _id: "n1",
  note: "Prefers a softer arch",
  artistId: "artist-1",
  date: "2026-11-18T10:00:00.000Z",
  createdAt: "2026-11-18T10:00:00.000Z",
  ...overrides,
});

const emailNote = note({
  id: "n2",
  kind: "email",
  appointmentId: "appt-1",
  subject: "Aftercare for your Microblading",
  messageType: "aftercare",
  note: "Email sent to jane@example.com\nSubject: Aftercare for your Microblading\n\nKeep it dry",
});

const renderCard = (n: Note) =>
  render(
    <NoteCard
      note={n}
      isSelected={false}
      onNoteClick={vi.fn()}
      onDeleteNote={vi.fn()}
      formatDate={(d) => d.slice(0, 10)}
      appointmentLabel="Nov 20, 2026 · Microblading"
    />,
  );

const renderEditor = (n: Note) =>
  render(
    <EditCard
      selectedNote={n}
      isEditing={false}
      editContent={n.note}
      setEditContent={vi.fn()}
      editImageUrl=""
      setEditImageUrl={vi.fn()}
      onEditClick={vi.fn()}
      onSaveEdit={vi.fn()}
      onCancelEdit={vi.fn()}
      onImageUpload={vi.fn()}
      formatDate={(d) => d.slice(0, 10)}
      appointmentLabel="Nov 20, 2026 · Microblading"
    />,
  );

describe("notes that record communication with the client", () => {
  it("shows an email as sent, tied to its appointment, with no delete", () => {
    renderCard(emailNote);

    expect(
      screen.getByText("Email sent · Aftercare instructions"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Appointment: Nov 20, 2026 · Microblading"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Aftercare for your Microblading"),
    ).toBeInTheDocument();
    expect(screen.getByText("Sent: 2026-11-18")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Delete note" })).toBeNull();
  });

  it("shows the full email but can't be edited", () => {
    renderEditor(emailNote);

    expect(screen.getByText(/Keep it dry/)).toBeInTheDocument();
    expect(screen.getByText(/can't be edited or deleted/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /edit/i })).toBeNull();
  });

  it("labels a client's healing photo", () => {
    renderCard(
      note({
        kind: "client-photo",
        appointmentId: "appt-1",
        imageUrl: "https://storage.example.com/p.jpg",
        note: "Jane Doe sent a healing photo.",
      }),
    );

    expect(screen.getByText("Photo from client")).toBeInTheDocument();
    expect(screen.getByText("Received: 2026-11-18")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Delete note" })).toBeNull();
  });

  it("leaves the artist's own notes editable and deletable", () => {
    renderCard(note());
    expect(
      screen.getByRole("button", { name: "Delete note" }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Email sent/)).toBeNull();
  });

  it("shows a scheduled email with when it goes out, and lets the artist cancel it", async () => {
    const onCancelScheduled = vi.fn();
    const scheduled = note({
      id: "n3",
      kind: "scheduled-email",
      appointmentId: "appt-1",
      messageId: "msg-1",
      subject: "How is it healing?",
      messageType: "healing-check-in",
      sendAt: "2026-12-03T20:00:00.000Z",
      note: "Email to jane@example.com\nSubject: How is it healing?\n\nHi Jane",
    });
    render(
      <NoteCard
        note={scheduled}
        isSelected={false}
        onNoteClick={vi.fn()}
        onDeleteNote={vi.fn()}
        formatDate={(d) => d.slice(0, 10)}
        onCancelScheduled={onCancelScheduled}
      />,
    );

    expect(
      screen.getByText("Scheduled · Healing check-in"),
    ).toBeInTheDocument();
    expect(screen.getByText(/^Goes out:/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Delete note" })).toBeNull();

    screen.getByRole("button", { name: "Cancel" }).click();
    expect(onCancelScheduled).toHaveBeenCalledWith(scheduled);
  });
});

describe("NoteCard: who wrote it", () => {
  it("names the author next to the date when given one", () => {
    render(
      <NoteCard
        note={note()}
        isSelected={false}
        onNoteClick={vi.fn()}
        onDeleteNote={vi.fn()}
        formatDate={(d) => d.slice(0, 10)}
        author="Mia Ross"
      />,
    );
    expect(screen.getByText("Created: 2026-11-18 · by Mia Ross")).toBeInTheDocument();
  });

  it("shows only the date without one", () => {
    renderCard(note());
    expect(screen.getByText("Created: 2026-11-18")).toBeInTheDocument();
  });
});
