"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import AdminGuard from "@/components/admin/AdminGuard";
import AdminSidebar from "@/components/admin/AdminSidebar";

function CouponsContent() {
  const { token } = useAuth();
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    code: "",
    discountType: "percentage",
    discountValue: "",
    minOrderAmount: "",
    maxUses: "",
    expiresAt: "",
  });

  const fetchCoupons = () => {
    api
      .getCoupons(token)
      .then(setCoupons)
      .catch((err) => console.error(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(fetchCoupons, [token]);

  const handleAdd = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await api.createCoupon(
        {
          ...form,
          discountValue: Number(form.discountValue),
          minOrderAmount: form.minOrderAmount ? Number(form.minOrderAmount) : 0,
          maxUses: form.maxUses ? Number(form.maxUses) : null,
        },
        token
      );
      setForm({ code: "", discountType: "percentage", discountValue: "", minOrderAmount: "", maxUses: "", expiresAt: "" });
      fetchCoupons();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this coupon?")) return;
    try {
      await api.deleteCoupon(id, token);
      setCoupons((prev) => prev.filter((c) => c._id !== id));
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="flex-1 px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Coupons</h1>

      <form onSubmit={handleAdd} className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6 max-w-2xl">
        <input
          placeholder="CODE"
          value={form.code}
          onChange={(e) => setForm({ ...form, code: e.target.value })}
          required
          className="border rounded px-3 py-2 text-sm"
        />
        <select
          value={form.discountType}
          onChange={(e) => setForm({ ...form, discountType: e.target.value })}
          className="border rounded px-3 py-2 text-sm"
        >
          <option value="percentage">Percentage %</option>
          <option value="fixed">Fixed Amount</option>
        </select>
        <input
          type="number"
          placeholder="Discount value"
          value={form.discountValue}
          onChange={(e) => setForm({ ...form, discountValue: e.target.value })}
          required
          className="border rounded px-3 py-2 text-sm"
        />
        <input
          type="number"
          placeholder="Min order amount"
          value={form.minOrderAmount}
          onChange={(e) => setForm({ ...form, minOrderAmount: e.target.value })}
          className="border rounded px-3 py-2 text-sm"
        />
        <input
          type="number"
          placeholder="Max uses (blank = unlimited)"
          value={form.maxUses}
          onChange={(e) => setForm({ ...form, maxUses: e.target.value })}
          className="border rounded px-3 py-2 text-sm"
        />
        <input
          type="date"
          value={form.expiresAt}
          onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
          required
          className="border rounded px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={submitting}
          className="col-span-2 md:col-span-3 bg-brand text-white px-4 py-2 rounded text-sm font-medium hover:opacity-90 disabled:opacity-50"
        >
          {submitting ? "Creating..." : "Create Coupon"}
        </button>
      </form>
      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : (
        <div className="border rounded-lg overflow-hidden overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-gray-500">
              <tr>
                <th className="px-4 py-2">Code</th>
                <th className="px-4 py-2">Discount</th>
                <th className="px-4 py-2">Used</th>
                <th className="px-4 py-2">Expires</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {coupons.map((c) => (
                <tr key={c._id}>
                  <td className="px-4 py-3 font-mono">{c.code}</td>
                  <td className="px-4 py-3">
                    {c.discountType === "percentage" ? `${c.discountValue}%` : `Rs. ${c.discountValue}`}
                  </td>
                  <td className="px-4 py-3">
                    {c.usedCount} / {c.maxUses ?? "∞"}
                  </td>
                  <td className="px-4 py-3">{new Date(c.expiresAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => handleDelete(c._id)} className="text-red-500 hover:underline text-xs">
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function AdminCouponsPage() {
  return (
    <AdminGuard>
      <div className="flex flex-col md:flex-row">
        <AdminSidebar />
        <CouponsContent />
      </div>
    </AdminGuard>
  );
}
