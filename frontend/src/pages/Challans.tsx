import { useState, useEffect, FormEvent } from "react";
import apiClient from "../api/client";
import Badge from "../components/Badge";
import Modal from "../components/Modal";

interface Customer { id: number; name: string; }
interface Product { id: number; name: string; currentStock: number; unitPrice: number; }
interface ChallanItem { id: number; productName: string; quantity: number; unitPrice: number; }
interface Challan {
  id: number;
  challanNumber: string;
  status: string;
  totalQuantity: number;
  createdAt: string;
  customer: Customer;
  items: ChallanItem[];
}

const statusColor: Record<string, "green" | "yellow" | "red"> = {
  CONFIRMED: "green",
  DRAFT: "yellow",
  CANCELLED: "red",
};

export default function Challans() {
  const [challans, setChallans] = useState<Challan[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const [customerId, setCustomerId] = useState("");
  const [lineItems, setLineItems] = useState([{ productId: "", quantity: "" }]);
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function fetchChallans() {
    setLoading(true);
    const res = await apiClient.get("/challans");
    setChallans(res.data.data);
    setLoading(false);
  }

  async function fetchDropdownData() {
    const [custRes, prodRes] = await Promise.all([
      apiClient.get("/customers", { params: { limit: 100 } }),
      apiClient.get("/products", { params: { limit: 100 } }),
    ]);
    setCustomers(custRes.data.data);
    setProducts(prodRes.data.data);
  }

  useEffect(() => {
    fetchChallans();
    fetchDropdownData();
  }, []);

  function updateLineItem(index: number, field: "productId" | "quantity", value: string) {
    const updated = [...lineItems];
    updated[index] = { ...updated[index], [field]: value };
    setLineItems(updated);
  }

  function addLineItem() {
    setLineItems([...lineItems, { productId: "", quantity: "" }]);
  }

  function removeLineItem(index: number) {
    setLineItems(lineItems.filter((_, i) => i !== index));
  }

  async function submitChallan(status: "DRAFT" | "CONFIRMED", e: FormEvent) {
    e.preventDefault();
    setFormError("");

    if (!customerId) {
      setFormError("Please select a customer");
      return;
    }
    const validItems = lineItems.filter((li) => li.productId && li.quantity);
    if (validItems.length === 0) {
      setFormError("Add at least one product with a quantity");
      return;
    }

    setSubmitting(true);
    try {
      await apiClient.post("/challans", {
        customerId: parseInt(customerId),
        status,
        items: validItems.map((li) => ({
          productId: parseInt(li.productId),
          quantity: parseInt(li.quantity),
        })),
      });
      setShowCreateModal(false);
      setCustomerId("");
      setLineItems([{ productId: "", quantity: "" }]);
      fetchChallans();
      fetchDropdownData(); // stock levels may have changed
    } catch (err: any) {
      setFormError(err.response?.data?.message || "Failed to create challan");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-slate-800">Sales Challans</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg"
        >
          + Create Challan
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <p className="p-6 text-slate-500 text-sm">Loading...</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Challan #</th>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Items</th>
                <th className="px-4 py-3 font-medium">Qty</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {challans.map((c) => (
                <tr key={c.id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-800">{c.challanNumber}</td>
                  <td className="px-4 py-3 text-slate-600">{c.customer.name}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {c.items.map((i) => i.productName).join(", ")}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{c.totalQuantity}</td>
                  <td className="px-4 py-3"><Badge text={c.status} color={statusColor[c.status]} /></td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{new Date(c.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showCreateModal && (
        <Modal title="Create Sales Challan" onClose={() => setShowCreateModal(false)}>
          <form className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Customer *</label>
              <select value={customerId} onChange={(e) => setCustomerId(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">
                <option value="">Select customer...</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Products *</label>
              <div className="space-y-2">
                {lineItems.map((item, index) => {
                  const selectedProduct = products.find((p) => p.id === parseInt(item.productId));
                  return (
                    <div key={index} className="flex gap-2 items-start">
                      <select
                        value={item.productId}
                        onChange={(e) => updateLineItem(index, "productId", e.target.value)}
                        className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm"
                      >
                        <option value="">Select product...</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>{p.name} (stock: {p.currentStock})</option>
                        ))}
                      </select>
                      <input
                        type="number"
                        min="1"
                        placeholder="Qty"
                        value={item.quantity}
                        onChange={(e) => updateLineItem(index, "quantity", e.target.value)}
                        className="w-24 border border-slate-300 rounded-lg px-3 py-2 text-sm"
                      />
                      {lineItems.length > 1 && (
                        <button type="button" onClick={() => removeLineItem(index)}
                          className="text-slate-400 hover:text-red-600 px-2">×</button>
                      )}
                      {selectedProduct && parseInt(item.quantity) > selectedProduct.currentStock && (
                        <span className="text-red-600 text-xs whitespace-nowrap self-center">Exceeds stock!</span>
                      )}
                    </div>
                  );
                })}
              </div>
              <button type="button" onClick={addLineItem}
                className="text-blue-600 text-xs font-medium mt-2 hover:underline">
                + Add another product
              </button>
            </div>

            {formError && <p className="text-red-600 text-sm">{formError}</p>}

            <div className="flex gap-2 pt-2">
              <button
                onClick={(e) => submitChallan("DRAFT", e)}
                disabled={submitting}
                className="flex-1 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 font-medium py-2 rounded-lg text-sm"
              >
                Save as Draft
              </button>
              <button
                onClick={(e) => submitChallan("CONFIRMED", e)}
                disabled={submitting}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-medium py-2 rounded-lg text-sm"
              >
                {submitting ? "Saving..." : "Confirm Challan"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}