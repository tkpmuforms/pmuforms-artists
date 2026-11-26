import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as api from "../../services/inventoryServices";
import type { BatchForUse, Product, ProductUsage } from "../../services/inventoryServices";
import AppointmentProducts from "./AppointmentProducts";

vi.mock("../../services/inventoryServices", async (importOriginal) => ({
  ...(await importOriginal<typeof api>()),
  getAppointmentUsages: vi.fn(),
  getProducts: vi.fn(),
  getBatchesForUse: vi.fn(),
  recordUsage: vi.fn(),
  reverseUsage: vi.fn(),
}));
vi.mock("react-hot-toast", () => ({ default: { success: vi.fn(), error: vi.fn() } }));
let mockUser: { stripeSubscriptionActive?: boolean } = { stripeSubscriptionActive: true };
vi.mock("../../context/useAuth", () => ({ default: () => ({ user: mockUser }) }));
vi.mock("../dashboard/SubScriptionModal", () => ({ default: () => <p>Plans</p> }));

const mocked = vi.mocked(api);
const ok = <T,>(data: T) => Promise.resolve({ data }) as never;

const product = (over: Partial<Product> = {}) =>
  ({
    id: "p1",
    name: "Brow Pigment Dark Brown",
    brand: "Glow",
    inventoryType: "trackable",
    unit: "ml",
    availableQty: "14",
    status: "active",
    ...over,
  }) as Product;

const batch = (over: Partial<BatchForUse> = {}) =>
  ({
    id: "b1",
    productId: "p1",
    lotNumber: "LOT-LATE",
    expirationDate: "2028-06-30",
    unit: "ml",
    currentQty: "10",
    usable: true,
    unusableReason: null,
    ...over,
  }) as BatchForUse;

const usage = (over: Partial<ProductUsage> = {}): ProductUsage => ({
  id: "u1",
  appointmentId: "appt-1",
  customerId: "c1",
  productId: "p1",
  batchId: "b2",
  serviceId: 1,
  quantity: "1",
  unit: "ml",
  usedAt: "2026-11-23T10:00:00Z",
  providerId: "artist-1",
  performedBy: "artist-1",
  status: "active",
  reversal: null,
  snapshot: {
    productName: "Brow Pigment Dark Brown",
    brand: "Glow",
    lotNumber: "LOT-SOON",
    expirationDate: "2027-01-31",
    serviceName: "Microblading",
  },
  notes: null,
  ...over,
});

const renderSection = (props: Partial<React.ComponentProps<typeof AppointmentProducts>> = {}) =>
  render(
    <MemoryRouter>
      <AppointmentProducts
        appointmentId="appt-1"
        clientName="Jane Smith"
        services={[{ id: 1, service: "Microblading" }]}
        {...props}
      />
    </MemoryRouter>,
  );

beforeEach(() => {
  vi.clearAllMocks();
  mockUser = { stripeSubscriptionActive: true };
  mocked.getAppointmentUsages.mockReturnValue(ok({ usages: [] }));
  mocked.getProducts.mockReturnValue(
    ok({
      products: [
        product(),
        // not tracked, so there's no stock to take: left out
        product({ id: "p2", name: "Numbing cream", inventoryType: "non-stock" }),
      ],
    }),
  );
  mocked.getBatchesForUse.mockReturnValue(
    ok({
      batches: [
        batch(),
        batch({ id: "b2", lotNumber: "LOT-SOON", expirationDate: "2027-01-31", currentQty: "4" }),
        batch({
          id: "b3",
          lotNumber: "LOT-OLD",
          expirationDate: "2026-01-01",
          usable: false,
          unusableReason: "This lot has expired.",
        }),
      ],
    }),
  );
});

describe("Products used on an appointment", () => {
  it("records a product from the lot that expires soonest", async () => {
    mocked.recordUsage.mockReturnValue(ok({ usage: usage() }));
    const user = userEvent.setup();
    renderSection();

    expect(await screen.findByText("No products recorded for this appointment yet.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Add product/ }));
    const dialog = await screen.findByRole("dialog");

    const productSelect = await within(dialog).findByLabelText("Product");
    expect(within(productSelect).queryByText(/Numbing cream/)).toBeNull();
    await user.selectOptions(productSelect, "p1");

    const lot = (await within(dialog).findByLabelText("Lot")) as HTMLSelectElement;
    expect(lot.value).toBe("b2");
    expect(within(lot).getByRole("option", { name: /LOT-OLD/ })).toBeDisabled();

    // more than is left in the lot
    await user.type(within(dialog).getByLabelText("Amount used (ml)"), "5");
    await user.click(within(dialog).getByRole("button", { name: "Add product" }));
    expect(within(dialog).getByRole("alert")).toHaveTextContent("Only 4 ml left in this lot.");
    expect(mocked.recordUsage).not.toHaveBeenCalled();

    await user.clear(within(dialog).getByLabelText("Amount used (ml)"));
    await user.type(within(dialog).getByLabelText("Amount used (ml)"), "1");
    await user.click(within(dialog).getByRole("button", { name: "Add product" }));

    await waitFor(() =>
      expect(mocked.recordUsage).toHaveBeenCalledWith(
        "appt-1",
        expect.objectContaining({ batchId: "b2", quantity: "1", serviceId: 1 }),
      ),
    );
    expect(await screen.findByText("LOT-SOON")).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("shows the server's reason when it can't be recorded", async () => {
    mocked.recordUsage.mockReturnValue(
      Promise.reject({ message: "Only 0.5 ml is left in this lot." }) as never,
    );
    const user = userEvent.setup();
    renderSection();

    await user.click(await screen.findByRole("button", { name: /Add product/ }));
    const dialog = await screen.findByRole("dialog");
    await user.selectOptions(await within(dialog).findByLabelText("Product"), "p1");
    await within(dialog).findByLabelText("Lot");
    await user.type(within(dialog).getByLabelText("Amount used (ml)"), "1");
    await user.click(within(dialog).getByRole("button", { name: "Add product" }));

    expect(await within(dialog).findByRole("alert")).toHaveTextContent(
      "Only 0.5 ml is left in this lot.",
    );
  });

  it("asks for a reason to remove a product from a completed appointment", async () => {
    mocked.getAppointmentUsages.mockReturnValue(ok({ usages: [usage()] }));
    mocked.reverseUsage.mockReturnValue(
      ok({
        usage: usage({
          status: "reversed",
          reversal: { at: "2026-11-23T12:00:00Z", by: "artist-1", reason: "Wrong lot" },
        }),
      }),
    );
    const user = userEvent.setup();
    renderSection({ completed: true });

    await user.click(await screen.findByRole("button", { name: "Remove Brow Pigment Dark Brown" }));
    const dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: "Remove" }));
    expect(within(dialog).getByRole("alert")).toHaveTextContent("Add a reason");
    expect(mocked.reverseUsage).not.toHaveBeenCalled();

    await user.type(within(dialog).getByLabelText("Reason"), "Wrong lot");
    await user.click(within(dialog).getByRole("button", { name: "Remove" }));
    await waitFor(() => expect(mocked.reverseUsage).toHaveBeenCalledWith("u1", "Wrong lot"));
    expect(await screen.findByText(/Removed .*: Wrong lot/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Remove Brow Pigment Dark Brown" })).toBeNull();
  });

  it("is part of the subscription", async () => {
    mockUser = {};
    const user = userEvent.setup();
    renderSection();

    expect(screen.queryByRole("button", { name: /Add product/ })).toBeNull();
    expect(mocked.getAppointmentUsages).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "See plans" }));
    expect(screen.getByText("Plans")).toBeInTheDocument();
  });
});
