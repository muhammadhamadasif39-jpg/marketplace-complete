"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import AdminGuard from "@/components/admin/AdminGuard";
import AdminSidebar from "@/components/admin/AdminSidebar";

const statusColors = {
  pending: "bg-yellow-100 text-yellow-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
};

function SellersContent() {
  const { token } = useAuth();
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);

  useEffect(() => {
    api
      .getAllSellersAdmin(token)
      .then(setSellers)
      .catch((err) => console.error(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  const setVerification = async (id, status) => {
    setSavingId(id);
    try {
      const updated = await api.updateSellerVerification(id, status, token);
      setSellers((prev) => prev.map((s) => (s._id === id ? updated : s)));
    } catch (err) {
      alert(err.message);
    } finally {
      setSavingId(null);
    }
  };

  const setCommission = async (id, rate) => {
    setSavingId(id);
    try {
      const updated = await api.updateSellerCommission(id, Number(rate), token);
      setSellers((prev) => prev.map((s) => (s._id === id ? updated : s)));
    } catch (err) {
      alert(err.message);
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="flex-1 px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Sellers</h1>
      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : (
        <div className="space-y-3">
          {sellers.map((s) => (
            <div key={s._id} className="border rounded-lg p-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-medium">{s.storeName}</p>
                <p className="text-xs text-gray-500">
                  {s.user?.name} — {s.user?.email}
                </p>
              </div>

              <span className={`text-xs px-2 py-1 rounded ${statusColors[s.verificationStatus]}`}>
                {s.verificationStatus}
              </span>

              <div className="flex items-center gap-2 text-sm">
                <label className="text-xs text-gray-500">Commission:</label>
                <input
                  type="number"
                  defaultValue={s.commissionRate}
                  min="0"
                  max="100"
                  onBlur={(e) => setCommission(s._id, e.target.value)}
                  className="w-16 border rounded px-2 py-1 text-sm"
                  disabled={savingId === s._id}
                />
                <span className="text-xs text-gray-400">%</span>
              </div>

              <div className="flex gap-2">
                {s.verificationStatus !== "approved" && (
                  <button
                    onClick={() => setVerification(s._id, "approved")}
                    disabled={savingId === s._id}
                    className="text-xs bg-teal-600 text-white px-3 py-1.5 rounded font-medium hover:opacity-90"
                  >
                    Approve
                  </button>
                )}
                {s.verificationStatus !== "rejected" && (
                  <button
                    onClick={() => setVerification(s._id, "rejected")}
                    disabled={savingId === s._id}
                    className="text-xs border border-red-300 text-red-600 px-3 py-1.5 rounded font-medium hover:bg-red-50"
                  >
                    Reject
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminSellersPage() {
  return (
    <AdminGuard>
      <div className="flex flex-col md:flex-row">
        <AdminSidebar />
        <SellersContent />
      </div>
    </AdminGuard>
  );
}
