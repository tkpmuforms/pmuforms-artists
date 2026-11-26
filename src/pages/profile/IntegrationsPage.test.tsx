import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as api from "../../services/artistServices";
import IntegrationsPage from "./IntegrationsPage";

vi.mock("../../services/artistServices", async (importOriginal) => ({
  ...(await importOriginal<typeof api>()),
  getIntegrations: vi.fn(),
  getSquareConnectUrl: vi.fn(),
  disconnectSquare: vi.fn(),
}));
vi.mock("react-hot-toast", () => ({
  default: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn() }),
}));
let mockUser: { stripeSubscriptionActive?: boolean } = {};
vi.mock("../../context/useAuth", () => ({ default: () => ({ user: mockUser }) }));
vi.mock("../../components/dashboard/SubScriptionModal", () => ({
  default: () => <p>Plans</p>,
}));

const mocked = vi.mocked(api);
const square = (status: string) =>
  Promise.resolve({ data: { integrations: [{ provider: "square", status }] } }) as never;

const renderPage = () =>
  render(
    <MemoryRouter>
      <IntegrationsPage />
    </MemoryRouter>,
  );

beforeEach(() => {
  vi.clearAllMocks();
  mockUser = {};
});

describe("Integrations without a subscription", () => {
  it("shows plans instead of starting the Square connection", async () => {
    mocked.getIntegrations.mockReturnValue(square("disconnected"));
    renderPage();

    expect(
      screen.getByText("Integrations are part of a PMU Forms subscription."),
    ).toBeInTheDocument();
    const connect = await screen.findByRole("button", { name: "Connect Square" });
    fireEvent.click(connect);
    expect(screen.getByText("Plans")).toBeInTheDocument();
    expect(mocked.getSquareConnectUrl).not.toHaveBeenCalled();
  });

  it("still lets a lapsed artist disconnect, but not match services", async () => {
    mocked.getIntegrations.mockReturnValue(square("connected"));
    renderPage();

    expect(await screen.findByRole("button", { name: "Disconnect Square" })).toBeEnabled();
    expect(
      screen.queryByRole("button", { name: "Manage Square service mappings" }),
    ).toBeNull();
  });

  it("works as before for a subscriber", async () => {
    mockUser = { stripeSubscriptionActive: true };
    mocked.getIntegrations.mockReturnValue(square("connected"));
    renderPage();

    expect(
      await screen.findByRole("button", { name: "Manage Square service mappings" }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/part of a PMU Forms subscription/)).toBeNull();
  });
});

describe("what each booking tool does", () => {
  it("only promises payments for Square", async () => {
    mocked.getIntegrations.mockReturnValue(square("disconnected"));
    const { container } = renderPage();
    await screen.findByRole("button", { name: "Connect Square" });

    expect(screen.getByText(/With Square, you can also request deposits and payments/)).toBeInTheDocument();
    const lines = [...container.querySelectorAll(".integrations-page__offers")].map(
      (el) => el.textContent,
    );
    expect(lines).toEqual([
      "Bookings, forms, deposits and payments",
      "Bookings and forms",
      "Bookings and forms",
      "Bookings and forms",
    ]);
  });
});
