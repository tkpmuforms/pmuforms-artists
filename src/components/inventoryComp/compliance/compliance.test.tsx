import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type {
  ComplianceCatalog,
  ComplianceDoc,
  Passport,
} from "../../../services/inventoryServices";
import * as api from "../../../services/inventoryServices";
import ChecklistEditor from "./ChecklistEditor";
import CompliancePassport from "./CompliancePassport";
import DocumentDetailModal from "./DocumentDetailModal";
import DocumentFormModal from "./DocumentFormModal";
import { resetComplianceCatalog } from "./useComplianceCatalog";

vi.mock("../../../services/inventoryServices", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../../services/inventoryServices")>();
  return {
    ...actual,
    getComplianceCatalog: vi.fn(),
    getPassport: vi.fn(),
    getDocument: vi.fn(),
    createDocument: vi.fn(),
    updateDocument: vi.fn(),
    attachDocumentFile: vi.fn(),
    reviewDocument: vi.fn(),
    getDocumentFileUrl: vi.fn(),
    getChecklist: vi.fn(),
    setChecklist: vi.fn(),
    resetChecklist: vi.fn(),
  };
});

vi.mock("../../../context/useAuth", () => ({
  default: () => ({ user: { userId: "artist-1" } }),
}));

vi.mock("react-hot-toast", () => ({
  default: { success: vi.fn(), error: vi.fn() },
}));

const mocked = vi.mocked(api);
const ok = <T,>(data: T) => Promise.resolve({ data }) as never;

const catalog: ComplianceCatalog = {
  sections: [
    { id: "ingredients", label: "Ingredient information" },
    { id: "safety", label: "Safety documentation" },
    { id: "regulatory", label: "FDA & regulatory documentation" },
    { id: "batch", label: "Batch documentation" },
  ],
  documentTypes: [
    {
      id: "ingredient-list",
      label: "Ingredient list",
      section: "ingredients",
      levels: ["product", "batch"],
      evidence: ["manufacturer-statement", "third-party-certification", "other"],
    },
    {
      id: "heavy-metal-testing",
      label: "Heavy metal testing",
      section: "safety",
      levels: ["product", "batch"],
      testing: true,
      evidence: ["laboratory-report", "manufacturer-statement", "other"],
      caveat: "Not a guarantee of safety.",
    },
    {
      id: "certificate-of-analysis",
      label: "Certificate of Analysis (COA)",
      section: "batch",
      levels: ["batch"],
      testing: true,
      evidence: ["laboratory-report"],
    },
  ],
  evidenceKinds: [
    { id: "manufacturer-statement", label: "Manufacturer self-attestation" },
    { id: "third-party-certification", label: "Third-party certification" },
    { id: "laboratory-report", label: "Laboratory report" },
    { id: "other", label: "Other" },
  ],
  statuses: [],
  disclaimer: "Not FDA approval.",
  resources: [],
};

const doc = (overrides: Partial<ComplianceDoc> = {}): ComplianceDoc => ({
  id: "doc-1",
  productId: "p1",
  batchId: null,
  level: "product",
  docType: "ingredient-list",
  docTypeLabel: "Ingredient list",
  section: "ingredients",
  evidenceKind: "manufacturer-statement",
  evidenceLabel: "Manufacturer self-attestation",
  caveat: null,
  title: "Ingredient list 2026",
  issuer: null,
  documentNumber: null,
  issueDate: null,
  expirationDate: null,
  expiresSoon: false,
  notes: null,
  file: null,
  testing: null,
  regulatory: null,
  status: "uploaded",
  statusLabel: "Uploaded",
  lastReview: null,
  supersedesId: null,
  supersededById: null,
  history: [{ action: "uploaded", toStatus: "uploaded", by: "artist-1", at: "2026-11-20T10:00:00Z" }],
  uploadedBy: "artist-1",
  createdAt: "2026-11-20T10:00:00Z",
  updatedAt: "2026-11-20T10:00:00Z",
  ...overrides,
});

const passport: Passport = {
  disclaimer:
    "This passport organizes the documentation on file and who reviewed it. It is not FDA approval, a safety certification or a determination of legal compliance.",
  resources: [{ title: "MoCRA", url: "https://www.fda.gov/mocra" }],
  product: {
    id: "p1",
    name: "Perma Blend Dark Brown",
    brand: "Perma Blend",
    description: null,
    countryOfManufacture: "USA",
    categoryId: "pmu-pigments",
    categoryName: "PMU Pigments",
    status: "active",
  },
  manufacturer: null,
  manufacturerMissing: ["manufacturer"],
  ingredients: [],
  ingredientDocumentation: "uploaded",
  completeness: {
    provided: 1,
    requested: 2,
    label: "Product documentation: 1 of 2 requested items provided",
  },
  sections: [
    {
      id: "ingredients",
      label: "Ingredient information",
      items: [
        {
          docType: "ingredient-list",
          level: "product",
          label: "Ingredient list",
          section: "ingredients",
          status: "uploaded",
          statusLabel: "Uploaded",
          provided: true,
          documents: [doc()],
        },
      ],
      otherDocuments: [],
    },
    {
      id: "safety",
      label: "Safety documentation",
      items: [
        {
          docType: "heavy-metal-testing",
          level: "product",
          label: "Heavy metal testing",
          section: "safety",
          status: "not-provided",
          statusLabel: "Not provided",
          provided: false,
          documents: [],
        },
      ],
      otherDocuments: [],
    },
  ],
  batches: [
    {
      batchId: "b1",
      lotNumber: "DB104",
      expirationDate: "2028-06-30",
      status: "recalled",
      hold: { status: "recalled", at: "2026-11-01", by: "artist-1", reason: "Manufacturer notice" },
      items: [
        {
          docType: "certificate-of-analysis",
          level: "batch",
          label: "Certificate of Analysis (COA)",
          section: "batch",
          status: "not-provided",
          statusLabel: "Not provided",
          provided: false,
          documents: [],
        },
      ],
      provided: 0,
      requested: 1,
      otherDocuments: [],
    },
  ],
  superseded: [],
};

beforeEach(() => {
  vi.clearAllMocks();
  resetComplianceCatalog();
  mocked.getComplianceCatalog.mockReturnValue(ok(catalog));
});

describe("CompliancePassport", () => {
  it("shows each item's own status, offers Upload for missing ones, and never claims approval", async () => {
    mocked.getPassport.mockReturnValue(ok({ passport }));
    const { container } = render(<CompliancePassport productId="p1" />);

    expect(
      await screen.findByText("Product documentation: 1 of 2 requested items provided"),
    ).toBeInTheDocument();

    const safety = screen.getByRole("region", { name: "Safety documentation" });
    expect(within(safety).getByText("Not provided")).toBeInTheDocument();
    expect(within(safety).getByRole("button", { name: "Upload Heavy metal testing" })).toBeInTheDocument();

    const ingredients = screen.getByRole("region", { name: "Ingredient information" });
    expect(within(ingredients).getAllByText("Uploaded").length).toBeGreaterThan(0);

    // batch documents are scoped to their batch, and the recall is obvious
    expect(screen.getByText("Applies only to Lot DB104.")).toBeInTheDocument();
    expect(screen.getByText(/This batch has been recalled: Manufacturer notice/)).toBeInTheDocument();
    expect(screen.getByText("No manufacturer is recorded for this product.", { exact: false })).toBeInTheDocument();

    // the only mention of FDA approval is the disclaimer saying it isn't
    const text = (container.textContent ?? "").replace(passport.disclaimer, "");
    expect(text).not.toMatch(/fda.?approved|compliant|certified safe|safety score/i);
  });

  it("opens the upload form for a missing batch item with its batch", async () => {
    mocked.getPassport.mockReturnValue(ok({ passport }));
    render(<CompliancePassport productId="p1" />);

    fireEvent.click(await screen.findByRole("button", { name: "Upload Certificate of Analysis (COA)" }));
    const dialog = await screen.findByRole("dialog", { name: "Add a document" });
    expect(within(dialog).getByText(/Applies only to Lot DB104/)).toBeInTheDocument();
    await waitFor(() =>
      expect(within(dialog).getByLabelText("Document type")).toHaveValue("certificate-of-analysis"),
    );
  });
});

describe("DocumentFormModal", () => {
  it("creates the document and then uploads its file", async () => {
    const created = doc({ id: "new-doc" });
    mocked.createDocument.mockReturnValue(ok({ document: created }));
    mocked.attachDocumentFile.mockReturnValue(ok({ document: { ...created, file: {} } }));
    const onSaved = vi.fn();

    render(
      <DocumentFormModal productId="p1" docType="ingredient-list" onClose={vi.fn()} onSaved={onSaved} />,
    );

    await waitFor(() => expect(screen.getByLabelText("Title")).toHaveValue("Ingredient list"));
    const file = new File(["%PDF"], "ingredients.pdf", { type: "application/pdf" });
    fireEvent.change(screen.getByLabelText("File"), { target: { files: [file] } });
    fireEvent.click(screen.getByRole("button", { name: "Add document" }));

    await waitFor(() => expect(onSaved).toHaveBeenCalled());
    expect(mocked.createDocument).toHaveBeenCalledWith(
      expect.objectContaining({
        productId: "p1",
        docType: "ingredient-list",
        evidenceKind: "manufacturer-statement",
        title: "Ingredient list",
        requestId: expect.any(String),
      }),
    );
    expect(mocked.attachDocumentFile).toHaveBeenCalledWith("new-doc", file);
    expect(mocked.createDocument.mock.invocationCallOrder[0]).toBeLessThan(
      mocked.attachDocumentFile.mock.invocationCallOrder[0],
    );
  });

  it("rejects files that aren't a PDF or photo before uploading", async () => {
    render(
      <DocumentFormModal productId="p1" docType="ingredient-list" onClose={vi.fn()} onSaved={vi.fn()} />,
    );
    await screen.findByLabelText("File");
    const zip = new File(["x"], "docs.zip", { type: "application/zip" });
    fireEvent.change(screen.getByLabelText("File"), { target: { files: [zip] } });
    expect(screen.getByText("Choose a PDF or a photo (JPG, PNG, WebP or HEIC).")).toBeInTheDocument();
  });

  it("uploads a new version against the old one, with its type locked", async () => {
    const old = doc({ id: "old-doc", title: "Ingredients v1" });
    mocked.createDocument.mockReturnValue(ok({ document: doc({ id: "v2", supersedesId: "old-doc" }) }));
    const onSaved = vi.fn();

    render(<DocumentFormModal productId="p1" supersedes={old} onClose={vi.fn()} onSaved={onSaved} />);

    expect(await screen.findByRole("dialog", { name: "Upload a new version" })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByLabelText("Document type")).toBeDisabled());
    fireEvent.change(screen.getByLabelText("Title"), { target: { value: "Ingredients v2" } });
    fireEvent.click(screen.getByRole("button", { name: "Upload new version" }));

    await waitFor(() => expect(onSaved).toHaveBeenCalled());
    expect(mocked.createDocument).toHaveBeenCalledWith(
      expect.objectContaining({
        supersedesId: "old-doc",
        docType: "ingredient-list",
        title: "Ingredients v2",
      }),
    );
    expect(mocked.attachDocumentFile).not.toHaveBeenCalled();
  });

  it("keeps test results exactly as typed", async () => {
    mocked.createDocument.mockReturnValue(ok({ document: doc() }));
    render(
      <DocumentFormModal productId="p1" docType="heavy-metal-testing" onClose={vi.fn()} onSaved={vi.fn()} />,
    );
    fireEvent.click(await screen.findByRole("button", { name: "Add a result" }));
    fireEvent.change(screen.getByLabelText("Result 1: tested for"), { target: { value: "Lead" } });
    fireEvent.change(screen.getByLabelText("Result 1: result"), { target: { value: "< 0.5" } });
    fireEvent.change(screen.getByLabelText("Result 1: specification"), { target: { value: "≤ 10 ppm" } });
    fireEvent.click(screen.getByRole("button", { name: "Add document" }));

    await waitFor(() => expect(mocked.createDocument).toHaveBeenCalled());
    expect(mocked.createDocument.mock.calls[0][0].testing?.results).toEqual([
      { analyte: "Lead", result: "< 0.5", unit: undefined, detectionLimit: undefined, specification: "≤ 10 ppm" },
    ]);
  });
});

describe("DocumentDetailModal review", () => {
  beforeEach(() => {
    mocked.getDocument.mockReturnValue(ok({ document: doc() }));
  });

  it("requires a method to verify against the issuer", async () => {
    render(<DocumentDetailModal documentId="doc-1" onClose={vi.fn()} />);
    fireEvent.click(await screen.findByLabelText("Verified against issuer"));
    fireEvent.click(screen.getByRole("button", { name: "Save review" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Say how you verified it with the issuer.",
    );
    expect(mocked.reviewDocument).not.toHaveBeenCalled();

    mocked.reviewDocument.mockReturnValue(ok({ document: doc({ status: "verified" }) }));
    fireEvent.change(screen.getByLabelText("Verification method"), {
      target: { value: "Called the lab" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save review" }));
    await waitFor(() =>
      expect(mocked.reviewDocument).toHaveBeenCalledWith("doc-1", {
        status: "verified",
        method: "Called the lab",
        notes: undefined,
      }),
    );
  });

  it("requires a note to reject", async () => {
    render(<DocumentDetailModal documentId="doc-1" onClose={vi.fn()} />);
    fireEvent.click(await screen.findByLabelText("Rejected"));
    fireEvent.click(screen.getByRole("button", { name: "Save review" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Add a note saying why it was rejected.",
    );
    expect(mocked.reviewDocument).not.toHaveBeenCalled();
  });

  it("shows the history with the artist as You, and hides review on superseded documents", async () => {
    mocked.getDocument.mockReturnValue(
      ok({ document: doc({ status: "superseded", statusLabel: "Superseded" }) }),
    );
    render(<DocumentDetailModal documentId="doc-1" onClose={vi.fn()} />);
    expect(await screen.findByText("Replaced by a newer version. Kept here with its history.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Save review" })).not.toBeInTheDocument();
    const history = screen.getByRole("list", { name: "Document history" });
    expect(within(history).getByText(/· You/)).toBeInTheDocument();
  });
});

describe("ChecklistEditor", () => {
  const defaults = {
    categoryId: "pmu-pigments",
    categoryName: "PMU Pigments",
    isDefault: true,
    items: [
      { docType: "ingredient-list", level: "product" as const, label: "Ingredient list", section: "ingredients" },
    ],
  };

  it("adds an item and saves the list", async () => {
    mocked.getChecklist.mockReturnValue(ok({ checklist: defaults }));
    mocked.setChecklist.mockReturnValue(
      ok({ checklist: { ...defaults, isDefault: false } }),
    );
    render(<ChecklistEditor categoryId="pmu-pigments" categoryName="PMU Pigments" />);

    expect(await screen.findByText("Using the default list")).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByRole("option", { name: "Certificate of Analysis (COA)" })).toBeInTheDocument(),
    );
    fireEvent.change(screen.getByLabelText("Document to request"), {
      target: { value: "certificate-of-analysis" },
    });
    // a COA can only be requested per batch
    expect(screen.getByLabelText("Requested per")).toHaveValue("batch");
    fireEvent.click(screen.getByRole("button", { name: "Add" }));
    fireEvent.click(screen.getByRole("button", { name: "Save list" }));

    await waitFor(() =>
      expect(mocked.setChecklist).toHaveBeenCalledWith("pmu-pigments", [
        { docType: "ingredient-list", level: "product" },
        { docType: "certificate-of-analysis", level: "batch" },
      ]),
    );
    expect(await screen.findByText("Customized")).toBeInTheDocument();
  });

  it("resets a customized list to the default", async () => {
    mocked.getChecklist.mockReturnValue(ok({ checklist: { ...defaults, isDefault: false, items: [] } }));
    mocked.resetChecklist.mockReturnValue(ok({ checklist: defaults }));
    render(<ChecklistEditor categoryId="pmu-pigments" categoryName="PMU Pigments" />);

    fireEvent.click(await screen.findByRole("button", { name: "Reset to default" }));
    await waitFor(() => expect(mocked.resetChecklist).toHaveBeenCalledWith("pmu-pigments"));
    expect(await screen.findByText("Using the default list")).toBeInTheDocument();
  });
});
