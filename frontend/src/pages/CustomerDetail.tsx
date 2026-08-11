import { useState, useEffect, FormEvent } from "react";
import { useParams, Link } from "react-router-dom";
import apiClient from "../api/client";
import Badge from "../components/Badge";

interface FollowUp {
  id: number;
  note: string;
  createdBy: string;
  createdAt: string;
}

interface CustomerDetail {
  id: number;
  name: string;
  mobile: string;
  email: string | null;
  businessName: string | null;
  customerType: string;
  status: string;
  address: string | null;
  followUps: FollowUp[];
}

export default function CustomerDetail() {
  const { id } = useParams(); // reads the ":id" part of the URL
  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function fetchCustomer() {
    setLoading(true);
    const res = await apiClient.get(`/customers/${id}`);
    setCustomer(res.data);
    setLoading(false);
  }

  useEffect(() => {
    fetchCustomer();
  }, [id]);

  async function handleAddFollowUp(e: FormEvent) {
    e.preventDefault();
    if (!note.trim()) return;
    setSubmitting(true);
    try {
      await apiClient.post(`/customers/${id}/follow-ups`, { note });
      setNote("");
      fetchCustomer(); // reload so the new note appears in the list
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <p className="text-slate-500 text-sm">Loading...</p>;
  if (!customer) return <p className="text-slate-500 text-sm">Customer not found.</p>;

  return (
    <div>
      <Link to="/customers" className="text-blue-600 text-sm hover:underline">← Back to Customers</Link>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mt-4 mb-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-xl font-semibold text-slate-800">{customer.name}</h1>
            {customer.businessName && <p className="text-slate-500 text-sm">{customer.businessName}</p>}
          </div>
          <Badge text={customer.status} color={customer.status === "ACTIVE" ? "green" : "yellow"} />
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><span className="text-slate-400">Mobile:</span> <span className="text-slate-700">{customer.mobile}</span></div>
          <div><span className="text-slate-400">Email:</span> <span className="text-slate-700">{customer.email || "—"}</span></div>
          <div><span className="text-slate-400">Type:</span> <span className="text-slate-700">{customer.customerType}</span></div>
          <div><span className="text-slate-400">Address:</span> <span className="text-slate-700">{customer.address || "—"}</span></div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Follow-up Notes</h2>

        <form onSubmit={handleAddFollowUp} className="flex gap-2 mb-6">
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add a follow-up note..."
            className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm"
          />
          <button
            type="submit"
            disabled={submitting}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-sm font-medium px-4 py-2 rounded-lg"
          >
            Add
          </button>
        </form>

        {customer.followUps.length === 0 ? (
          <p className="text-slate-400 text-sm">No follow-ups yet.</p>
        ) : (
          <div className="space-y-3">
            {customer.followUps.map((f) => (
              <div key={f.id} className="border-l-2 border-blue-200 pl-3 py-1">
                <p className="text-slate-700 text-sm">{f.note}</p>
                <p className="text-slate-400 text-xs mt-1">
                  {f.createdBy} · {new Date(f.createdAt).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}