import type { BatchDetail, UsageReportRow } from "../services/inventoryServices";

/** One cell of a spreadsheet export, safe from formula injection. */
const csvCell = (value: unknown) => {
  let text = value === null || value === undefined ? "" : String(value);
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
};

/** The clients who received a lot, as a spreadsheet (e.g. for a recall). */
export const downloadClientList = (batch: BatchDetail, rows: UsageReportRow[]) => {
  const header = ["Client", "Appointment date", "Treatment", "Product", "Lot", "Quantity", "Unit", "Used at"];
  const lines = rows.map((r) =>
    [
      r.customerName ?? "",
      r.appointmentDate ? r.appointmentDate.slice(0, 10) : "",
      r.treatment ?? "",
      r.productName,
      r.lotNumber,
      r.quantity,
      r.unit,
      r.usedAt,
    ]
      .map(csvCell)
      .join(","),
  );
  const blob = new Blob([[header.map(csvCell).join(","), ...lines].join("\r\n")], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `lot-${batch.lotNumber.replace(/[^a-z0-9_-]/gi, "_")}-clients.csv`;
  a.click();
  URL.revokeObjectURL(url);
};
