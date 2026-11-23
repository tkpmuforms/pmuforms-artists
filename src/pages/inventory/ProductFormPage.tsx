import { Plus, Trash2 } from "lucide-react";
import type React from "react";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate, useParams } from "react-router-dom";
import InventoryGate from "../../components/inventoryComp/InventoryGate";
import ManufacturerModal from "../../components/inventoryComp/ManufacturerModal";
import SupplierModal from "../../components/inventoryComp/SupplierModal";
import "../../components/inventoryComp/inventory.scss";
import {
  type Category,
  type Ingredient,
  type Manufacturer,
  type Product,
  type ProductInput,
  type Supplier,
  createCategory,
  createProduct,
  getCategories,
  getManufacturers,
  getProduct,
  getSuppliers,
  getUnits,
  updateProduct,
} from "../../services/inventoryServices";
import { getApiErrorMessage } from "../../utils/formLinks";
import { isAmount } from "../../utils/inventory";
import Field from "../../components/inventoryComp/Field";

const NEW = "__new__";

interface FormState {
  name: string;
  categoryId: string;
  inventoryType: "trackable" | "non-stock";
  unit: string;
  brand: string;
  manufacturerId: string;
  sku: string;
  barcode: string;
  description: string;
  productType: string;
  keywords: string;
  costPerUnit: string;
  defaultSupplierId: string;
  countryOfManufacture: string;
  lowStockThreshold: string;
  ingredients: Ingredient[];
}

const fromProduct = (p?: Product): FormState => ({
  name: p?.name ?? "",
  categoryId: p?.categoryId ?? "",
  inventoryType: p?.inventoryType ?? "trackable",
  unit: p?.unit ?? "ml",
  brand: p?.brand ?? "",
  manufacturerId: p?.manufacturerId ?? "",
  sku: p?.sku ?? "",
  barcode: p?.barcode ?? "",
  description: p?.description ?? "",
  productType: p?.productType ?? "",
  keywords: (p?.keywords ?? []).join(", "),
  costPerUnit: p?.costPerUnit ?? "",
  defaultSupplierId: p?.defaultSupplierId ?? "",
  countryOfManufacture: p?.countryOfManufacture ?? "",
  lowStockThreshold: p?.lowStockThreshold ?? "",
  ingredients: p?.ingredients ?? [],
});

const opt = (v: string) => (v.trim() ? v.trim() : undefined);

const ProductFormPage: React.FC = () => (
  <InventoryGate>
    <ProductForm />
  </InventoryGate>
);

const ProductForm: React.FC = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const editing = !!productId;
  const [product, setProduct] = useState<Product | null>(null);
  const [form, setForm] = useState<FormState>(fromProduct());
  const [categories, setCategories] = useState<Category[]>([]);
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [units, setUnits] = useState<string[]>(["ml"]);
  const [loading, setLoading] = useState(editing);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [newCategory, setNewCategory] = useState<string | null>(null);
  const [showManufacturer, setShowManufacturer] = useState(false);
  const [showSupplier, setShowSupplier] = useState(false);

  useEffect(() => {
    getCategories().then(({ data }) => setCategories(data.categories)).catch(() => {});
    getManufacturers().then(({ data }) => setManufacturers(data.manufacturers)).catch(() => {});
    getSuppliers().then(({ data }) => setSuppliers(data.suppliers)).catch(() => {});
    getUnits().then(({ data }) => setUnits(data.units)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!productId) return;
    getProduct(productId)
      .then(({ data }) => {
        setProduct(data.product);
        setForm(fromProduct(data.product));
      })
      .catch((e) => setApiError(getApiErrorMessage(e, "Couldn't load the product.")))
      .finally(() => setLoading(false));
  }, [productId]);

  // stock already received means quantities are in this unit for good
  const unitLocked = editing && (product?.batchCount ?? 0) > 0;
  const unitOptions = useMemo(
    () => (units.includes(form.unit) || !form.unit ? units : [form.unit, ...units]),
    [units, form.unit],
  );

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));
  const bind = (key: keyof FormState) => ({
    value: form[key] as string,
    onChange: (
      e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
    ) => set(key, e.target.value as never),
  });

  const setIngredient = (i: number, key: keyof Ingredient, value: string) =>
    set(
      "ingredients",
      form.ingredients.map((row, idx) => (idx === i ? { ...row, [key]: value } : row)),
    );

  const validate = () => {
    const next: Record<string, string> = {};
    if (!form.name.trim()) next.name = "Enter the product name.";
    if (!form.categoryId) next.categoryId = "Choose a category.";
    if (!form.unit.trim()) next.unit = "Choose a unit.";
    if (form.costPerUnit && !isAmount(form.costPerUnit, 2)) {
      next.costPerUnit = "Use an amount like 12.50.";
    }
    if (form.lowStockThreshold && !isAmount(form.lowStockThreshold)) {
      next.lowStockThreshold = "Use a number with up to 3 decimals.";
    }
    form.ingredients.forEach((ing, i) => {
      if (!ing.name.trim()) next[`ingredient-${i}`] = "Name the ingredient or remove the row.";
    });
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const save = async () => {
    if (!validate()) return;
    setSaving(true);
    setApiError(null);
    const data: ProductInput = {
      name: form.name.trim(),
      categoryId: form.categoryId,
      inventoryType: form.inventoryType,
      unit: form.unit.trim(),
      brand: opt(form.brand),
      manufacturerId: opt(form.manufacturerId),
      sku: opt(form.sku),
      barcode: opt(form.barcode),
      description: opt(form.description),
      productType: opt(form.productType),
      keywords: form.keywords
        .split(",")
        .map((k) => k.trim())
        .filter(Boolean),
      costPerUnit: opt(form.costPerUnit),
      defaultSupplierId: opt(form.defaultSupplierId),
      countryOfManufacture: opt(form.countryOfManufacture),
      lowStockThreshold: form.inventoryType === "trackable" ? opt(form.lowStockThreshold) : undefined,
      ingredients: form.ingredients.map((ing) => ({
        name: ing.name.trim(),
        casNumber: opt(ing.casNumber ?? ""),
        ciNumber: opt(ing.ciNumber ?? ""),
        pigmentIdentifier: opt(ing.pigmentIdentifier ?? ""),
        colorAdditiveInfo: opt(ing.colorAdditiveInfo ?? ""),
        function: opt(ing.function ?? ""),
      })),
    };
    try {
      const { data: res } = editing
        ? await updateProduct(productId!, data)
        : await createProduct(data);
      toast.success(editing ? "Product saved" : "Product added");
      navigate(`/inventory/products/${res.product.id}`, { replace: true });
    } catch (e) {
      setApiError(getApiErrorMessage(e, "Couldn't save the product."));
    } finally {
      setSaving(false);
    }
  };

  const addCategory = async () => {
    const name = newCategory?.trim();
    if (!name) return;
    try {
      const { data } = await createCategory(name);
      setCategories((c) => [...c, data.category]);
      set("categoryId", data.category.id);
      setNewCategory(null);
    } catch (e) {
      toast.error(getApiErrorMessage(e, "Couldn't add the category."));
    }
  };

  if (loading) return <div className="inv-loading">Loading…</div>;

  return (
    <div className="inv-page" style={{ maxWidth: 860 }}>
      <div className="inv-head">
        <p>
          {editing
            ? "Changes here never change stock. Stock changes only when you receive, use or adjust it."
            : "Add a product once, then receive stock for it lot by lot."}
        </p>
      </div>

      <section className="inv-card">
        <h3>Product</h3>
        <div className="inv-grid">
          <Field className="inv-span-2" label="Name">
            <input {...bind("name")} placeholder="e.g. Perma Blend Dark Brown" />
            {errors.name && <span className="inv-field__error">{errors.name}</span>}
          </Field>

          <div className="inv-field">
            <label htmlFor="inv-category">Category</label>
            {newCategory === null ? (
              <select
                id="inv-category"
                value={form.categoryId}
                onChange={(e) =>
                  e.target.value === NEW ? setNewCategory("") : set("categoryId", e.target.value)
                }
              >
                <option value="">Choose…</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
                <option value={NEW}>+ New category…</option>
              </select>
            ) : (
              <div style={{ display: "flex", gap: 6 }}>
                <input
                  aria-label="New category name"
                  value={newCategory}
                  autoFocus
                  onChange={(e) => setNewCategory(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addCategory()}
                />
                <button className="inv-btn inv-btn--sm" onClick={addCategory}>
                  Add
                </button>
                <button className="inv-btn inv-btn--sm" onClick={() => setNewCategory(null)}>
                  Cancel
                </button>
              </div>
            )}
            {errors.categoryId && <span className="inv-field__error">{errors.categoryId}</span>}
          </div>

          <label className="inv-field">
            <span>Brand</span>
            <input {...bind("brand")} />
          </label>

          <div className="inv-field inv-span-2">
            <span>Do you track stock for it?</span>
            <div className="inv-segmented" role="group" aria-label="Stock tracking">
              <button
                type="button"
                aria-pressed={form.inventoryType === "trackable"}
                disabled={unitLocked}
                onClick={() => set("inventoryType", "trackable")}
              >
                Track stock &amp; lots
              </button>
              <button
                type="button"
                aria-pressed={form.inventoryType === "non-stock"}
                disabled={unitLocked}
                onClick={() => set("inventoryType", "non-stock")}
              >
                Don't track
              </button>
            </div>
            <span className="inv-field__hint">
              {form.inventoryType === "trackable"
                ? "You'll receive it by lot number and expiration, and each use comes out of a specific lot."
                : "For things you don't count, like cotton pads. It won't have batches or stock."}
            </span>
          </div>

          <Field label="Unit">
            <select {...bind("unit")} disabled={unitLocked}>
              {unitOptions.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
            <span className="inv-field__hint">
              {unitLocked
                ? "Locked: stock has been received in this unit."
                : "All quantities for this product use this unit."}
            </span>
          </Field>

          {form.inventoryType === "trackable" && (
            <Field label="Low stock level (optional)">
              <input {...bind("lowStockThreshold")} inputMode="decimal" placeholder="e.g. 5" />
              {errors.lowStockThreshold ? (
                <span className="inv-field__error">{errors.lowStockThreshold}</span>
              ) : (
                <span className="inv-field__hint">Shows as low stock at or below this, in {form.unit}.</span>
              )}
            </Field>
          )}

          <label className="inv-field">
            <span>SKU</span>
            <input {...bind("sku")} />
          </label>
          <label className="inv-field">
            <span>Barcode</span>
            <input {...bind("barcode")} />
          </label>
          <Field label={<>Cost per {form.unit || "unit"} (optional)</>}>
            <input {...bind("costPerUnit")} inputMode="decimal" placeholder="0.00" />
            {errors.costPerUnit && <span className="inv-field__error">{errors.costPerUnit}</span>}
          </Field>
          <label className="inv-field">
            <span>Product type</span>
            <input {...bind("productType")} placeholder="e.g. Organic pigment" />
          </label>
          <label className="inv-field inv-span-2">
            <span>Description</span>
            <textarea {...bind("description")} />
          </label>
          <label className="inv-field inv-span-2">
            <span>Keywords</span>
            <input {...bind("keywords")} placeholder="Comma separated, e.g. brows, warm" />
          </label>
        </div>
      </section>

      <section className="inv-card">
        <h3>Manufacturer &amp; supplier</h3>
        <div className="inv-grid">
          <div className="inv-field">
            <label htmlFor="inv-manufacturer">Manufacturer</label>
            <select
              id="inv-manufacturer"
              value={form.manufacturerId}
              onChange={(e) =>
                e.target.value === NEW
                  ? setShowManufacturer(true)
                  : set("manufacturerId", e.target.value)
              }
            >
              <option value="">None</option>
              {manufacturers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
              <option value={NEW}>+ Add manufacturer…</option>
            </select>
          </div>
          <label className="inv-field">
            <span>Country of manufacture</span>
            <input {...bind("countryOfManufacture")} />
          </label>
          <div className="inv-field">
            <label htmlFor="inv-supplier">Usual supplier</label>
            <select
              id="inv-supplier"
              value={form.defaultSupplierId}
              onChange={(e) =>
                e.target.value === NEW
                  ? setShowSupplier(true)
                  : set("defaultSupplierId", e.target.value)
              }
            >
              <option value="">None</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
              <option value={NEW}>+ Add supplier…</option>
            </select>
          </div>
        </div>
      </section>

      <section className="inv-card">
        <div className="inv-card__head">
          <h3>Ingredients</h3>
          <button
            className="inv-btn inv-btn--sm"
            onClick={() => set("ingredients", [...form.ingredients, { name: "" }])}
          >
            <Plus size={14} /> Add ingredient
          </button>
        </div>
        <p className="inv-muted" style={{ marginTop: 0 }}>
          As listed by the manufacturer. CAS and CI numbers are optional: record
          them where the manufacturer provides them. You can also upload the
          manufacturer's ingredient list under Compliance &amp; Safety.
        </p>
        {form.ingredients.length === 0 ? (
          <p className="inv-small">No ingredients entered.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {form.ingredients.map((ing, i) => (
              <div key={i} className="inv-card" style={{ padding: 14, background: "#f8fafc" }}>
                <div className="inv-grid inv-grid--3">
                  <Field label="Ingredient name">
                    <input
                      value={ing.name}
                      onChange={(e) => setIngredient(i, "name", e.target.value)}
                    />
                    {errors[`ingredient-${i}`] && (
                      <span className="inv-field__error">{errors[`ingredient-${i}`]}</span>
                    )}
                  </Field>
                  <label className="inv-field">
                    <span>CAS number (optional)</span>
                    <input
                      value={ing.casNumber ?? ""}
                      onChange={(e) => setIngredient(i, "casNumber", e.target.value)}
                    />
                  </label>
                  <label className="inv-field">
                    <span>CI number (optional)</span>
                    <input
                      value={ing.ciNumber ?? ""}
                      onChange={(e) => setIngredient(i, "ciNumber", e.target.value)}
                    />
                  </label>
                  <label className="inv-field">
                    <span>Pigment identifier</span>
                    <input
                      value={ing.pigmentIdentifier ?? ""}
                      onChange={(e) => setIngredient(i, "pigmentIdentifier", e.target.value)}
                    />
                  </label>
                  <label className="inv-field">
                    <span>Color additive information</span>
                    <input
                      value={ing.colorAdditiveInfo ?? ""}
                      onChange={(e) => setIngredient(i, "colorAdditiveInfo", e.target.value)}
                    />
                  </label>
                  <label className="inv-field">
                    <span>Function (optional)</span>
                    <input
                      value={ing.function ?? ""}
                      onChange={(e) => setIngredient(i, "function", e.target.value)}
                    />
                  </label>
                </div>
                <button
                  className="inv-btn inv-btn--link"
                  style={{ marginTop: 8, color: "#b91c1c" }}
                  onClick={() =>
                    set(
                      "ingredients",
                      form.ingredients.filter((_, idx) => idx !== i),
                    )
                  }
                >
                  <Trash2 size={14} /> Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {apiError && <p className="inv-error">{apiError}</p>}

      <div className="inv-head__actions" style={{ justifyContent: "flex-end" }}>
        <button className="inv-btn" onClick={() => navigate(-1)}>
          Cancel
        </button>
        <button className="inv-btn inv-btn--primary" onClick={save} disabled={saving}>
          {saving ? "Saving…" : editing ? "Save changes" : "Add product"}
        </button>
      </div>

      {showManufacturer && (
        <ManufacturerModal
          onClose={() => setShowManufacturer(false)}
          onSaved={(m) => {
            setManufacturers((list) => [...list, m]);
            set("manufacturerId", m.id);
            if (!form.countryOfManufacture && m.country) set("countryOfManufacture", m.country);
            setShowManufacturer(false);
          }}
        />
      )}
      {showSupplier && (
        <SupplierModal
          onClose={() => setShowSupplier(false)}
          onSaved={(s) => {
            setSuppliers((list) => [...list, s]);
            set("defaultSupplierId", s.id);
            setShowSupplier(false);
          }}
        />
      )}
    </div>
  );
};

export default ProductFormPage;
