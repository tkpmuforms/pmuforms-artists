import type React from "react";
import type {
  BatchStatus,
  DocumentStatus,
  StockStatus,
} from "../../services/inventoryServices";
import {
  BATCH_STATUS,
  DOC_STATUS,
  STOCK_STATUS,
  type Tone,
} from "../../utils/inventory";

export const Badge: React.FC<{ tone: Tone; children: React.ReactNode }> = ({
  tone,
  children,
}) => <span className={`inv-badge inv-badge--${tone}`}>{children}</span>;

export const BatchStatusBadge: React.FC<{ status: BatchStatus }> = ({ status }) => (
  <Badge tone={BATCH_STATUS[status]?.tone ?? "grey"}>
    {BATCH_STATUS[status]?.label ?? status}
  </Badge>
);

export const StockStatusBadge: React.FC<{ status: StockStatus }> = ({ status }) => (
  <Badge tone={STOCK_STATUS[status]?.tone ?? "grey"}>
    {STOCK_STATUS[status]?.label ?? status}
  </Badge>
);

export const DocStatusBadge: React.FC<{ status: DocumentStatus }> = ({ status }) => (
  <Badge tone={DOC_STATUS[status]?.tone ?? "grey"}>
    {DOC_STATUS[status]?.label ?? status}
  </Badge>
);
