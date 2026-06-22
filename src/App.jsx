import { useState, useEffect, useCallback } from "react";

const API_BASE = "https://api.escuelajs.co/api/v1";

// ─── Toast System ────────────────────────────────────────────────────────────
function ToastContainer({ toasts, removeToast }) {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 w-80">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-start gap-3 p-4 rounded-xl shadow-lg border text-sm font-medium transition-all duration-300 ${
            t.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : t.type === "error"
              ? "bg-red-50 border-red-200 text-red-800"
              : "bg-blue-50 border-blue-200 text-blue-800"
          }`}
        >
          <span className="text-base mt-0.5">
            {t.type === "success" ? "✅" : t.type === "error" ? "❌" : "ℹ️"}
          </span>
          <span className="flex-1">{t.message}</span>
          <button
            onClick={() => removeToast(t.id)}
            className="text-gray-400 hover:text-gray-600 font-bold text-lg leading-none ml-1"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}

function useToasts() {
  const [toasts, setToasts] = useState([]);
  const add = useCallback((message, type = "info") => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);
  const remove = useCallback((id) => setToasts((prev) => prev.filter((t) => t.id !== id)), []);
  return { toasts, add, remove };
}

// ─── Validation ───────────────────────────────────────────────────────────────
function validateProduct(data) {
  const errors = {};
  if (!data.title || data.title.trim().length < 3)
    errors.title = "El título debe tener al menos 3 caracteres.";
  if (!data.price || isNaN(Number(data.price)) || Number(data.price) <= 0)
    errors.price = "El precio debe ser un número mayor a 0.";
  if (!data.description || data.description.trim().length < 10)
    errors.description = "La descripción debe tener al menos 10 caracteres.";
  if (!data.categoryId)
    errors.categoryId = "Selecciona una categoría.";
  if (data.images && data.images.trim()) {
    try { new URL(data.images.trim()); }
    catch { errors.images = "La URL de imagen no es válida."; }
  }
  return errors;
}

// ─── Product Form Modal ───────────────────────────────────────────────────────
function ProductModal({ product, categories, onClose, onSave, loading }) {
  const isEdit = !!product?.id;
  const [form, setForm] = useState({
    title: product?.title || "",
    price: product?.price || "",
    description: product?.description || "",
    categoryId: product?.category?.id || "",
    images: product?.images?.[0] || "",
  });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    if (errors[name]) setErrors((e) => ({ ...e, [name]: undefined }));
  };

  const handleSubmit = () => {
    const errs = validateProduct(form);
    if (Object.keys(errs).length) { setErrors(errs); return; }
    onSave({
      title: form.title.trim(),
      price: Number(form.price),
      description: form.description.trim(),
      categoryId: Number(form.categoryId),
      images: form.images.trim() ? [form.images.trim()] : ["https://placehold.co/600x400"],
    });
  };

  const Field = ({ label, name, type = "text", as, children, placeholder }) => (
    <div>
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">{label}</label>
      {as === "textarea" ? (
        <textarea
          name={name}
          value={form[name]}
          onChange={handleChange}
          rows={3}
          placeholder={placeholder}
          className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 resize-none ${errors[name] ? "border-red-400 bg-red-50" : "border-gray-200 bg-gray-50"}`}
        />
      ) : as === "select" ? (
        <select
          name={name}
          value={form[name]}
          onChange={handleChange}
          className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 ${errors[name] ? "border-red-400 bg-red-50" : "border-gray-200 bg-gray-50"}`}
        >
          <option value="">— Seleccionar categoría —</option>
          {children}
        </select>
      ) : (
        <input
          type={type}
          name={name}
          value={form[name]}
          onChange={handleChange}
          placeholder={placeholder}
          className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 ${errors[name] ? "border-red-400 bg-red-50" : "border-gray-200 bg-gray-50"}`}
        />
      )}
      {errors[name] && <p className="text-red-500 text-xs mt-1">{errors[name]}</p>}
    </div>
  );

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-800">
            {isEdit ? "✏️ Editar producto" : "➕ Nuevo producto"}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl font-light">×</button>
        </div>
        <div className="p-6 flex flex-col gap-4">
          <Field label="Nombre del producto" name="title" placeholder="Ej: Laptop gaming 15 pulgadas" />
          <Field label="Precio (USD)" name="price" type="number" placeholder="Ej: 299" />
          <Field label="Descripción" name="description" as="textarea" placeholder="Describe el producto brevemente..." />
          <Field label="Categoría" name="categoryId" as="select">
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </Field>
          <Field label="URL de imagen (opcional)" name="images" placeholder="https://..." />
        </div>
        <div className="flex gap-3 p-6 pt-0">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Guardando…" : isEdit ? "Guardar cambios" : "Crear producto"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Delete Confirm Modal ─────────────────────────────────────────────────────
function DeleteModal({ product, onClose, onConfirm, loading }) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
        <div className="text-5xl mb-4">🗑️</div>
        <h3 className="text-lg font-bold text-gray-800 mb-2">¿Eliminar producto?</h3>
        <p className="text-sm text-gray-500 mb-6">
          Se eliminará <strong>"{product.title}"</strong> permanentemente. Esta acción no se puede deshacer.
        </p>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition-colors disabled:opacity-50"
          >
            {loading ? "Eliminando…" : "Sí, eliminar"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(null);
  const { toasts, add: toast, remove: removeToast } = useToasts();

  const fetchProducts = useCallback(async () => {
    setLoadingProducts(true);
    try {
      const res = await fetch(`${API_BASE}/products?offset=0&limit=50`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setProducts(data);
    } catch {
      toast("No se pudieron cargar los productos.", "error");
    } finally {
      setLoadingProducts(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchProducts();
    fetch(`${API_BASE}/categories`)
      .then((r) => r.json())
      .then(setCategories)
      .catch(() => {});
  }, [fetchProducts]);

  const handleCreate = async (body) => {
    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE}/products/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error();
      const created = await res.json();
      setProducts((p) => [created, ...p]);
      toast("Producto creado exitosamente. ✨", "success");
      setModal(null);
    } catch {
      toast("Error al crear el producto.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdate = async (body) => {
    const { id } = modal.product;
    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE}/products/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      setProducts((p) => p.map((x) => (x.id === id ? updated : x)));
      toast("Producto actualizado correctamente.", "success");
      setModal(null);
    } catch {
      toast("Error al actualizar el producto.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    const { id } = modal.product;
    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE}/products/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setProducts((p) => p.filter((x) => x.id !== id));
      toast("Producto eliminado.", "success");
      setModal(null);
    } catch {
      toast("Error al eliminar el producto.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const filtered = products.filter(
    (p) =>
      p.title?.toLowerCase().includes(search.toLowerCase()) ||
      p.category?.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-violet-50 font-sans">
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      <header className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-violet-600 flex items-center justify-center text-white font-bold text-lg">P</div>
            <div>
              <h1 className="text-base font-bold text-gray-800 leading-tight">Gestión de Productos</h1>
              <p className="text-xs text-gray-400">Platzi Fake Store API</p>
            </div>
          </div>
          <button
            onClick={() => setModal({ type: "create" })}
            className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors shadow-sm"
          >
            <span className="text-lg leading-none">+</span>
            Nuevo producto
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total productos", value: products.length, icon: "📦" },
            { label: "Categorías", value: categories.length, icon: "🏷️" },
            { label: "Resultado búsqueda", value: filtered.length, icon: "🔍" },
            { label: "API", value: "Online", icon: "🟢" },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
              <div className="text-2xl mb-1">{s.icon}</div>
              <div className="text-2xl font-bold text-gray-800">{s.value}</div>
              <div className="text-xs text-gray-400 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="mb-6">
          <div className="relative max-w-md">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
            <input
              type="text"
              placeholder="Buscar por nombre o categoría…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 shadow-sm"
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-16">ID</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Producto</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Categoría</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Precio</th>
                  <th className="text-center px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loadingProducts ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i}>
                      {[5, 40, 20, 12, 20].map((w, j) => (
                        <td key={j} className="px-5 py-4">
                          <div className={`h-4 bg-gray-100 rounded animate-pulse`} style={{ width: `${w}%` }} />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-16 text-gray-400">
                      <div className="text-4xl mb-2">📭</div>
                      <div className="font-medium">No se encontraron productos</div>
                      <div className="text-xs mt-1">Intenta con otra búsqueda o crea un producto nuevo.</div>
                    </td>
                  </tr>
                ) : (
                  filtered.map((p) => (
                    <tr key={p.id} className="hover:bg-violet-50/40 transition-colors">
                      <td className="px-5 py-3.5 text-gray-400 font-mono text-xs">#{p.id}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <img
                            src={p.images?.[0] || "https://placehold.co/40x40"}
                            alt={p.title}
                            className="w-10 h-10 rounded-lg object-cover bg-gray-100 flex-shrink-0"
                            onError={(e) => { e.target.src = "https://placehold.co/40x40"; }}
                          />
                          <div className="min-w-0">
                            <div className="font-semibold text-gray-800 truncate max-w-[200px]">{p.title}</div>
                            <div className="text-xs text-gray-400 truncate max-w-[200px]">{p.description}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 hidden sm:table-cell">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-violet-100 text-violet-700">
                          {p.category?.name || "—"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right font-semibold text-gray-800">
                        ${p.price?.toLocaleString()}
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => setModal({ type: "edit", product: p })}
                            className="p-2 rounded-lg hover:bg-blue-50 text-blue-500 hover:text-blue-700 transition-colors"
                            title="Editar"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => setModal({ type: "delete", product: p })}
                            className="p-2 rounded-lg hover:bg-red-50 text-red-400 hover:text-red-600 transition-colors"
                            title="Eliminar"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {!loadingProducts && filtered.length > 0 && (
            <div className="px-5 py-3 border-t border-gray-50 text-xs text-gray-400">
              Mostrando {filtered.length} de {products.length} productos
            </div>
          )}
        </div>
      </main>

      {(modal?.type === "create" || modal?.type === "edit") && (
        <ProductModal
          product={modal.type === "edit" ? modal.product : null}
          categories={categories}
          onClose={() => setModal(null)}
          onSave={modal.type === "edit" ? handleUpdate : handleCreate}
          loading={actionLoading}
        />
      )}
      {modal?.type === "delete" && (
        <DeleteModal
          product={modal.product}
          onClose={() => setModal(null)}
          onConfirm={handleDelete}
          loading={actionLoading}
        />
      )}
    </div>
  );
}