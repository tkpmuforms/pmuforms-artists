import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as api from "../../../services/artistServices";
import PreviewAppointmentModal from "./PreviewAppointMent";

vi.mock("../../../services/artistServices", () => ({
  getMyServiceForms: vi.fn(),
  bookAppointment: vi.fn(),
}));
vi.mock("react-hot-toast", () => ({
  default: { success: vi.fn(), error: vi.fn() },
}));
vi.mock("../../../context/useAuth", () => ({
  default: () => ({ isMember: false }),
}));

const mocked = vi.mocked(api);
const LIMIT_MESSAGE =
  "You've reached the 5 appointments allowed in December on the Starter plan. Upgrade to Pro for unlimited appointments.";

beforeEach(() => {
  vi.clearAllMocks();
  mocked.getMyServiceForms.mockResolvedValue({
    data: { forms: [{ id: 1, name: "consent", title: "Consent Form" }] },
  } as never);
});

describe("Sending forms to one client", () => {
  it("explains Starter's appointment limit with a way to upgrade", async () => {
    const alert = vi.spyOn(window, "alert").mockImplementation(() => undefined);
    mocked.bookAppointment.mockRejectedValue({
      statusCode: 403,
      message: LIMIT_MESSAGE,
      code: "STARTER_APPOINTMENT_LIMIT",
      kind: "appointments",
      limit: 5,
    });
    const onSuccess = vi.fn();
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/clients/c1"]}>
        <Routes>
          <Route
            path="/clients/c1"
            element={
              <PreviewAppointmentModal
                onClose={vi.fn()}
                onSuccess={onSuccess}
                clientId="c1"
                clientName="Jane Doe"
                appointmentDate="2026-12-20T15:00:00.000Z"
                selectedServices={["Microblading"]}
                selectedServiceIds={["1"]}
              />
            }
          />
          <Route path="/profile/payment" element={<p>Payment page</p>} />
        </Routes>
      </MemoryRouter>,
    );

    await screen.findByText("Consent Form");
    await user.click(screen.getByRole("button", { name: "Continue" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(LIMIT_MESSAGE);
    expect(alert).not.toHaveBeenCalled();
    expect(onSuccess).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Upgrade to Pro" }));
    expect(screen.getByText("Payment page")).toBeInTheDocument();
  });
});
