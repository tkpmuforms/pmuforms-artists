import axiosInstance from "../utils/axios/axiosSetup";

/*
 * Inventory & Product Compliance Passport API.
 * Quantities and money travel as decimal strings ("9.5", "12.50") so they
 * are never rounded by floating point; dates are calendar dates
 * ("2028-06-30").
 */

const BASE = "/api/inventory";

// ------------------------------------------------------------------ types

export type StockStatus = "in-stock" | "low-stock" | "out-of-stock" | "not-tracked";

export type BatchStatus =
  | "available"
  | "expiring-soon"
  | "expired"
  | "depleted"
  | "quarantined"
  | "recalled";

export type TxnType =
  | "received"
  | "imported"
  | "used-on-client"
  | "usage-reversed"
  | "adjustment"
  | "wasted"
  | "returned-to-supplier"
  | "correction"
  | "quarantined"
  | "released"
  | "recalled";

export interface Category {
  id: string;
  name: string;
  isDefault: boolean;
}

export interface Ingredient {
  name: string;
  casNumber?: string;
  ciNumber?: string;
  pigmentIdentifier?: string;
  colorAdditiveInfo?: string;
  function?: string;
}

export interface ResponsiblePerson {
  name?: string;
  address?: string;
  contact?: string;
}

export interface Manufacturer {
  id: string;
  name: string;
  address?: string;
  country?: string;
  website?: string;
  contact?: string;
  supportEmail?: string;
  registrationInfo?: string;
  responsiblePerson?: ResponsiblePerson;
  archivedAt?: string | null;
}

export interface Supplier {
  id: string;
  name: string;
  contact?: string;
  email?: string;
  phone?: string;
  website?: string;
  notes?: string;
  archivedAt?: string | null;
}

export interface Product {
  id: string;
  name: string;
  sku?: string;
  barcode?: string;
  brand?: string;
  categoryId: string;
  categoryName: string | null;
  manufacturerId?: string;
  manufacturerName: string | null;
  description?: string;
  productType?: string;
  keywords: string[];
  inventoryType: "trackable" | "non-stock";
  unit: string;
  costPerUnit: string | null;
  defaultSupplierId?: string;
  imageUrl?: string;
  countryOfManufacture?: string;
  lowStockThreshold: string | null;
  ingredients: Ingredient[];
  status: "active" | "archived";
  availableQty: string;
  onHandQty: string;
  batchCount: number;
  earliestExpiration: string | null;
  stockStatus: StockStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ProductInput {
  name: string;
  categoryId: string;
  inventoryType: "trackable" | "non-stock";
  unit: string;
  manufacturerId?: string;
  brand?: string;
  sku?: string;
  barcode?: string;
  description?: string;
  productType?: string;
  keywords?: string[];
  costPerUnit?: string;
  defaultSupplierId?: string;
  countryOfManufacture?: string;
  lowStockThreshold?: string;
  ingredients?: Ingredient[];
}

export interface BatchHold {
  status: "quarantined" | "recalled";
  at: string;
  by: string;
  reason?: string;
}

export interface Batch {
  id: string;
  productId: string;
  productName: string | null;
  productSku: string | null;
  productStatus: string | null;
  lotNumber: string;
  expirationDate: string;
  receivedDate: string | null;
  purchaseDate: string | null;
  supplierId: string | null;
  supplierName: string | null;
  unit: string;
  originalQty: string;
  currentQty: string;
  unitCost: string | null;
  totalCost: string | null;
  hold: BatchHold | null;
  source: "received" | "imported";
  status: BatchStatus;
  unusableReason: string | null;
  createdAt: string;
}

export interface Transaction {
  id: string;
  type: TxnType;
  quantity: string;
  previousQty: string;
  newQty: string;
  unit: string;
  customerId: string | null;
  appointmentId: string | null;
  usageId: string | null;
  reversesId: string | null;
  performedBy: string;
  providerId: string | null;
  reason: string | null;
  notes: string | null;
  referenceId: string | null;
  at: string;
  // in the all-batches history
  batchId?: string;
  lotNumber?: string;
  productId?: string;
  productName?: string | null;
}

export interface UsageReportRow {
  usageId: string;
  customerId: string;
  customerName: string | null;
  appointmentId: string;
  appointmentDate: string | null;
  treatment: string | null;
  providerId: string;
  productName: string;
  lotNumber: string;
  quantity: string;
  unit: string;
  usedAt: string;
}

export interface BatchDetail extends Batch {
  usedQty: string;
  discardedQty: string;
  transactions: Transaction[];
  usages: UsageReportRow[];
  documents: { batch: ComplianceDoc[]; product: ComplianceDoc[] };
}

export interface Overview {
  activeProducts: number;
  trackedProducts: number;
  lowStockProducts: number;
  outOfStockProducts: number;
  expiringSoonBatches: number;
  expiredBatches: number;
  heldBatches: number;
  expiryWarningDays: number;
}

export interface InventorySettings {
  expiryWarningDays: number[];
  expiryAlerts: boolean;
  lowStockAlerts: boolean;
  alertEmails: string[];
}

export interface ReceiveInput {
  productId: string;
  lotNumber: string;
  expirationDate: string;
  quantity: string;
  supplierId?: string;
  purchaseDate?: string;
  receivedDate?: string;
  unitCost?: string;
  totalCost?: string;
  referenceId?: string;
  notes?: string;
  addToBatchId?: string;
  requestId?: string;
}

/** The API's answer when a lot number is already in stock for the product. */
export interface DuplicateLotError {
  code: "duplicate_lot";
  message: string;
  batch: {
    id: string;
    lotNumber: string;
    expirationDate: string;
    currentQty: string;
    unit: string;
  };
}

export const isDuplicateLot = (error: unknown): error is DuplicateLotError =>
  (error as { code?: string })?.code === "duplicate_lot";

// ------------------------------------------------------------- compliance

export type DocumentStatus =
  | "not-provided"
  | "uploaded"
  | "pending-review"
  | "reviewed"
  | "verified"
  | "rejected"
  | "expired"
  | "superseded";

export type EvidenceKind =
  | "manufacturer-statement"
  | "third-party-certification"
  | "laboratory-report"
  | "government-registration"
  | "government-approval"
  | "other";

export interface TestResult {
  analyte: string;
  result: string;
  unit?: string;
  detectionLimit?: string;
  specification?: string;
}

export interface TestingDetails {
  laboratory?: string;
  testedDate?: string;
  method?: string;
  results?: TestResult[];
  scope?: string;
  limitations?: string;
}

export interface RegulatoryDetails {
  program?: string;
  reference?: string;
  responsibleOrganization?: string;
  submittedDate?: string;
  lastUpdatedDate?: string;
  verificationSource?: string;
}

export interface DocumentHistoryEntry {
  action: "uploaded" | "status" | "edited" | "file" | "superseded";
  fromStatus?: string;
  toStatus?: string;
  by: string;
  at: string;
  method?: string;
  notes?: string;
}

export interface ComplianceDoc {
  id: string;
  productId: string;
  batchId: string | null;
  level: "product" | "batch";
  docType: string;
  docTypeLabel: string;
  section: string;
  evidenceKind: EvidenceKind;
  evidenceLabel: string;
  caveat: string | null;
  title: string;
  issuer: string | null;
  documentNumber: string | null;
  issueDate: string | null;
  expirationDate: string | null;
  expiresSoon: boolean;
  notes: string | null;
  file: { name: string; contentType: string; size: number; uploadedAt: string } | null;
  testing: TestingDetails | null;
  regulatory: RegulatoryDetails | null;
  status: DocumentStatus;
  statusLabel: string;
  lastReview: { by: string; at: string; method?: string; notes?: string } | null;
  supersedesId: string | null;
  supersededById: string | null;
  history: DocumentHistoryEntry[];
  uploadedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentDetailsInput {
  evidenceKind: EvidenceKind;
  title: string;
  issuer?: string;
  documentNumber?: string;
  issueDate?: string;
  expirationDate?: string;
  notes?: string;
  testing?: TestingDetails;
  regulatory?: RegulatoryDetails;
}

export interface CreateDocumentInput extends DocumentDetailsInput {
  productId: string;
  batchId?: string;
  docType: string;
  supersedesId?: string;
  requestId?: string;
}

export interface DocumentType {
  id: string;
  label: string;
  section: string;
  levels: ("product" | "batch")[];
  testing?: boolean;
  regulatory?: boolean;
  evidence: EvidenceKind[];
  caveat?: string;
}

export interface ComplianceCatalog {
  sections: { id: string; label: string }[];
  documentTypes: DocumentType[];
  evidenceKinds: { id: EvidenceKind; label: string }[];
  statuses: { id: DocumentStatus; label: string }[];
  disclaimer: string;
  resources: { title: string; url: string }[];
}

export interface ChecklistEntry {
  docType: string;
  level: "product" | "batch";
  label: string;
  section: string;
  status: DocumentStatus;
  statusLabel: string;
  provided: boolean;
  documents: ComplianceDoc[];
}

export interface Passport {
  disclaimer: string;
  resources: { title: string; url: string }[];
  product: {
    id: string;
    name: string;
    brand: string | null;
    description: string | null;
    countryOfManufacture: string | null;
    categoryId: string;
    categoryName: string | null;
    status: string;
  };
  manufacturer: Manufacturer | null;
  manufacturerMissing: string[];
  ingredients: Ingredient[];
  ingredientDocumentation: DocumentStatus;
  completeness: { provided: number; requested: number; label: string };
  sections: {
    id: string;
    label: string;
    items: ChecklistEntry[];
    otherDocuments: ComplianceDoc[];
  }[];
  batches: {
    batchId: string;
    lotNumber: string;
    expirationDate: string;
    status: BatchStatus;
    hold: BatchHold | null;
    items: ChecklistEntry[];
    provided: number;
    requested: number;
    otherDocuments: ComplianceDoc[];
  }[];
  superseded: ComplianceDoc[];
}

export interface ReceivingCheck {
  warnings: { code: string; message: string }[];
  completeness: { provided: number; requested: number; label: string };
  existingBatchId: string | null;
  batchChecklist: { docType: string; level: "batch"; label: string; section: string }[];
  disclaimer: string;
}

export interface Checklist {
  categoryId: string;
  categoryName: string;
  isDefault: boolean;
  items: { docType: string; level: "product" | "batch"; label: string; section: string }[];
}

// ------------------------------------------------------------------ calls

const clean = <T extends object>(params: T) =>
  Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== ""),
  );

export const getOverview = () => axiosInstance.get<Overview>(`${BASE}/overview`);
export const getUnits = () => axiosInstance.get<{ units: string[] }>(`${BASE}/units`);

export const getCategories = () =>
  axiosInstance.get<{ categories: Category[] }>(`${BASE}/categories`);
export const createCategory = (name: string) =>
  axiosInstance.post<{ category: Category }>(`${BASE}/categories`, { name });

export const getManufacturers = (includeArchived = false) =>
  axiosInstance.get<{ manufacturers: Manufacturer[] }>(`${BASE}/manufacturers`, {
    params: includeArchived ? { includeArchived: "true" } : {},
  });
export const createManufacturer = (data: Omit<Manufacturer, "id">) =>
  axiosInstance.post<{ manufacturer: Manufacturer }>(`${BASE}/manufacturers`, data);
export const updateManufacturer = (id: string, data: Omit<Manufacturer, "id">) =>
  axiosInstance.put<{ manufacturer: Manufacturer }>(`${BASE}/manufacturers/${id}`, data);
export const setManufacturerArchived = (id: string, archived: boolean) =>
  axiosInstance.post<{ manufacturer: Manufacturer }>(
    `${BASE}/manufacturers/${id}/${archived ? "archive" : "unarchive"}`,
  );

export const getSuppliers = (includeArchived = false) =>
  axiosInstance.get<{ suppliers: Supplier[] }>(`${BASE}/suppliers`, {
    params: includeArchived ? { includeArchived: "true" } : {},
  });
export const createSupplier = (data: Omit<Supplier, "id">) =>
  axiosInstance.post<{ supplier: Supplier }>(`${BASE}/suppliers`, data);
export const updateSupplier = (id: string, data: Omit<Supplier, "id">) =>
  axiosInstance.put<{ supplier: Supplier }>(`${BASE}/suppliers/${id}`, data);
export const setSupplierArchived = (id: string, archived: boolean) =>
  axiosInstance.post<{ supplier: Supplier }>(
    `${BASE}/suppliers/${id}/${archived ? "archive" : "unarchive"}`,
  );

export interface ProductFilters {
  q?: string;
  categoryId?: string;
  manufacturerId?: string;
  status?: "active" | "archived" | "all";
  stockStatus?: StockStatus;
}

export const getProducts = (filters: ProductFilters = {}) =>
  axiosInstance.get<{ products: Product[] }>(`${BASE}/products`, {
    params: clean(filters),
  });
export const getProduct = (id: string) =>
  axiosInstance.get<{ product: Product }>(`${BASE}/products/${id}`);
export const createProduct = (data: ProductInput) =>
  axiosInstance.post<{ product: Product }>(`${BASE}/products`, data);
export const updateProduct = (id: string, data: ProductInput) =>
  axiosInstance.put<{ product: Product }>(`${BASE}/products/${id}`, data);
export const setProductArchived = (id: string, archived: boolean) =>
  axiosInstance.post<{ product: Product }>(
    `${BASE}/products/${id}/${archived ? "archive" : "unarchive"}`,
  );
export const getProductUsages = (id: string) =>
  axiosInstance.get<{ usages: UsageReportRow[] }>(`${BASE}/products/${id}/usages`);

export const receiveStock = (data: ReceiveInput) =>
  axiosInstance.post<{ batch: BatchDetail }>(`${BASE}/receive`, data);

export const getBatches = (
  filters: { productId?: string; q?: string; status?: BatchStatus } = {},
) =>
  axiosInstance.get<{ batches: Batch[] }>(`${BASE}/batches`, {
    params: clean(filters),
  });
export const getBatch = (id: string) =>
  axiosInstance.get<{ batch: BatchDetail }>(`${BASE}/batches/${id}`);

export type ManualTxnType = "adjustment" | "wasted" | "returned-to-supplier" | "correction";

export const adjustBatch = (
  id: string,
  data: {
    type: ManualTxnType;
    direction: "add" | "remove";
    quantity: string;
    reason: string;
    notes?: string;
    requestId?: string;
  },
) => axiosInstance.post<{ batch: BatchDetail }>(`${BASE}/batches/${id}/adjust`, data);
export const holdBatch = (
  id: string,
  data: { status: "quarantined" | "recalled"; reason: string },
) => axiosInstance.post<{ batch: BatchDetail }>(`${BASE}/batches/${id}/hold`, data);
export const releaseBatch = (id: string, reason: string) =>
  axiosInstance.post<{ batch: BatchDetail }>(`${BASE}/batches/${id}/release`, { reason });

export const getTransactions = (
  filters: {
    productId?: string;
    batchId?: string;
    type?: TxnType;
    from?: string;
    to?: string;
    page?: number;
    perPage?: number;
  } = {},
) =>
  axiosInstance.get<{
    transactions: Transaction[];
    total: number;
    page: number;
    perPage: number;
  }>(`${BASE}/transactions`, { params: clean(filters) });

export const getInventorySettings = () =>
  axiosInstance.get<{ settings: InventorySettings }>(`${BASE}/settings`);
export const updateInventorySettings = (data: Partial<InventorySettings>) =>
  axiosInstance.patch<{ settings: InventorySettings }>(`${BASE}/settings`, data);

// compliance
export const getComplianceCatalog = () =>
  axiosInstance.get<ComplianceCatalog>(`${BASE}/compliance/catalog`);
export const getPassport = (productId: string) =>
  axiosInstance.get<{ passport: Passport }>(`${BASE}/products/${productId}/compliance`);
export const getReceivingCheck = (
  productId: string,
  lot: { lotNumber?: string; expirationDate?: string } = {},
) =>
  axiosInstance.get<ReceivingCheck>(`${BASE}/products/${productId}/receiving-check`, {
    params: clean(lot),
  });
export const getBatchDocuments = (batchId: string) =>
  axiosInstance.get<{ batch: ComplianceDoc[]; product: ComplianceDoc[] }>(
    `${BASE}/batches/${batchId}/documents`,
  );
export const createDocument = (data: CreateDocumentInput) =>
  axiosInstance.post<{ document: ComplianceDoc }>(`${BASE}/documents`, data);
export const getDocument = (id: string) =>
  axiosInstance.get<{ document: ComplianceDoc }>(`${BASE}/documents/${id}`);
export const updateDocument = (id: string, data: DocumentDetailsInput) =>
  axiosInstance.put<{ document: ComplianceDoc }>(`${BASE}/documents/${id}`, data);
export const reviewDocument = (
  id: string,
  data: {
    status: "pending-review" | "reviewed" | "verified" | "rejected";
    method?: string;
    notes?: string;
  },
) => axiosInstance.post<{ document: ComplianceDoc }>(`${BASE}/documents/${id}/review`, data);
export const attachDocumentFile = (id: string, file: File) => {
  const form = new FormData();
  form.append("file", file);
  return axiosInstance.post<{ document: ComplianceDoc }>(
    `${BASE}/documents/${id}/file`,
    form,
    { headers: { "content-type": "multipart/form-data" } },
  );
};
// a link that works for 10 minutes
export const getDocumentFileUrl = (id: string, download = false) =>
  axiosInstance.get<{ url: string; expiresInSeconds: number }>(
    `${BASE}/documents/${id}/file`,
    { params: download ? { download: "true" } : {} },
  );
export const getChecklist = (categoryId: string) =>
  axiosInstance.get<{ checklist: Checklist }>(`${BASE}/categories/${categoryId}/checklist`);
export const setChecklist = (
  categoryId: string,
  items: { docType: string; level: "product" | "batch" }[],
) =>
  axiosInstance.put<{ checklist: Checklist }>(`${BASE}/categories/${categoryId}/checklist`, {
    items,
  });
export const resetChecklist = (categoryId: string) =>
  axiosInstance.delete<{ checklist: Checklist }>(`${BASE}/categories/${categoryId}/checklist`);

/** A fresh id that makes a retried submit count once. */
export const newRequestId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c) =>
        (Number(c) ^ (Math.random() * 16) >> (Number(c) / 4)).toString(16),
      );
