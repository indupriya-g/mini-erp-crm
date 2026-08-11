import { useState, useEffect, FormEvent } from "react";
import { Link } from "react-router-dom";
import apiClient from "../api/client";
import Badge from "../components/Badge";
import Modal from "../components/Modal";

interface Customer {
  id: number;
  name: string;
  mobile: string;
  email: string | null;
  customerType: string;
  status: string;
}

const statusColor: Record<string, "green" | "yellow" | "gray"> = {
  ACTIVE: "green",
  LEAD: "yellow",
  INACTIVE: "gray",
};

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);

  // Form fields for the "Add Customer" modal
  const [form, setForm] = useState({ name: "", mobile: "", email: "", customerType: "RETAIL", address: "" });
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function fetchCustomers() {
    setLoading(true);
    try {
      const res = await apiClient.get("/customers", { params: { search } });
      setCustomers(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  // Runs once when the page loads, and again whenever "search" changes
  useEffect(() => {
    // Debounce: wait 400ms after the user stops typing before actually searching,
    // so we don't fire an API call on every single keystroke
    const timeout = setTimeout(() => {
      fetchCustomers();
    }, 400);
    return () => clearTimeout(timeout);
  }, [search]);

  async function handleAddCustomer(e: FormEvent) {
    e.preventDefault();
    setFormError("");
    setSubmitting(true);
    try {
      await apiClient.post("/customers", form);
      setShowAddModal(false);
      setForm({ name: "", mobile: "", email: "", customerType: "RETAIL", address: "" });
      fetchCustomers();
    } catch (err: any) {
      setFormError(err.response?.data?.message || "Failed to add customer");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-slate-800">Customers</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg"
        >
          + Add Customer
        </button>
      </div>

      <input
        type="text"
        placeholder="Search by name, mobile, or email..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full max-w-md border border-slate-300 rounded-lg px-3 py-2 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <p className="p-6 text-slate-500 text-sm">Loading...</p>
        ) : customers.length === 0 ? (
          <p className="p-6 text-slate-500 text-sm">No customers found.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Mobile</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <Link to={`/customers/${c.id}`} className="text-blue-600 hover:underline font-medium">
                      {c.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{c.mobile}</td>
                  <td className="px-4 py-3 text-slate-600">{c.customerType}</td>
                  <td className="px-4 py-3">
                    <Badge text={c.status} color={statusColor[c.status] || "gray"} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showAddModal && (
        <Modal title="Add Customer" onClose={() => setShowAddModal(false)}>
          <form onSubmit={handleAddCustomer} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Name *</label>
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Mobile *</label>
              <input
                required
                value={form.mobile}
                onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Customer Type *</label>
              <select
                value={form.customerType}
                onChange={(e) => setForm({ ...form, customerType: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="RETAIL">Retail</option>
                <option value="WHOLESALE">Wholesale</option>
                <option value="DISTRIBUTOR">Distributor</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
              <input
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>

            {formError && <p className="text-red-600 text-sm">{formError}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-medium py-2 rounded-lg text-sm"
            >
              {submitting ? "Adding..." : "Add Customer"}
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}