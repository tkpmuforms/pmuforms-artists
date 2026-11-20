import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ClientsFormsForAppointments from "./ClientsFormsForAppointments";
import * as api from "../../../services/artistServices";

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

    expect(await screen.findByText("Signed")).toBeInTheDocument();
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
      await screen.findByRole("button", { name: "View Forms" }),
    );
    expect(await screen.findByText("All forms page")).toBeInTheDocument();
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
});
