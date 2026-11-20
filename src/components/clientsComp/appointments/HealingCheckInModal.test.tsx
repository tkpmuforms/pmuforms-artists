import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import toast from "react-hot-toast";
import { beforeEach, describe, expect, it, vi } from "vitest";
import HealingCheckInModal from "./HealingCheckInModal";
import * as api from "../../../services/artistServices";

vi.mock("../../../services/artistServices", async (importOriginal) => ({
  // keep the real CHECK_IN_DELAY_LIMITS
  ...(await importOriginal<typeof api>()),
  draftCheckIn: vi.fn(),
  scheduleCheckIn: vi.fn(),
  cancelScheduledMessage: vi.fn(),
  getClientMessages: vi.fn(),
}));
vi.mock("react-hot-toast", () => ({
  default: { error: vi.fn(), success: vi.fn() },
}));

const mocked = vi.mocked(api);

const draft = (overrides: Partial<api.CheckInDraft> = {}): api.CheckInDraft => ({
  subject: "How is your Microblading healing?",
  message: "Hi Jane,\n\nJust checking in.",
  source: "template",
  aiAvailable: true,
  aiFailed: false,
  to: "jane@example.com",
  sendAt: "2026-12-03T20:00:00.000Z",
  ...overrides,
});

const renderModal = () => {
  const onDone = vi.fn();
  render(
    <HealingCheckInModal
      appointmentId="appt-1"
      clientName="Jane Doe"
      onClose={vi.fn()}
      onDone={onDone}
    />,
  );
  return { onDone };
};

const setTiming = async (
  user: ReturnType<typeof userEvent.setup>,
  amount: string,
  unit: api.DelayUnit,
) => {
  await user.selectOptions(
    screen.getByRole("combobox", { name: "Days, weeks or months" }),
    unit,
  );
  await user.type(screen.getByRole("spinbutton", { name: "How many" }), amount);
};

describe("HealingCheckInModal", () => {
  beforeEach(() => {
    mocked.getClientMessages.mockResolvedValue({
      data: { messages: [] },
    } as never);
    mocked.draftCheckIn.mockResolvedValue({ data: draft() } as never);
  });

  it("asks for the timing before anything else", () => {
    renderModal();

    expect(screen.queryByLabelText("Check-in message")).toBeNull();
    expect(
      screen.getByText("Set when it goes out first, then write the message."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Schedule check-in" }),
    ).toBeDisabled();
    expect(
      Array.from(
        screen.getByRole("combobox", { name: "Days, weeks or months" })
          .querySelectorAll("option"),
      ).map((o) => o.value),
    ).toEqual(["days", "weeks", "months"]);
  });

  it("schedules the message for the chosen time, with a photo request", async () => {
    mocked.scheduleCheckIn.mockResolvedValue({
      data: {
        message: { id: "m1", sendAt: "2026-12-03T20:00:00.000Z" },
      },
    } as never);
    const user = userEvent.setup();
    const { onDone } = renderModal();

    await setTiming(user, "2", "weeks");
    // the standard message fills in once the timing is set
    await waitFor(() =>
      expect(screen.getByLabelText("Check-in message")).toHaveValue(
        "Hi Jane,\n\nJust checking in.",
      ),
    );
    expect(
      screen.getByText(/^Goes out .* \(always during the day for Jane\)\.$/),
    ).toBeInTheDocument();
    expect(mocked.draftCheckIn).toHaveBeenLastCalledWith("appt-1", {
      amount: 2,
      unit: "weeks",
      requestPhoto: false,
      useAi: false,
    });

    await user.click(
      screen.getByRole("checkbox", { name: /ask jane to send a photo/i }),
    );
    await user.clear(screen.getByLabelText("Check-in message"));
    await user.type(screen.getByLabelText("Check-in message"), "Hi Jane! How is it?");
    await user.click(screen.getByRole("button", { name: "Schedule check-in" }));

    expect(mocked.scheduleCheckIn).toHaveBeenCalledWith("appt-1", {
      amount: 2,
      unit: "weeks",
      requestPhoto: true,
      subject: "How is your Microblading healing?",
      message: "Hi Jane! How is it?",
    });
    expect(onDone).toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalledWith(
      expect.stringMatching(/^Check-in scheduled for/),
    );
  });

  it("keeps each unit within its limit", async () => {
    const user = userEvent.setup();
    renderModal();

    await setTiming(user, "13", "months");

    expect(
      screen.getByText("Choose between 1 and 12 months."),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText("Check-in message")).toBeNull();
    expect(mocked.draftCheckIn).not.toHaveBeenCalled();
  });

  it("lets AI write the message", async () => {
    const user = userEvent.setup();
    renderModal();

    await setTiming(user, "3", "days");
    const writeWithAi = await screen.findByRole("button", {
      name: "Write with AI",
    });
    mocked.draftCheckIn.mockResolvedValueOnce({
      data: draft({ source: "ai", message: "Hi Jane! Day 3 is when..." }),
    } as never);
    await user.click(writeWithAi);

    await waitFor(() =>
      expect(screen.getByLabelText("Check-in message")).toHaveValue(
        "Hi Jane! Day 3 is when...",
      ),
    );
    expect(mocked.draftCheckIn).toHaveBeenLastCalledWith(
      "appt-1",
      expect.objectContaining({ useAi: true }),
    );
    expect(
      screen.getByText("Written by AI, please review"),
    ).toBeInTheDocument();
  });

  it("doesn't replace what the artist typed when the timing changes", async () => {
    const user = userEvent.setup();
    renderModal();

    await setTiming(user, "3", "days");
    const message = await screen.findByLabelText("Check-in message");
    await waitFor(() => expect(message).not.toHaveValue(""));
    await user.clear(message);
    await user.type(message, "My own words");
    mocked.draftCheckIn.mockResolvedValue({
      data: draft({ message: "Standard text", sendAt: "2026-12-10T20:00:00Z" }),
    } as never);

    await user.selectOptions(
      screen.getByRole("combobox", { name: "Days, weeks or months" }),
      "weeks",
    );

    await waitFor(() =>
      expect(mocked.draftCheckIn).toHaveBeenLastCalledWith(
        "appt-1",
        expect.objectContaining({ unit: "weeks" }),
      ),
    );
    expect(screen.getByLabelText("Check-in message")).toHaveValue("My own words");
  });

  it("lists scheduled check-ins and cancels one", async () => {
    mocked.getClientMessages.mockResolvedValue({
      data: {
        messages: [
          {
            id: "m1",
            type: "healing-check-in",
            status: "scheduled",
            subject: "Two week check-in",
            sendAt: "2026-12-03T20:00:00.000Z",
          },
          {
            id: "m0",
            type: "healing-check-in",
            status: "sent",
            subject: "Day 3",
            sentAt: "2026-11-15T20:00:00.000Z",
            photoUrls: ["https://storage.example.com/p.jpg"],
          },
          // other emails aren't check-ins
          { id: "x", type: "aftercare", status: "sent", subject: "Aftercare" },
        ],
      },
    } as never);
    mocked.cancelScheduledMessage.mockResolvedValue({ data: {} } as never);
    const user = userEvent.setup();
    renderModal();

    expect(await screen.findByText("Two week check-in")).toBeInTheDocument();
    expect(screen.getByAltText("Healing photo 1")).toBeInTheDocument();
    expect(screen.queryByText("Aftercare")).toBeNull();

    const list = screen.getByRole("list", { name: "Check-ins" });
    // only the scheduled one can be cancelled
    expect(within(list).getAllByRole("button", { name: "Cancel" })).toHaveLength(1);
    await user.click(within(list).getByRole("button", { name: "Cancel" }));
    expect(mocked.cancelScheduledMessage).toHaveBeenCalledWith("appt-1", "m1");
    await waitFor(() =>
      expect(screen.queryByText("Two week check-in")).toBeNull(),
    );
  });
});
