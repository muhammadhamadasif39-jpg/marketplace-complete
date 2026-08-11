"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import SellerSidebar from "@/components/seller/SellerSidebar";

export default function StoreSettingsPage() {
  const { user, token, loading: authLoading } = useAuth();
  const router = useRouter();
  const [store, setStore] = useState(null);
  const [form, setForm] = useState({ storeName: "", description: "", storeLogo: "", storeBanner: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/login");
      return;
    }

    api
      .getMyStore(token)
      .then((data) => {
        setStore(data);
        setForm({
          storeName: data.storeName || "",
          description: data.description || "",
          storeLogo: data.storeLogo || "",
          storeBanner: data.storeBanner || "",
        });
      })
      .catch(() => setStore(null))
      .finally(() => setLoading(false));
  }, [user, authLoading, token, router]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const data = await api.registerStore(form, token);
      setStore(data);
      setMessage("Store created! You can now add products.");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setSaving(true);
    try {
      const data = await api.updateMyStore(
        { description: form.description, storeLogo: form.storeLogo, storeBanner: form.storeBanner },
        token
      );
      setStore(data);
      setMessage("Store settings saved ✅");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return <p className="max-w-5xl mx-auto px-4 py-16 text-gray-500">Loading...</p>;
  }

  // No store yet -> show create form (no sidebar, since seller nav requires a store)
  if (!store) {
    return (
      <div className="max-w-md mx-auto px-4 py-16">
        <h1 className="text-2xl font-bold mb-2">Create Your Store</h1>
        <p className="text-gray-500 mb-6">This becomes your public storefront name.</p>
        <form onSubmit={handleCreate} className="space-y-4">
          <input
            placeholder="Store Name (e.g. Hamad Fashion Store)"
            value={form.storeName}
            onChange={(e) => setForm({ ...form, storeName: e.target.value })}
            required
            className="w-full border rounded px-3 py-2"
          />
          <textarea
            placeholder="Store description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={3}
            className="w-full border rounded px-3 py-2"
          />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={saving}
            className="w-full bg-brand text-white py-3 rounded font-medium hover:opacity-90 transition disabled:opacity-50"
          >
            {saving ? "Creating..." : "Create Store"}
          </button>
        </form>
      </div>
    );
  }

  // Store exists -> show settings form with sidebar
  return (
    <div className="flex flex-col md:flex-row">
      <SellerSidebar />
      <div className="flex-1 px-4 py-8 max-w-2xl">
        <h1 className="text-2xl font-bold mb-6">Store Settings</h1>
        <form onSubmit={handleUpdate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Store Name</label>
            <input
              value={form.storeName}
              onChange={(e) => setForm({ ...form, storeName: e.target.value })}
              className="w-full border rounded px-3 py-2"
              disabled
            />
            <p className="text-xs text-gray-400 mt-1">
              Store name can&apos;t be changed here yet (affects your store URL).
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              className="w-full border rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Store Logo URL</label>
            <input
              value={form.storeLogo}
              onChange={(e) => setForm({ ...form, storeLogo: e.target.value })}
              placeholder="https://..."
              className="w-full border rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Store Banner URL</label>
            <input
              value={form.storeBanner}
              onChange={(e) => setForm({ ...form, storeBanner: e.target.value })}
              placeholder="https://..."
              className="w-full border rounded px-3 py-2"
            />
          </div>
          {message && <p className="text-green-600 text-sm">{message}</p>}
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={saving}
            className="bg-brand text-white px-6 py-2 rounded font-medium hover:opacity-90 transition disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
          <p className="text-xs text-gray-400">
            Note: image upload (Cloudinary) is not wired up yet — paste an image URL for now.
          </p>
        </form>
      </div>
    </div>
  );
}
