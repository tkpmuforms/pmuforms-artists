import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ClientsFormsForAppointments from "./ClientsFormsForAppointments";
import * as api from "../../../services/artistServices";

// someone working alone: no names, and no request for them
vi.mock("../../../utils/teamPeople", () => ({
  useWhoDid: () => ({ hasTeam: false, label: () => "" }),
}));
vi.mock("../../../services/artistServices", () => ({
  getAppointmentById: vi.fn(),
  getCustomerById: vi.fn(),
  getFilledFormsByAppointment: vi.fn(),
}));

const mocked = vi.mocked(api);

const forms = (status: string) => [
  {
    id: "f1",
    title: "Consent",
    status,
    createdAt: "2026-11-18T10:00:00.000Z",
    updatedAt: "2026-11-18T10:00:00.000Z",
  },
];

function renderPage() {
  render(
    <MemoryRouter
      initialEntries={[
        {
          pathname: "/clients/cust-1/appointments/appt-1/forms",
          state: { clientName: "Jane Doe" },
        },
      ]}
    >
      <Routes>
        <Route
          path="/clients/:id/appointments/:appointmentId/forms"
          element={<ClientsFormsForAppointments />}
        />
        <Route
          path="/clients/:id/appointments/:appointmentId/forms/all"
          element={<p>All forms page</p>}
        />
        <Route path="/clients/:clientId/notes" element={<p>Notes page</p>} />
        <Route
          path="/clients/:id/appointments/:appointmentId/signature"
          element={<p>Signature page</p>}
        />
      </Routes>
    </MemoryRouter>,
  );
}

describe("ClientsFormsForAppointments", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("shows a signed appointment as signed, with no way to sign again", async () => {
    mocked.getFilledFormsByAppointment.mockResolvedValue({
      data: { filledForms: forms("signed") },
    } as never);
    mocked.getAppointmentById.mockResolvedValue({
      data: { appointment: { signed: true, allFormsCompleted: true } },
    } as never);
    renderPage();

    // the appointment's chip (each form card also says Signed)
    expect(
      await screen.findByText("Signed", { selector: ".signed-chip" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Sign Forms" }),
    ).toBeNull();
  });

  it("opens every form from the View Forms button", async () => {
    mocked.getFilledFormsByAppointment.mockResolvedValue({
      data: { filledForms: forms("signed") },
    } as never);
    mocked.getAppointmentById.mockResolvedValue({
      data: { appointment: { signed: true, allFormsCompleted: true } },
    } as never);
    const user = userEvent.setup();
    renderPage();

    await user.click(
      await screen.findByRole("button", { name: "View all forms" }),
    );
    expect(await screen.findByText("All forms page")).toBeInTheDocument();
  });

  it("opens the client's notes", async () => {
    mocked.getFilledFormsByAppointment.mockResolvedValue({
      data: { filledForms: forms("signed") },
    } as never);
    mocked.getAppointmentById.mockResolvedValue({
      data: { appointment: { signed: true, allFormsCompleted: true } },
    } as never);
    const user = userEvent.setup();
    renderPage();

    await user.click(await screen.findByRole("button", { name: "View notes" }));
    expect(await screen.findByText("Notes page")).toBeInTheDocument();
  });

  it("lets a completed, unsigned appointment go to signing", async () => {
    mocked.getFilledFormsByAppointment.mockResolvedValue({
      data: { filledForms: forms("completed") },
    } as never);
    mocked.getAppointmentById.mockResolvedValue({
      data: { appointment: { signed: false, allFormsCompleted: true } },
    } as never);
    const user = userEvent.setup();
    renderPage();

    const sign = await screen.findByRole("button", { name: "Sign Forms" });
    expect(sign).toBeEnabled();
    await user.click(sign);
    expect(await screen.findByText("Signature page")).toBeInTheDocument();
  });

  it("blocks signing while forms are incomplete", async () => {
    mocked.getFilledFormsByAppointment.mockResolvedValue({
      data: { filledForms: forms("incomplete") },
    } as never);
    mocked.getAppointmentById.mockResolvedValue({
      data: { appointment: { signed: false, allFormsCompleted: false } },
    } as never);
    renderPage();

    expect(
      await screen.findByRole("button", { name: "Sign Forms" }),
    ).toBeDisabled();
  });

  it("shows the appointment and which service each form is for", async () => {
    mocked.getFilledFormsByAppointment.mockResolvedValue({
      data: {
        filledForms: [
          {
            id: "f1",
            title: "Microblading Aftercare",
            formTemplateId: "t1",
            status: "completed",
            formTemplate: { services: [1] },
            createdAt: "2026-11-18T10:00:00.000Z",
            updatedAt: "2026-11-19T10:00:00.000Z",
          },
          {
            id: "f2",
            title: "Freckles Consent",
            formTemplateId: "t2",
            status: "incomplete",
            formTemplate: { services: [7, 100001] },
            createdAt: "2026-11-18T10:00:00.000Z",
            updatedAt: "2026-11-18T10:00:00.000Z",
          },
          {
            id: "f3",
            title: "Client Intake",
            formTemplateId: "t3",
            status: "incomplete",
            formTemplate: { services: [] },
            createdAt: "2026-11-18T10:00:00.000Z",
            updatedAt: "2026-11-18T10:00:00.000Z",
          },
        ],
      },
    } as never);
    mocked.getAppointmentById.mockResolvedValue({
      data: {
        appointment: {
          signed: false,
          allFormsCompleted: false,
          date: "2026-12-01T15:00:00.000Z",
          serviceDetails: [
            { _id: "a", id: 1, service: "Microblading" },
            { _id: "b", id: 100001, service: "Freckles" },
          ],
        },
      },
    } as never);
    renderPage();

    expect(
      await screen.findByRole("heading", { name: "Forms for Jane Doe's appointment" }),
    ).toBeInTheDocument();
    const summary = screen.getByRole("region", { name: "Appointment" });
    expect(within(summary).getByText("Microblading")).toBeInTheDocument();
    expect(within(summary).getByText("Freckles")).toBeInTheDocument();
    expect(within(summary).getByText(/Dec 1/)).toBeInTheDocument();
    expect(within(summary).getByText("1 of 3 filled")).toBeInTheDocument();

    const aftercare = screen.getByRole("button", { name: /Open Microblading Aftercare/ });
    expect(aftercare).toHaveTextContent("For Microblading");
    expect(aftercare).toHaveAccessibleName("Open Microblading Aftercare, Filled");
    // only this appointment's services, not every service the form covers
    const consent = screen.getByRole("button", { name: /Open Freckles Consent/ });
    expect(consent).toHaveTextContent("For Freckles");
    expect(consent).toHaveTextContent("Waiting for client");
    expect(consent).toHaveTextContent("Not yet");
    expect(screen.getByRole("button", { name: /Open Client Intake/ })).toHaveTextContent(
      "For this appointment",
    );
  });
});
