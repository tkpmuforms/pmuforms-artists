import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import toast from "react-hot-toast";
import * as api from "../../services/paymentServices";
import type { PaymentRequest, SquarePaymentStatus } from "../../services/paymentServices";
import AppointmentPayments from "./AppointmentPayments";

vi.mock("../../services/paymentServices", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../services/paymentServices")>();
  return {
    ...actual,
    getSquarePaymentStatus: vi.fn(),
    getPaymentRequests: vi.fn(),
    createPaymentRequest: vi.fn(),
    resendPaymentRequest: vi.fn(),
    refreshPaymentRequest: vi.fn(),
    cancelPaymentRequest: vi.fn(),
  };
});
vi.mock("react-hot-toast", () => ({ default: { success: vi.fn(), error: vi.fn() } }));
let mockUser: { stripeSubscriptionActive?: boolean } = { stripeSubscriptionActive: true };
vi.mock("../../context/useAuth", () => ({ default: () => ({ user: mockUser }) }));
vi.mock("../dashboardComp/SubScriptionModal", () => ({
  default: () => <p>Plans</p>,
}));

const mocked = vi.mocked(api);
const ok = <T,>(data: T) => Promise.resolve({ data }) as never;

const status = (over: Partial<SquarePaymentStatus> = {}): SquarePaymentStatus => ({
  connected: true,
  reconnectRequired: false,
  paymentsEnabled: true,
  accountName: "Brow Studio",
  locationName: "Main",
  currency: "USD",
  ...over,
});

const request = (over: Partial<PaymentRequest> = {}): PaymentRequest => ({
  id: "pr1",
  appointmentId: "a1",
  customerId: "c1",
  kind: "deposit",
  status: "pending",
  amount: "50.00",
  amountLabel: "$50.00",
  currency: "USD",
  title: "Deposit: Microblading · Dec 1, 2026",
  note: null,
  url: "https://square.link/u/abc",
  amountPaid: null,
  amountRefunded: null,
  receiptUrl: null,
  paidAt: null,
  sentTo: "jane@example.com",
  lastSentAt: "2026-11-23T10:00:00Z",
  canceledAt: null,
  createdAt: "2026-11-23T10:00:00Z",
  ...over,
});

const renderSection = () =>
  render(
    <MemoryRouter>
      <AppointmentPayments appointmentId="a1" clientName="Jane Smith" />
    </MemoryRouter>,
  );

beforeEach(() => {
  vi.clearAllMocks();
  mockUser = { stripeSubscriptionActive: true };
  mocked.getPaymentRequests.mockReturnValue(ok({ requests: [] }));
});

describe("Appointment payments", () => {
  it("is not shown at all without Square connected", async () => {
    mocked.getSquarePaymentStatus.mockReturnValue(
      ok(status({ connected: false, paymentsEnabled: false })),
    );
    const { container } = renderSection();
    await waitFor(() => expect(mocked.getSquarePaymentStatus).toHaveBeenCalled());
    expect(container).toBeEmptyDOMElement();
    expect(mocked.getPaymentRequests).not.toHaveBeenCalled();
  });

  it("asks older Square connections to reconnect", async () => {
    mocked.getSquarePaymentStatus.mockReturnValue(
      ok(status({ paymentsEnabled: false, reconnectRequired: true })),
    );
    renderSection();
    expect(await screen.findByText(/Reconnect Square to request deposits/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Go to Integrations" })).toHaveAttribute(
      "href",
      "/integrations",
    );
    expect(screen.queryByRole("button", { name: /Request payment/ })).not.toBeInTheDocument();
  });

  it("creates a link for the amount exactly as typed and emails it", async () => {
    mocked.getSquarePaymentStatus.mockReturnValue(ok(status()));
    mocked.createPaymentRequest.mockReturnValue(
      ok({ request: request({ amount: "49.99", amountLabel: "$49.99" }), emailSent: true }),
    );
    renderSection();

    fireEvent.click(await screen.findByRole("button", { name: /Request payment/ }));
    const dialog = screen.getByRole("dialog", { name: "Request payment" });
    fireEvent.change(within(dialog).getByLabelText("Amount (USD)"), {
      target: { value: "49.99" },
    });
    fireEvent.change(within(dialog).getByLabelText(/Message to the client/), {
      target: { value: "Holds your spot." },
    });
    fireEvent.click(within(dialog).getByRole("button", { name: "Create & email link" }));

    await screen.findByText("Deposit · $49.99");
    expect(mocked.createPaymentRequest).toHaveBeenCalledWith({
      appointmentId: "a1",
      kind: "deposit",
      amount: "49.99",
      note: "Holds your spot.",
      sendEmail: true,
      requestId: expect.any(String),
    });
    expect(toast.success).toHaveBeenCalledWith("Payment link emailed to jane@example.com");
  });

  it("checks the amount before calling Square", async () => {
    mocked.getSquarePaymentStatus.mockReturnValue(ok(status()));
    renderSection();
    fireEvent.click(await screen.findByRole("button", { name: /Request payment/ }));
    fireEvent.change(screen.getByLabelText("Amount (USD)"), { target: { value: "12.345" } });
    fireEvent.click(screen.getByRole("button", { name: "Create & email link" }));
    expect(screen.getByText(/Enter an amount greater than zero/)).toBeInTheDocument();
    expect(mocked.createPaymentRequest).not.toHaveBeenCalled();
  });

  it("keeps the link when the email couldn't be sent", async () => {
    mocked.getSquarePaymentStatus.mockReturnValue(ok(status()));
    mocked.createPaymentRequest.mockReturnValue(
      ok({
        request: request({ sentTo: null, lastSentAt: null }),
        emailSent: false,
        emailError: "This client has no email address.",
      }),
    );
    renderSection();
    fireEvent.click(await screen.findByRole("button", { name: /Request payment/ }));
    fireEvent.change(screen.getByLabelText("Amount (USD)"), { target: { value: "50" } });
    fireEvent.click(screen.getByRole("button", { name: "Create & email link" }));

    await screen.findByText(/not emailed/);
    expect(toast.error).toHaveBeenCalledWith(
      "Link created, but not emailed: This client has no email address.",
    );
    expect(screen.getByRole("button", { name: /Copy link/ })).toBeInTheDocument();
  });

  it("shows paid requests with their receipt and no link to share", async () => {
    mocked.getSquarePaymentStatus.mockReturnValue(ok(status()));
    mocked.getPaymentRequests.mockReturnValue(
      ok({
        requests: [
          request({
            status: "paid",
            url: null,
            amountPaid: "50.00",
            paidAt: "2026-11-24T10:00:00Z",
            receiptUrl: "https://squareup.com/receipt/preview/PAY_1",
          }),
        ],
      }),
    );
    renderSection();
    expect(await screen.findByText("Paid", { selector: ".inv-badge" })).toBeInTheDocument();
    expect(screen.getByText(/Payment received/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Receipt/ })).toHaveAttribute(
      "href",
      "https://squareup.com/receipt/preview/PAY_1",
    );
    expect(screen.queryByRole("button", { name: /Copy link/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Cancel/ })).not.toBeInTheDocument();
  });

  it("checks with Square for a payment", async () => {
    mocked.getSquarePaymentStatus.mockReturnValue(ok(status()));
    mocked.getPaymentRequests.mockReturnValue(ok({ requests: [request()] }));
    mocked.refreshPaymentRequest.mockReturnValue(
      ok({ request: request({ status: "paid", url: null }) }),
    );
    renderSection();

    fireEvent.click(await screen.findByRole("button", { name: /Check status/ }));
    expect(await screen.findByText("Paid", { selector: ".inv-badge" })).toBeInTheDocument();
    expect(toast.success).toHaveBeenCalledWith("Paid!");
    expect(mocked.refreshPaymentRequest).toHaveBeenCalledWith("pr1");
  });

  it("cancels a pending link once the artist confirms", async () => {
    mocked.getSquarePaymentStatus.mockReturnValue(ok(status()));
    mocked.getPaymentRequests.mockReturnValue(ok({ requests: [request()] }));
    mocked.cancelPaymentRequest.mockReturnValue(
      ok({ request: request({ status: "canceled", url: null, canceledAt: "2026-11-23T12:00:00Z" }) }),
    );
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    renderSection();

    fireEvent.click(await screen.findByRole("button", { name: /Cancel/ }));
    expect(mocked.cancelPaymentRequest).not.toHaveBeenCalled();

    confirm.mockReturnValue(true);
    fireEvent.click(screen.getByRole("button", { name: /Cancel/ }));
    expect(await screen.findByText("Canceled", { selector: ".inv-badge" })).toBeInTheDocument();
    expect(mocked.cancelPaymentRequest).toHaveBeenCalledWith("pr1");
    confirm.mockRestore();
  });

  it("shows Square's reason when a request fails", async () => {
    mocked.getSquarePaymentStatus.mockReturnValue(ok(status()));
    mocked.createPaymentRequest.mockImplementation(
      () =>
        Promise.reject({
          code: "square_rejected",
          message: "Amount must be at least 100 cents",
        }) as never,
    );
    renderSection();
    fireEvent.click(await screen.findByRole("button", { name: /Request payment/ }));
    fireEvent.change(screen.getByLabelText("Amount (USD)"), { target: { value: "0.50" } });
    fireEvent.click(screen.getByRole("button", { name: "Create & email link" }));
    expect(await screen.findByText("Amount must be at least 100 cents")).toBeInTheDocument();
  });

  it("without a subscription, shows past requests but can't send new ones", async () => {
    mockUser = { stripeSubscriptionActive: false };
    mocked.getSquarePaymentStatus.mockReturnValue(ok(status()));
    mocked.getPaymentRequests.mockReturnValue(ok({ requests: [request()] }));
    renderSection();

    // past requests still load and can be checked
    expect(await screen.findByRole("button", { name: /Check status/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Request payment/ })).toBeNull();
    expect(screen.queryByRole("button", { name: /Email again/ })).toBeNull();
    // still able to check on or turn off a link already sent
    expect(screen.getByRole("button", { name: /Copy link/ })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "See plans" }));
    expect(screen.getByText("Plans")).toBeInTheDocument();
  });
});
