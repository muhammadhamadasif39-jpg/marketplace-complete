"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import AdminGuard from "@/components/admin/AdminGuard";
import AdminSidebar from "@/components/admin/AdminSidebar";

function BannersContent() {
  const { token } = useAuth();
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ title: "", imageUrl: "", linkUrl: "/products", displayOrder: "" });

  const fetchBanners = () => {
    api
      .getAllBanners(token)
      .then(setBanners)
      .catch((err) => console.error(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(fetchBanners, [token]);

  const handleAdd = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await api.createBanner({ ...form, displayOrder: form.displayOrder ? Number(form.displayOrder) : 0 }, token);
      setForm({ title: "", imageUrl: "", linkUrl: "/products", displayOrder: "" });
      fetchBanners();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleActive = async (id, current) => {
    try {
      const updated = await api.updateBanner(id, { isActive: !current }, token);
      setBanners((prev) => prev.map((b) => (b._id === id ? updated : b)));
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this banner?")) return;
    try {
      await api.deleteBanner(id, token);
      setBanners((prev) => prev.filter((b) => b._id !== id));
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="flex-1 px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Banners</h1>

      <form onSubmit={handleAdd} className="grid grid-cols-2 gap-3 mb-6 max-w-xl">
        <input
          placeholder="Title"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          required
          className="col-span-2 border rounded px-3 py-2 text-sm"
        />
        <input
          placeholder="Image URL"
          value={form.imageUrl}
          onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
          required
          className="col-span-2 border rounded px-3 py-2 text-sm"
        />
        <input
          placeholder="Link URL (e.g. /products)"
          value={form.linkUrl}
          onChange={(e) => setForm({ ...form, linkUrl: e.target.value })}
          className="border rounded px-3 py-2 text-sm"
        />
        <input
          type="number"
          placeholder="Display order"
          value={form.displayOrder}
          onChange={(e) => setForm({ ...form, displayOrder: e.target.value })}
          className="border rounded px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={submitting}
          className="col-span-2 bg-brand text-white px-4 py-2 rounded text-sm font-medium hover:opacity-90 disabled:opacity-50"
        >
          {submitting ? "Adding..." : "Add Banner"}
        </button>
      </form>
      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : (
        <div className="space-y-2 max-w-xl">
          {banners.map((b) => (
            <div key={b._id} className="border rounded-lg p-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium">{b.title}</p>
                <p className="text-xs text-gray-400">{b.linkUrl}</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => toggleActive(b._id, b.isActive)}
                  className={`text-xs px-2 py-1 rounded ${
                    b.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {b.isActive ? "Active" : "Inactive"}
                </button>
                <button onClick={() => handleDelete(b._id)} className="text-red-500 hover:underline text-xs">
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminBannersPage() {
  return (
    <AdminGuard>
      <div className="flex flex-col md:flex-row">
        <AdminSidebar />
        <BannersContent />
      </div>
    </AdminGuard>
  );
}
