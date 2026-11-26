import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useLocation, useParams } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import toast from "react-hot-toast";
import ClientAppointmentPage from "./ClientsAppointment";
import * as api from "../../../services/artistServices";
import * as payments from "../../../services/paymentServices";

vi.mock("../../../services/artistServices", async (importOriginal) => ({
  ...(await importOriginal<typeof api>()),
  getCustomerById: vi.fn(),
  getAppointmentsForCustomer: vi.fn(),
  DeleteAppointment: vi.fn(),
  previewCareMessage: vi.fn(),
  sendCareMessage: vi.fn(),
  getClientMessages: vi.fn(),
  completeAppointment: vi.fn(),
  draftCheckIn: vi.fn(),
  scheduleCheckIn: vi.fn(),
  cancelScheduledMessage: vi.fn(),
}));
vi.mock("../../../services/paymentServices", async (importOriginal) => ({
  ...(await importOriginal<typeof payments>()),
  getSquarePaymentStatus: vi.fn(),
  createPaymentRequest: vi.fn(),
}));
vi.mock("react-hot-toast", () => ({
  default: { error: vi.fn(), success: vi.fn() },
}));
let mockUser: { stripeSubscriptionActive?: boolean } = { stripeSubscriptionActive: true };
vi.mock("../../../context/useAuth", () => ({ default: () => ({ user: mockUser }) }));
vi.mock("../../../components/dashboard/SubScriptionModal", () => ({
  default: () => <p>Plans</p>,
}));

const mocked = vi.mocked(api);
const mockedPayments = vi.mocked(payments);

const squareStatus = (overrides: Partial<payments.SquarePaymentStatus> = {}) =>
  ({
    data: {
      connected: true,
      reconnectRequired: false,
      paymentsEnabled: true,
      accountName: "Glow Studio",
      locationName: "Main",
      currency: "USD",
      ...overrides,
    },
  }) as never;

const notConnected = () =>
  squareStatus({ connected: false, paymentsEnabled: false, accountName: null, currency: null });

const renderPage = () =>
  render(
    <MemoryRouter
      initialEntries={[
        { pathname: "/clients/cust-1/appointments", state: { clientName: "Jane Doe" } },
      ]}
    >
      <Routes>
        <Route path="/clients/:id/appointments" element={<ClientAppointmentPage />} />
        <Route path="/integrations" element={<p>Integrations page</p>} />
        <Route
          path="/clients/:clientId/notes"
          element={<NotesProbe />}
        />
      </Routes>
    </MemoryRouter>,
  );

/** stands in for the notes page: shows which client and name it was opened with */
function NotesProbe() {
  const { clientId } = useParams();
  const { state } = useLocation();
  return (
    <p>
      Notes for {clientId} ({state?.clientName})
    </p>
  );
}

const oneAppointment = () =>
  mocked.getAppointmentsForCustomer.mockResolvedValue({
    data: {
      appointments: [
        {
          _id: "a",
          id: "appt-1",
          customerId: "cust-1",
          artistId: "artist-1",
          date: "2026-11-20T05:00:00.000Z",
          services: [1],
          serviceDetails: [{ _id: "s", id: 1, service: "Microblading" }],
          signed: false,
          allFormsCompleted: false,
          deleted: false,
          formsToFillCount: 1,
          createdAt: "2026-11-18T10:00:00.000Z",
          updatedAt: "2026-11-18T10:00:00.000Z",
        },
      ],
    },
  } as never);

const menuButton = async (name: string) => {
  const card = (await screen.findByText("Microblading")).closest(".appointment-card") as HTMLElement;
  const menu = card.querySelector(".dropdown-menu") as HTMLElement;
  return within(menu).queryByRole("button", { name });
};

describe("ClientAppointmentPage: request payment from the menu", () => {
  beforeEach(() => {
    oneAppointment();
  });

  it("opens the payment form and creates a link for that appointment", async () => {
    mockedPayments.getSquarePaymentStatus.mockResolvedValue(squareStatus());
    mockedPayments.createPaymentRequest.mockResolvedValue({
      data: {
        request: { id: "pr-1", sentTo: "jane@example.com" },
        emailSent: true,
        emailError: null,
      },
    } as never);
    const user = userEvent.setup();
    renderPage();

    await waitFor(async () => expect(await menuButton("Request payment")).not.toBeNull());
    await user.click((await menuButton("Request payment"))!);

    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText("From Jane Doe through Square")).toBeInTheDocument();
    await user.type(within(dialog).getByLabelText(/Amount \(USD\)/), "50");
    await user.click(within(dialog).getByRole("button", { name: "Create & email link" }));

    await waitFor(() =>
      expect(mockedPayments.createPaymentRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          appointmentId: "appt-1",
          kind: "deposit",
          amount: "50",
          sendEmail: true,
        }),
      ),
    );
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });

  it("doesn't offer payments without Square", async () => {
    mockedPayments.getSquarePaymentStatus.mockResolvedValue(notConnected());
    renderPage();

    await screen.findByText("Microblading");
    await waitFor(() => expect(mockedPayments.getSquarePaymentStatus).toHaveBeenCalled());
    expect(await menuButton("Request payment")).toBeNull();
  });

  it("sends artists who need to reconnect Square to Integrations", async () => {
    mockedPayments.getSquarePaymentStatus.mockResolvedValue(
      squareStatus({ paymentsEnabled: false, reconnectRequired: true }),
    );
    const user = userEvent.setup();
    renderPage();

    await waitFor(async () => expect(await menuButton("Request payment")).not.toBeNull());
    await user.click((await menuButton("Request payment"))!);

    expect(await screen.findByText("Integrations page")).toBeInTheDocument();
    expect(mockedPayments.createPaymentRequest).not.toHaveBeenCalled();
  });
});

describe("ClientAppointmentPage: mark as complete", () => {
  beforeEach(() => {
    mockedPayments.getSquarePaymentStatus.mockResolvedValue(notConnected());
    mocked.getAppointmentsForCustomer.mockResolvedValue({
      data: {
        appointments: [
          {
            _id: "a",
            id: "appt-1",
            customerId: "cust-1",
            artistId: "artist-1",
            date: "2026-11-20T05:00:00.000Z",
            services: [1],
            serviceDetails: [{ _id: "s", id: 1, service: "Microblading" }],
            signed: true,
            allFormsCompleted: true,
            deleted: false,
            formsToFillCount: 1,
            createdAt: "2026-11-18T10:00:00.000Z",
            updatedAt: "2026-11-18T10:00:00.000Z",
          },
        ],
      },
    } as never);
    mocked.getClientMessages.mockResolvedValue({ data: { messages: [] } } as never);
    mocked.previewCareMessage.mockResolvedValue({
      data: {
        content: {
          subject: "Aftercare for your Microblading",
          intro: "Hi Jane,",
          sections: [{ heading: "First 7 days", items: ["Keep it dry"] }],
          closing: "Questions? Reply.",
        },
        source: "template",
        hasForm: true,
        formTitles: ["Microblading Aftercare"],
        aiFailed: false,
        aiAvailable: true,
        to: "jane@example.com",
      },
    } as never);
    mocked.completeAppointment.mockResolvedValue({
      data: {
        appointment: { id: "appt-1", completedAt: "2026-11-19T20:00:00Z" },
        aftercare: {},
        aftercareError: null,
      },
    } as never);
  });

  it("completes, sends aftercare and schedules the check-in from one modal", async () => {
    mocked.draftCheckIn.mockResolvedValue({
      data: {
        subject: "Checking in",
        message: "Hi Jane",
        source: "template",
        aiAvailable: true,
        aiFailed: false,
        to: "jane@example.com",
        sendAt: "2026-12-03T20:00:00.000Z",
      },
    } as never);
    const user = userEvent.setup();
    renderPage();

    const prompt = await screen.findByText("Forms signed. Procedure done?");
    await user.click(
      within(prompt.closest(".next-step") as HTMLElement).getByRole("button", {
        name: "Mark as complete",
      }),
    );
    await user.click(screen.getByRole("checkbox", { name: /email aftercare/i }));
    await user.click(
      screen.getByRole("checkbox", {
        name: "Schedule a healing check-in for later",
      }),
    );
    await screen.findByLabelText("Subject");
    // no AI unless asked
    expect(mocked.previewCareMessage).toHaveBeenCalledWith(
      "appt-1",
      "aftercare",
      false,
    );
    await user.type(screen.getByRole("spinbutton", { name: "How many" }), "1");
    await user.selectOptions(
      screen.getByRole("combobox", { name: "Days, weeks or months" }),
      "weeks",
    );
    await waitFor(() =>
      expect(screen.getByLabelText("Check-in message")).toHaveValue("Hi Jane"),
    );
    await user.click(
      screen.getByRole("button", { name: "Mark as complete, send & schedule" }),
    );

    expect(mocked.completeAppointment).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(screen.getByText("Completed")).toBeInTheDocument());
    // everything happened in that one step
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});

describe("ClientAppointmentPage: the ⋯ menu", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUser = { stripeSubscriptionActive: true };
    oneAppointment();
    mockedPayments.getSquarePaymentStatus.mockResolvedValue(squareStatus());
  });

  it("shows plans instead of the payment form without a subscription", async () => {
    mockUser = {};
    const user = userEvent.setup();
    renderPage();

    await waitFor(async () => expect(await menuButton("Request payment")).not.toBeNull());
    await user.click((await menuButton("Request payment"))!);
    expect(screen.getByText("Plans")).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("says why when an appointment can't be deleted", async () => {
    mocked.DeleteAppointment.mockRejectedValue({
      message: "This appointment has products recorded on it.",
    });
    const user = userEvent.setup();
    renderPage();

    await user.click((await menuButton("Delete"))!);
    await user.click(
      within(
        document.querySelector(".delete-client-confirm-modal") as HTMLElement,
      ).getByRole("button", { name: "Delete" }),
    );
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        "This appointment has products recorded on it.",
      ),
    );
    // still listed
    expect(screen.getByText("Microblading")).toBeInTheDocument();
  });

  it("removes the card once deleted", async () => {
    mocked.DeleteAppointment.mockResolvedValue({} as never);
    const user = userEvent.setup();
    renderPage();

    await user.click((await menuButton("Delete"))!);
    await user.click(
      within(
        document.querySelector(".delete-client-confirm-modal") as HTMLElement,
      ).getByRole("button", { name: "Delete" }),
    );
    await waitFor(() => expect(screen.queryByText("Microblading")).toBeNull());
    expect(mocked.DeleteAppointment).toHaveBeenCalledWith("appt-1");
  });
});

describe("ClientAppointmentPage: view notes from the menu", () => {
  it("opens the client's notes, right after View Forms", async () => {
    oneAppointment();
    mockedPayments.getSquarePaymentStatus.mockResolvedValue(notConnected());
    const user = userEvent.setup();
    renderPage();

    const viewNotes = (await menuButton("View Notes"))!;
    expect(viewNotes.previousElementSibling).toHaveTextContent("View Forms");
    await user.click(viewNotes);
    expect(await screen.findByText("Notes for cust-1 (Jane Doe)")).toBeInTheDocument();
  });
});
