import { render, screen, waitFor } from "@testing-library/react";
import toast from "react-hot-toast";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import CareMessageModal from "./CareMessageModal";
import * as api from "../../../services/artistServices";

vi.mock("../../../services/artistServices", async (importOriginal) => ({
  ...(await importOriginal<typeof api>()),
  previewCareMessage: vi.fn(),
  sendCareMessage: vi.fn(),
  getClientMessages: vi.fn(),
  completeAppointment: vi.fn(),
  draftCheckIn: vi.fn(),
}));
vi.mock("react-hot-toast", () => ({
  default: { error: vi.fn(), success: vi.fn() },
}));

const mocked = vi.mocked(api);

const draft = (overrides: Partial<api.CareDraft> = {}): api.CareDraft => ({
  content: {
    subject: "Aftercare for your Touch-up",
    intro: "Hi Jane,",
    sections: [{ heading: "First 7 days", items: ["Keep the area dry"] }],
    closing: "Reply with any questions.",
  },
  source: "template",
  hasForm: true,
  formTitles: ["Touch-up Aftercare"],
  aiFailed: false,
  aiAvailable: true,
  to: "jane@example.com",
  ...overrides,
});

const renderModal = (props: Partial<React.ComponentProps<typeof CareMessageModal>> = {}) => {
  const onDone = vi.fn();
  render(
    <CareMessageModal
      appointmentId="appt-1"
      clientName="Jane Doe"
      kind="aftercare"
      onClose={vi.fn()}
      onDone={onDone}
      {...props}
    />,
  );
  return { onDone };
};

describe("CareMessageModal", () => {
  beforeEach(() => {
    mocked.getClientMessages.mockResolvedValue({
      data: { messages: [] },
    } as never);
    mocked.previewCareMessage.mockResolvedValue({ data: draft() } as never);
  });

  describe("mark complete", () => {
    it("leaves the email box unchecked and fetches nothing until it's ticked", async () => {
      renderModal({ mode: "complete" });

      const emailBox = screen.getByRole("checkbox", {
        name: /email aftercare instructions to jane now/i,
      });
      expect(emailBox).not.toBeChecked();
      expect(mocked.previewCareMessage).not.toHaveBeenCalled();
      expect(screen.queryByLabelText("Subject")).toBeNull();
      expect(
        screen.getByRole("button", { name: "Mark as complete" }),
      ).toBeEnabled();
    });

    it("marks complete without emailing the client by default", async () => {
      mocked.completeAppointment.mockResolvedValue({
        data: {
          appointment: { id: "appt-1", completedAt: "2026-11-19T20:00:00Z" },
          aftercare: null,
          aftercareError: null,
        },
      } as never);
      const user = userEvent.setup();
      const { onDone } = renderModal({ mode: "complete" });

      await user.click(screen.getByRole("button", { name: "Mark as complete" }));

      expect(mocked.completeAppointment).toHaveBeenCalledWith("appt-1", {
        sendAftercare: false,
        aftercare: undefined,
      });
      expect(onDone).toHaveBeenCalledWith({
        completedAt: "2026-11-19T20:00:00Z",
      });
    });

    it("loads and sends the aftercare once the box is ticked", async () => {
      mocked.completeAppointment.mockResolvedValue({
        data: {
          appointment: { id: "appt-1", completedAt: "2026-11-19T20:00:00Z" },
          aftercare: {},
          aftercareError: null,
        },
      } as never);
      const user = userEvent.setup();
      renderModal({ mode: "complete" });

      await user.click(
        screen.getByRole("checkbox", { name: /email aftercare/i }),
      );
      expect(await screen.findByLabelText("Subject")).toHaveValue(
        "Aftercare for your Touch-up",
      );
      expect(mocked.previewCareMessage).toHaveBeenCalledTimes(1);
      // free form from the artist's form; AI only when they ask
      expect(mocked.previewCareMessage).toHaveBeenCalledWith(
        "appt-1",
        "aftercare",
        false,
      );

      await user.click(
        screen.getByRole("button", { name: "Mark as complete & send aftercare" }),
      );
      expect(mocked.completeAppointment).toHaveBeenCalledWith("appt-1", {
        sendAftercare: true,
        aftercare: {
          subject: "Aftercare for your Touch-up",
          intro: "Hi Jane,",
          sections: [{ heading: "First 7 days", items: ["Keep the area dry"] }],
          closing: "Reply with any questions.",
        },
      });
    });
  });

  describe("AI is opt-in", () => {
    it("starts from the form as written and uses AI only when asked", async () => {
      const user = userEvent.setup();
      renderModal();

      expect(await screen.findByLabelText("Subject")).toBeInTheDocument();
      expect(mocked.previewCareMessage).toHaveBeenCalledTimes(1);
      expect(mocked.previewCareMessage).toHaveBeenLastCalledWith(
        "appt-1",
        "aftercare",
        false,
      );

      await user.click(screen.getByRole("button", { name: "Write with AI" }));
      expect(mocked.previewCareMessage).toHaveBeenLastCalledWith(
        "appt-1",
        "aftercare",
        true,
      );
    });

    it("offers a retry when the instructions can't be loaded", async () => {
      mocked.previewCareMessage.mockRejectedValueOnce({
        message: "Network error",
      });
      const user = userEvent.setup();
      renderModal();

      await user.click(await screen.findByRole("button", { name: "Try again" }));

      expect(await screen.findByLabelText("Subject")).toBeInTheDocument();
      expect(mocked.previewCareMessage).toHaveBeenCalledTimes(2);
    });
  });

  describe("healing check-in in the same step", () => {
    const checkInDraft = {
      subject: "How is your Touch-up healing?",
      message: "Hi Jane, just checking in.",
      source: "template",
      aiAvailable: true,
      aiFailed: false,
      to: "jane@example.com",
      sendAt: "2026-12-03T20:00:00.000Z",
    };

    beforeEach(() => {
      mocked.draftCheckIn.mockResolvedValue({ data: checkInDraft } as never);
      mocked.completeAppointment.mockResolvedValue({
        data: {
          appointment: { id: "appt-1", completedAt: "2026-11-19T20:00:00Z" },
          aftercare: {},
          aftercareError: null,
          checkIn: { id: "m1", sendAt: "2026-12-03T20:00:00.000Z" },
          checkInError: null,
        },
      } as never);
    });

    it("is off by default", () => {
      renderModal({ mode: "complete" });

      expect(
        screen.getByRole("checkbox", {
          name: "Schedule a healing check-in for later",
        }),
      ).not.toBeChecked();
      expect(screen.queryByLabelText("How many")).toBeNull();
    });

    it("asks for the check-in right here, and only completes once it's ready", async () => {
      const user = userEvent.setup();
      const { onDone } = renderModal({ mode: "complete" });

      await user.click(
        screen.getByRole("checkbox", {
          name: "Schedule a healing check-in for later",
        }),
      );
      const submit = screen.getByRole("button", {
        name: "Mark as complete & schedule check-in",
      });
      // the timing has to be set first
      expect(submit).toBeDisabled();

      await user.type(screen.getByRole("spinbutton", { name: "How many" }), "2");
      await user.selectOptions(
        screen.getByRole("combobox", { name: "Days, weeks or months" }),
        "weeks",
      );
      await waitFor(() =>
        expect(screen.getByLabelText("Check-in message")).toHaveValue(
          "Hi Jane, just checking in.",
        ),
      );
      expect(screen.getByRole("list", { name: "What happens" })).toHaveTextContent(
        /A healing check-in goes out/,
      );

      await user.click(submit);

      // one request does it all
      expect(mocked.completeAppointment).toHaveBeenCalledTimes(1);
      expect(mocked.completeAppointment).toHaveBeenCalledWith("appt-1", {
        sendAftercare: false,
        aftercare: undefined,
        checkIn: {
          amount: 2,
          unit: "weeks",
          requestPhoto: false,
          subject: "How is your Touch-up healing?",
          message: "Hi Jane, just checking in.",
        },
      });
      expect(toast.success).toHaveBeenCalledWith(
        expect.stringMatching(/^Marked complete\. Check-in scheduled for /),
      );
      expect(onDone).toHaveBeenCalledWith({
        completedAt: "2026-11-19T20:00:00Z",
      });
    });

    it("does all three with one button when aftercare is ticked too", async () => {
      const user = userEvent.setup();
      renderModal({ mode: "complete" });

      await user.click(screen.getByRole("checkbox", { name: /email aftercare/i }));
      await user.click(
        screen.getByRole("checkbox", {
          name: "Schedule a healing check-in for later",
        }),
      );
      expect(await screen.findByLabelText("Subject")).toHaveValue(
        "Aftercare for your Touch-up",
      );
      await user.type(screen.getByRole("spinbutton", { name: "How many" }), "3");
      await waitFor(() =>
        expect(screen.getByLabelText("Check-in message")).not.toHaveValue(""),
      );

      const summary = screen.getByRole("list", { name: "What happens" });
      expect(summary).toHaveTextContent("The appointment is marked complete");
      expect(summary).toHaveTextContent(
        "Aftercare is emailed to jane@example.com now",
      );
      expect(summary).toHaveTextContent("A healing check-in goes out");

      await user.click(
        screen.getByRole("button", { name: "Mark as complete, send & schedule" }),
      );

      expect(mocked.completeAppointment).toHaveBeenCalledWith(
        "appt-1",
        expect.objectContaining({
          sendAftercare: true,
          aftercare: expect.objectContaining({
            subject: "Aftercare for your Touch-up",
          }),
          checkIn: expect.objectContaining({ amount: 3, unit: "days" }),
        }),
      );
      expect(toast.success).toHaveBeenCalledWith(
        expect.stringMatching(
          /^Marked complete\. Aftercare sent to Jane\. Check-in scheduled for /,
        ),
      );
    });

    it("says what didn't go through when the check-in fails after completing", async () => {
      mocked.completeAppointment.mockResolvedValue({
        data: {
          appointment: { id: "appt-1", completedAt: "2026-11-19T20:00:00Z" },
          aftercare: null,
          aftercareError: null,
          checkIn: null,
          checkInError: "Database down",
        },
      } as never);
      const user = userEvent.setup();
      const { onDone } = renderModal({ mode: "complete" });

      await user.click(
        screen.getByRole("checkbox", {
          name: "Schedule a healing check-in for later",
        }),
      );
      await user.type(screen.getByRole("spinbutton", { name: "How many" }), "3");
      await waitFor(() =>
        expect(screen.getByLabelText("Check-in message")).not.toHaveValue(""),
      );
      await user.click(
        screen.getByRole("button", { name: "Mark as complete & schedule check-in" }),
      );

      expect(toast.error).toHaveBeenCalledWith(
        "The check-in wasn't scheduled: Database down",
      );
      expect(onDone).toHaveBeenCalled();
    });
  });

  describe("where the instructions come from", () => {
    it("names the form a template draft came from", async () => {
      renderModal();

      expect(
        await screen.findByText(/from your form "Touch-up Aftercare"/i),
      ).toBeInTheDocument();
    });

    it("names the forms an AI draft was written from", async () => {
      mocked.previewCareMessage.mockResolvedValue({
        data: draft({ source: "ai" }),
      } as never);
      renderModal();

      expect(
        await screen.findByText(
          /written by ai from "Touch-up Aftercare", please review/i,
        ),
      ).toBeInTheDocument();
    });

    it("says when AI failed and the form is shown as written", async () => {
      mocked.previewCareMessage.mockResolvedValue({
        data: draft({ aiFailed: true }),
      } as never);
      renderModal();

      expect(
        await screen.findByText(/AI couldn't write this one/i),
      ).toBeInTheDocument();
    });

    it("asks the artist to write it when the services have no form", async () => {
      mocked.previewCareMessage.mockResolvedValue({
        data: draft({
          content: null,
          source: null,
          hasForm: false,
          formTitles: [],
        }),
      } as never);
      renderModal();

      expect(
        await screen.findByText(/there's no aftercare form for these services/i),
      ).toBeInTheDocument();
    });
  });
});
