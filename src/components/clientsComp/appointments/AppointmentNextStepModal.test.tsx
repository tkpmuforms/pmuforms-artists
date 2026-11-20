import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AppointmentNextStepModal from "./AppointmentNextStepModal";
import * as api from "../../../services/artistServices";

vi.mock("../../../services/artistServices", async (importOriginal) => ({
  ...(await importOriginal<typeof api>()),
  previewCareMessage: vi.fn(),
  sendCareMessage: vi.fn(),
  getClientMessages: vi.fn(),
  completeAppointment: vi.fn(),
  draftCheckIn: vi.fn(),
  scheduleCheckIn: vi.fn(),
  cancelScheduledMessage: vi.fn(),
}));
vi.mock("react-hot-toast", () => ({
  default: { error: vi.fn(), success: vi.fn() },
}));

const mocked = vi.mocked(api);

const renderModal = () => {
  const onFinish = vi.fn();
  render(
    <AppointmentNextStepModal
      appointmentId="appt-1"
      clientName="Jane Doe"
      onFinish={onFinish}
    />,
  );
  return { onFinish };
};

describe("AppointmentNextStepModal (after signing)", () => {
  beforeEach(() => {
    mocked.getClientMessages.mockResolvedValue({
      data: { messages: [] },
    } as never);
  });

  it("offers a healing check-in among the next steps", async () => {
    const user = userEvent.setup();
    renderModal();

    await user.click(
      screen.getByRole("button", { name: /send healing check-in/i }),
    );
    expect(
      screen.getByRole("dialog", { name: "Send healing check-in" }),
    ).toBeInTheDocument();

    // closing goes back to the choices
    await user.click(screen.getByRole("button", { name: "Close" }));
    expect(
      screen.getByRole("dialog", { name: "Forms signed" }),
    ).toBeInTheDocument();
  });

  it("marks complete and schedules the check-in in one step", async () => {
    mocked.draftCheckIn.mockResolvedValue({
      data: {
        subject: "Checking in",
        message: "Hi Jane",
        source: "template",
        aiAvailable: false,
        aiFailed: false,
        to: "jane@example.com",
        sendAt: "2026-12-03T20:00:00.000Z",
      },
    } as never);
    mocked.completeAppointment.mockResolvedValue({
      data: {
        appointment: { id: "appt-1", completedAt: "2026-11-19T20:00:00Z" },
        aftercare: null,
        aftercareError: null,
        checkIn: { id: "m1", sendAt: "2026-12-03T20:00:00.000Z" },
        checkInError: null,
      },
    } as never);
    const user = userEvent.setup();
    const { onFinish } = renderModal();

    await user.click(screen.getByRole("button", { name: /^mark as complete/i }));
    await user.click(
      screen.getByRole("checkbox", {
        name: "Schedule a healing check-in for later",
      }),
    );
    await user.type(screen.getByRole("spinbutton", { name: "How many" }), "5");
    await waitFor(() =>
      expect(screen.getByLabelText("Check-in message")).toHaveValue("Hi Jane"),
    );
    await user.click(
      screen.getByRole("button", { name: "Mark as complete & schedule check-in" }),
    );

    expect(mocked.completeAppointment).toHaveBeenCalledWith(
      "appt-1",
      expect.objectContaining({
        checkIn: expect.objectContaining({ amount: 5, unit: "days" }),
      }),
    );
    // done: no second modal to fill in
    expect(onFinish).toHaveBeenCalled();
    expect(mocked.scheduleCheckIn).not.toHaveBeenCalled();
  });
});
