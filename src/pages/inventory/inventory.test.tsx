import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AdjustStockModal from "../../components/inventoryComp/AdjustStockModal";
import type {
  BatchDetail,
  Overview,
  Product,
  ReceivingCheck,
} from "../../services/inventoryServices";
import * as api from "../../services/inventoryServices";
import { formatDay } from "../../utils/inventory";
import BatchDetailPage from "./BatchDetailPage";
import InventoryPage from "./InventoryPage";
import ProductFormPage from "./ProductFormPage";
import ReceiveStockPage from "./ReceiveStockPage";

// someone working alone: no names, and no request for them
vi.mock("../../utils/teamPeople", () => ({
  useWhoDid: () => ({ hasTeam: false, label: () => "" }),
}));
vi.mock("../../services/inventoryServices", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../services/inventoryServices")>();
  const fns = [
    "getOverview",
    "getProducts",
    "getCategories",
    "getBatches",
    "getTransactions",
    "getProduct",
    "getSuppliers",
    "getManufacturers",
    "getUnits",
    "getReceivingCheck",
    "receiveStock",
    "getBatch",
    "adjustBatch",
    "createProduct",
    "updateProduct",
  ];
  return {
    ...actual,
    ...Object.fromEntries(fns.map((f) => [f, vi.fn()])),
  };
});

const auth = vi.hoisted(() => ({ subscribed: true }));
vi.mock("../../context/useAuth", () => ({
  default: () => ({
    user: { userId: "artist-1", stripeSubscriptionActive: auth.subscribed },
  }),
}));

vi.mock("../../components/dashboardComp/SubScriptionModal", () => ({
  default: () => <div>Plans</div>,
}));

vi.mock("react-hot-toast", () => ({
  default: { success: vi.fn(), error: vi.fn() },
}));

const mocked = vi.mocked(api);
const ok = <T,>(data: T) => Promise.resolve({ data }) as never;

const product = (over: Partial<Product> = {}): Product => ({
  id: "p1",
  name: "Perma Blend Dark Brown",
  categoryId: "pmu-pigments",
  categoryName: "PMU Pigments",
  manufacturerName: "Perma Blend",
  keywords: [],
  inventoryType: "trackable",
  unit: "ml",
  costPerUnit: null,
  lowStockThreshold: null,
  ingredients: [],
  status: "active",
  availableQty: "9.5",
  onHandQty: "9.5",
  batchCount: 1,
  earliestExpiration: "2028-06-30",
  stockStatus: "in-stock",
  createdAt: "",
  updatedAt: "",
  ...over,
});

const batch = (over: Partial<BatchDetail> = {}): BatchDetail => ({
  id: "b1",
  productId: "p1",
  productName: "Perma Blend Dark Brown",
  productSku: null,
  productStatus: "active",
  lotNumber: "DB2026-104",
  expirationDate: "2028-06-30",
  receivedDate: "2026-11-21",
  purchaseDate: null,
  supplierId: null,
  supplierName: null,
  unit: "ml",
  originalQty: "10",
  currentQty: "10",
  unitCost: null,
  totalCost: null,
  hold: null,
  source: "received",
  status: "available",
  unusableReason: null,
  createdAt: "",
  usedQty: "0",
  discardedQty: "0",
  transactions: [],
  usages: [],
  documents: { batch: [], product: [] },
  ...over,
});

const renderAt = (path: string, element: React.ReactNode, route: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path={route} element={element} />
        <Route path="*" element={<div>Elsewhere</div>} />
      </Routes>
    </MemoryRouter>,
  );

beforeEach(() => {
  vi.clearAllMocks();
  auth.subscribed = true;
  mocked.getCategories.mockReturnValue(ok({ categories: [] }));
  mocked.getSuppliers.mockReturnValue(ok({ suppliers: [] }));
  mocked.getManufacturers.mockReturnValue(ok({ manufacturers: [] }));
  mocked.getUnits.mockReturnValue(ok({ units: ["ml", "g", "units"] }));
});

describe("Inventory page", () => {
  const overview: Overview = {
    activeProducts: 3,
    trackedProducts: 3,
    lowStockProducts: 1,
    outOfStockProducts: 0,
    expiringSoonBatches: 2,
    expiredBatches: 0,
    heldBatches: 0,
    expiryWarningDays: 90,
  };

  it("shows the summary and each product with its stock", async () => {
    mocked.getOverview.mockReturnValue(ok(overview));
    mocked.getProducts.mockReturnValue(ok({ products: [product()] }));
    renderAt("/inventory", <InventoryPage />, "/inventory");

    expect(await screen.findByText("Perma Blend Dark Brown")).toBeInTheDocument();
    const table = screen.getByRole("table");
    expect(within(table).getByText("9.5 ml")).toBeInTheDocument();
    expect(within(table).getByText("In stock")).toBeInTheDocument();
    expect(screen.getByText("Expiring within 90 days")).toBeInTheDocument();

    // a summary tile filters the list
    fireEvent.click(screen.getByRole("button", { name: /Low stock/ }));
    await waitFor(() =>
      expect(mocked.getProducts).toHaveBeenLastCalledWith(
        expect.objectContaining({ stockStatus: "low-stock" }),
      ),
    );
  });

  it("pages through products, 25 at a time", async () => {
    mocked.getOverview.mockReturnValue(ok(overview));
    mocked.getProducts.mockImplementation(((filters: { page?: number }) =>
      ok({
        products: [
          product({ id: `p${filters.page}`, name: `Pigment page ${filters.page}` }),
        ],
        total: 60,
        page: filters.page,
        perPage: 25,
      })) as never);
    renderAt("/inventory", <InventoryPage />, "/inventory");

    expect(await screen.findByText("Pigment page 1")).toBeInTheDocument();
    expect(mocked.getProducts).toHaveBeenLastCalledWith(
      expect.objectContaining({ page: 1, perPage: 25 }),
    );
    expect(screen.getByText("Page 1 of 3")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Previous" })).toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(await screen.findByText("Pigment page 2")).toBeInTheDocument();
    expect(screen.getByText("Page 2 of 3")).toBeInTheDocument();

    // a new search starts again from the first page
    fireEvent.change(screen.getByLabelText("Search products"), {
      target: { value: "brown" },
    });
    await waitFor(() =>
      expect(mocked.getProducts).toHaveBeenLastCalledWith(
        expect.objectContaining({ q: "brown", page: 1 }),
      ),
    );
  });

  it("offers the plans to artists without a subscription", async () => {
    auth.subscribed = false;
    renderAt("/inventory", <InventoryPage />, "/inventory");
    expect(screen.getByText("Inventory & product traceability")).toBeInTheDocument();
    expect(mocked.getProducts).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "See plans" }));
    expect(screen.getByText("Plans")).toBeInTheDocument();
  });
});

describe("Receive stock", () => {
  const check: ReceivingCheck = {
    warnings: [{ code: "no_ingredient_documentation", message: "No ingredient documentation is on file for this product." }],
    completeness: { provided: 2, requested: 9, label: "Product documentation: 2 of 9 requested items provided" },
    existingBatchId: null,
    batchChecklist: [{ docType: "certificate-of-analysis", level: "batch", label: "Certificate of Analysis (COA)", section: "batch" }],
    disclaimer: "This passport organizes the documentation on file.",
  };

  const fillDetails = async () => {
    fireEvent.change(await screen.findByLabelText("Lot / batch number"), {
      target: { value: "DB2026-104" },
    });
    fireEvent.change(screen.getByLabelText("Expiration date"), {
      target: { value: "2028-06-30" },
    });
    fireEvent.change(screen.getByLabelText("Quantity received (ml)"), {
      target: { value: "10" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Review" }));
  };

  beforeEach(() => {
    mocked.getProduct.mockReturnValue(ok({ product: product() }));
    mocked.getReceivingCheck.mockReturnValue(ok(check));
  });

  it("checks the details, shows documentation warnings, then receives exact amounts", async () => {
    mocked.receiveStock.mockReturnValue(ok({ batch: batch() }));
    renderAt("/inventory/receive?productId=p1", <ReceiveStockPage />, "/inventory/receive");

    fireEvent.click(await screen.findByRole("button", { name: "Review" }));
    expect(screen.getByText("Enter the lot number exactly as printed.")).toBeInTheDocument();

    await fillDetails();
    expect(await screen.findByText("No ingredient documentation is on file for this product.")).toBeInTheDocument();
    expect(screen.getByText(check.completeness.label)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Receive 10 ml" }));
    await screen.findByText(/Lot DB2026-104 received/);
    expect(mocked.receiveStock).toHaveBeenCalledWith(
      expect.objectContaining({
        productId: "p1",
        lotNumber: "DB2026-104",
        expirationDate: "2028-06-30",
        quantity: "10",
        requestId: expect.any(String),
      }),
    );
    // the batch's checklist, to upload documents for this lot
    expect(screen.getByText("Certificate of Analysis (COA)")).toBeInTheDocument();
  });

  it("asks before adding to a lot that's already in stock", async () => {
    mocked.receiveStock
      .mockImplementationOnce(() =>
        Promise.reject({
          code: "duplicate_lot",
          message: "Lot DB2026-104 is already in stock",
          batch: { id: "b1", lotNumber: "DB2026-104", expirationDate: "2028-06-30", currentQty: "4", unit: "ml" },
        }) as never,
      )
      .mockReturnValueOnce(ok({ batch: batch({ currentQty: "14", originalQty: "14" }) }));
    renderAt("/inventory/receive?productId=p1", <ReceiveStockPage />, "/inventory/receive");
    await fillDetails();
    fireEvent.click(await screen.findByRole("button", { name: "Receive 10 ml" }));

    const dialog = await screen.findByRole("dialog", { name: "Lot DB2026-104 is already in stock" });
    expect(within(dialog).getByText(/Is this more of the same lot\?/)).toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole("button", { name: "Yes, add to this lot" }));

    await screen.findByText(/14 ml in stock/);
    const [first, second] = mocked.receiveStock.mock.calls.map(([input]) => input);
    expect(second).toMatchObject({ addToBatchId: "b1" });
    // a separate receipt from the refused one
    expect(second.requestId).not.toBe(first.requestId);
  });
});

describe("Batch page", () => {
  it("shows a recall prominently, hides stock actions, and lists the clients", async () => {
    mocked.getBatch.mockReturnValue(
      ok({
        batch: batch({
          status: "recalled",
          hold: { status: "recalled", at: "2026-11-20T10:00:00Z", by: "artist-1", reason: "Manufacturer notice" },
          usages: [
            {
              usageId: "u1",
              customerId: "c1",
              customerName: "Jane Smith",
              appointmentId: "a1",
              appointmentDate: "2026-11-01T15:00:00Z",
              treatment: "Microblading",
              providerId: "artist-1",
              productName: "Perma Blend Dark Brown",
              lotNumber: "DB2026-104",
              quantity: "0.5",
              unit: "ml",
              usedAt: "2026-11-01T15:30:00Z",
            },
          ],
        }),
      }),
    );
    renderAt("/inventory/batches/b1", <BatchDetailPage />, "/inventory/batches/:batchId");

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("This batch has been recalled");
    expect(alert).toHaveTextContent("Manufacturer notice");
    expect(screen.queryByRole("button", { name: /Adjust stock/ })).not.toBeInTheDocument();
    expect(screen.getByText("Jane Smith")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Download list/ })).toBeInTheDocument();
  });
});

describe("Adjust stock", () => {
  it("won't remove more than the batch holds, and records the reason", async () => {
    mocked.adjustBatch.mockReturnValue(ok({ batch: batch({ currentQty: "9.25" }) }));
    const onDone = vi.fn();
    render(<AdjustStockModal batch={batch()} onClose={() => {}} onDone={onDone} />);

    fireEvent.change(screen.getByLabelText("Quantity (ml)"), { target: { value: "11" } });
    expect(screen.getByText("More than is in stock.")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Reason"), { target: { value: "Dropped" } });
    fireEvent.click(screen.getByRole("button", { name: "Save change" }));
    expect(await screen.findByText("Only 10 ml is in this batch.")).toBeInTheDocument();
    expect(mocked.adjustBatch).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText("Quantity (ml)"), { target: { value: "0.75" } });
    expect(screen.getByText("Leaves 9.25 ml.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Save change" }));
    await waitFor(() => expect(onDone).toHaveBeenCalled());
    expect(mocked.adjustBatch).toHaveBeenCalledWith("b1", {
      type: "wasted",
      direction: "remove",
      quantity: "0.75",
      reason: "Dropped",
      notes: undefined,
      requestId: expect.any(String),
    });
  });
});

describe("Product form", () => {
  it("locks the unit once stock has been received", async () => {
    mocked.getProduct.mockReturnValue(ok({ product: product({ batchCount: 2 }) }));
    renderAt("/inventory/products/p1/edit", <ProductFormPage />, "/inventory/products/:productId/edit");
    const unit = await screen.findByLabelText("Unit");
    expect(unit).toBeDisabled();
    expect(screen.getByText("Locked: stock has been received in this unit.")).toBeInTheDocument();
  });

  it("sends amounts as typed text, never as rounded numbers", async () => {
    mocked.getCategories.mockReturnValue(
      ok({ categories: [{ id: "pmu-pigments", name: "PMU Pigments", isDefault: true }] }),
    );
    mocked.createProduct.mockReturnValue(ok({ product: product({ id: "new" }) }));
    renderAt("/inventory/products/new", <ProductFormPage />, "/inventory/products/new");

    fireEvent.change(await screen.findByLabelText("Name"), { target: { value: "Numbing cream" } });
    await screen.findByRole("option", { name: "PMU Pigments" });
    fireEvent.change(screen.getByLabelText("Category"), { target: { value: "pmu-pigments" } });
    fireEvent.change(screen.getByLabelText(/Low stock level/), { target: { value: "2.5" } });
    fireEvent.change(screen.getByLabelText(/Cost per ml/), { target: { value: "12.10" } });
    fireEvent.click(screen.getByRole("button", { name: "Add product" }));

    await waitFor(() => expect(mocked.createProduct).toHaveBeenCalled());
    expect(mocked.createProduct.mock.calls[0][0]).toMatchObject({
      name: "Numbing cream",
      categoryId: "pmu-pigments",
      unit: "ml",
      lowStockThreshold: "2.5",
      costPerUnit: "12.10",
    });
  });
});

describe("dates", () => {
  it("shows calendar dates without shifting them a day", () => {
    expect(formatDay("2028-06-30")).toBe("Jun 30, 2028");
    expect(formatDay("2028-01-01")).toBe("Jan 1, 2028");
  });
});
