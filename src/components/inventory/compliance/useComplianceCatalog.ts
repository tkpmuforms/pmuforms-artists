import { useEffect, useState } from "react";
import {
  getComplianceCatalog,
  type ComplianceCatalog,
} from "../../../services/inventoryServices";

// fetched once per page load and shared by every compliance component
let cached: ComplianceCatalog | null = null;
let pending: Promise<ComplianceCatalog> | null = null;

const load = () => {
  if (!pending) {
    pending = getComplianceCatalog()
      .then(({ data }) => {
        cached = data;
        return data;
      })
      .catch((error) => {
        pending = null;
        throw error;
      });
  }
  return pending;
};

/** Clears the cache; for tests. */
export const resetComplianceCatalog = () => {
  cached = null;
  pending = null;
};

export const useComplianceCatalog = () => {
  const [catalog, setCatalog] = useState<ComplianceCatalog | null>(cached);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (cached) return;
    let alive = true;
    load()
      .then((data) => alive && setCatalog(data))
      .catch(() => alive && setError(true));
    return () => {
      alive = false;
    };
  }, []);

  return { catalog, error };
};
