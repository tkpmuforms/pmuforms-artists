import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import toast from "react-hot-toast";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ClientNotesPage from "./ClientNotes";
import * as api from "../../../services/artistServices";

vi.mock("../../../services/artistServices", () => ({
  addCustomerNote: vi.fn(),
  cancelScheduledMessage: vi.fn(),
  deleteCustomerNote: vi.fn(),
  getAppointmentsForCustomer: vi.fn(),
  getCustomerNotes: vi.fn(),
  updateCustomerNote: vi.fn(),
}));
vi.mock("../../../firebase/firebase", () => ({ storage: {} }));
vi.mock("../../../context/useAuth", () => ({
  default: () => ({ user: { _id: "artist-1" } }),
}));
vi.mock("react-hot-toast", () => ({
  default: { error: vi.fn(), success: vi.fn() },
}));

const mocked = vi.mocked(api);

const renderPage = () =>
  render(
    <MemoryRouter
      initialEntries={[
        { pathname: "/clients/cust-1/notes", state: { clientName: "Jane Doe" } },
      ]}
    >
      <Routes>
        <Route path="/clients/:clientId/notes" element={<ClientNotesPage />} />
      </Routes>
    </MemoryRouter>,
  );

describe("ClientNotesPage: scheduled emails", () => {
  beforeEach(() => {
    mocked.getCustomerNotes.mockResolvedValue({
      data: {
        notes: [
          {
            id: "n1",
            _id: "n1",
            kind: "scheduled-email",
            appointmentId: "appt-1",
            messageId: "msg-1",
            subject: "How is it healing?",
            messageType: "healing-check-in",
            sendAt: "2026-12-03T20:00:00.000Z",
            date: "2026-11-19T20:00:00.000Z",
            artistId: "artist-1",
            note: "Email to jane@example.com\nSubject: How is it healing?\n\nHi",
          },
        ],
      },
    } as never);
    mocked.getAppointmentsForCustomer.mockResolvedValue({
      data: {
        appointments: [
          {
            id: "appt-1",
            date: "2026-11-20T15:00:00.000Z",
            serviceDetails: [{ service: "Microblading" }],
          },
        ],
      },
    } as never);
  });

  it("cancels a scheduled email after confirming, and drops it from the notes", async () => {
    mocked.cancelScheduledMessage.mockResolvedValue({ data: {} } as never);
    const user = userEvent.setup();
    renderPage();

    expect(
      await screen.findByText(/Appointment: Nov 20, 2026 · Microblading/),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(screen.getByText("Cancel this email?")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Cancel email" }));

    expect(mocked.cancelScheduledMessage).toHaveBeenCalledWith(
      "appt-1",
      "msg-1",
    );
    await waitFor(() =>
      expect(screen.queryByText("How is it healing?")).toBeNull(),
    );
    expect(toast.success).toHaveBeenCalledWith("Scheduled email cancelled");
  });

  it("keeps the email when the artist changes their mind", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(await screen.findByRole("button", { name: "Cancel" }));
    const dialog = screen.getByText("Cancel this email?").parentElement!;
    await user.click(within(dialog).getByRole("button", { name: "Keep it" }));

    expect(mocked.cancelScheduledMessage).not.toHaveBeenCalled();
    expect(screen.getByText("How is it healing?")).toBeInTheDocument();
  });
});
