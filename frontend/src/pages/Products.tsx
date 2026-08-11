import { useState, useEffect, FormEvent } from "react";
import apiClient from "../api/client";
import Badge from "../components/Badge";
import Modal from "../components/Modal";

interface Product {
  id: number;
  name: string;
  sku: string;
  category: string | null;
  unitPrice: number;
  currentStock: number;
  minStockAlert: number;
  location: string | null;
}

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showStockModal, setShowStockModal] = useState<Product | null>(null);

  const [form, setForm] = useState({ name: "", sku: "", category: "", unitPrice: "", minStockAlert: "", location: "" });
  const [stockForm, setStockForm] = useState({ quantity: "", type: "IN", reason: "" });
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function fetchProducts() {
    setLoading(true);
    const res = await apiClient.get("/products");
    setProducts(res.data.data);
    setLoading(false);
  }

  useEffect(() => {
    fetchProducts();
  }, []);

  async function handleAddProduct(e: FormEvent) {
    e.preventDefault();
    setFormError("");
    setSubmitting(true);
    try {
      await apiClient.post("/products", {
        ...form,
        unitPrice: parseFloat(form.unitPrice),
        minStockAlert: parseInt(form.minStockAlert) || 0,
      });
      setShowAddModal(false);
      setForm({ name: "", sku: "", category: "", unitPrice: "", minStockAlert: "", location: "" });
      fetchProducts();
    } catch (err: any) {
      setFormError(err.response?.data?.message || "Failed to add product");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleStockMovement(e: FormEvent) {
    e.preventDefault();
    if (!showStockModal) return;
    setFormError("");
    setSubmitting(true);
    try {
      await apiClient.post(`/products/${showStockModal.id}/stock-movements`, {
        quantity: parseInt(stockForm.quantity),
        type: stockForm.type,
        reason: stockForm.reason,
      });
      setShowStockModal(null);
      setStockForm({ quantity: "", type: "IN", reason: "" });
      fetchProducts();
    } catch (err: any) {
      setFormError(err.response?.data?.message || "Failed to record stock movement");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-slate-800">Products</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg"
        >
          + Add Product
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <p className="p-6 text-slate-500 text-sm">Loading...</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">SKU</th>
                <th className="px-4 py-3 font-medium">Price</th>
                <th className="px-4 py-3 font-medium">Stock</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-800">{p.name}</td>
                  <td className="px-4 py-3 text-slate-600">{p.sku}</td>
                  <td className="px-4 py-3 text-slate-600">₹{p.unitPrice}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-700">{p.currentStock}</span>
                      {p.currentStock <= p.minStockAlert && <Badge text="Low Stock" color="red" />}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setShowStockModal(p)}
                      className="text-blue-600 hover:underline text-xs font-medium"
                    >
                      Update Stock
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showAddModal && (
        <Modal title="Add Product" onClose={() => setShowAddModal(false)}>
          <form onSubmit={handleAddProduct} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Name *</label>
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">SKU *</label>
              <input required value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Unit Price *</label>
              <input required type="number" step="0.01" value={form.unitPrice}
                onChange={(e) => setForm({ ...form, unitPrice: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Min Stock Alert</label>
              <input type="number" value={form.minStockAlert}
                onChange={(e) => setForm({ ...form, minStockAlert: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Location</label>
              <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            {formError && <p className="text-red-600 text-sm">{formError}</p>}
            <button type="submit" disabled={submitting}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-medium py-2 rounded-lg text-sm">
              {submitting ? "Adding..." : "Add Product"}
            </button>
          </form>
        </Modal>
      )}

      {showStockModal && (
        <Modal title={`Update Stock — ${showStockModal.name}`} onClose={() => setShowStockModal(null)}>
          <p className="text-sm text-slate-500 mb-4">Current stock: <span className="font-medium text-slate-700">{showStockModal.currentStock}</span></p>
          <form onSubmit={handleStockMovement} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Type *</label>
              <select value={stockForm.type} onChange={(e) => setStockForm({ ...stockForm, type: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">
                <option value="IN">IN (Stock received)</option>
                <option value="OUT">OUT (Stock removed)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Quantity *</label>
              <input required type="number" min="1" value={stockForm.quantity}
                onChange={(e) => setStockForm({ ...stockForm, quantity: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Reason *</label>
              <input required value={stockForm.reason} onChange={(e) => setStockForm({ ...stockForm, reason: e.target.value })}
                placeholder="e.g. Restock from supplier"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            {formError && <p className="text-red-600 text-sm">{formError}</p>}
            <button type="submit" disabled={submitting}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-medium py-2 rounded-lg text-sm">
              {submitting ? "Saving..." : "Save"}
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}