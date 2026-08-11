"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import AdminGuard from "@/components/admin/AdminGuard";
import AdminSidebar from "@/components/admin/AdminSidebar";

function CategoriesContent() {
  const { token } = useAuth();
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchCategories = () => {
    api
      .getCategories()
      .then(setCategories)
      .catch((err) => console.error(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(fetchCategories, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await api.createCategory({ name }, token);
      setName("");
      fetchCategories();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex-1 px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Categories</h1>

      <form onSubmit={handleAdd} className="flex gap-2 mb-6 max-w-md">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="New category name"
          required
          className="flex-1 border rounded px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={submitting}
          className="bg-brand text-white px-4 py-2 rounded text-sm font-medium hover:opacity-90 disabled:opacity-50"
        >
          Add
        </button>
      </form>
      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : (
        <div className="border rounded-lg divide-y max-w-md">
          {categories.map((c) => (
            <div key={c._id} className="px-4 py-3 text-sm">
              {c.name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminCategoriesPage() {
  return (
    <AdminGuard>
      <div className="flex flex-col md:flex-row">
        <AdminSidebar />
        <CategoriesContent />
      </div>
    </AdminGuard>
  );
}
