"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import AdminGuard from "@/components/admin/AdminGuard";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { siteConfig } from "@/lib/siteConfig";

function ProductsContent() {
  const { token } = useAuth();
  const [products, setProducts] = useState([]);
  const [filter, setFilter] = useState("pending");
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);

  const fetchProducts = () => {
    setLoading(true);
    api
      .getAllProductsAdmin(filter === "all" ? "" : filter, token)
      .then(setProducts)
      .catch((err) => console.error(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(fetchProducts, [filter, token]);

  const setApproval = async (id, isApproved) => {
    setSavingId(id);
    try {
      await api.updateProductApproval(id, isApproved, token);
      setProducts((prev) => prev.filter((p) => p._id !== id)); // leaves the current filtered view once actioned
    } catch (err) {
      alert(err.message);
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="flex-1 px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Products</h1>
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="border rounded px-3 py-1.5 text-sm">
          <option value="pending">Pending Approval</option>
          <option value="approved">Approved</option>
          <option value="all">All Products</option>
        </select>
      </div>

      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : products.length === 0 ? (
        <p className="text-gray-500">Nothing here.</p>
      ) : (
        <div className="border rounded-lg overflow-hidden overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-gray-500">
              <tr>
                <th className="px-4 py-2">Title</th>
                <th className="px-4 py-2">Seller</th>
                <th className="px-4 py-2">Price</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {products.map((p) => (
                <tr key={p._id}>
                  <td className="px-4 py-3">{p.title}</td>
                  <td className="px-4 py-3">{p.seller?.storeName}</td>
                  <td className="px-4 py-3">
                    {siteConfig.currencySymbol}
                    {p.price.toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        p.isApproved ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {p.isApproved ? "Approved" : "Pending"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right space-x-3">
                    {!p.isApproved && (
                      <button
                        onClick={() => setApproval(p._id, true)}
                        disabled={savingId === p._id}
                        className="text-teal-700 hover:underline text-xs font-medium"
                      >
                        Approve
                      </button>
                    )}
                    {p.isApproved && (
                      <button
                        onClick={() => setApproval(p._id, false)}
                        disabled={savingId === p._id}
                        className="text-red-600 hover:underline text-xs font-medium"
                      >
                        Unapprove
                      </button>
                    )}
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

export default function AdminProductsPage() {
  return (
    <AdminGuard>
      <div className="flex flex-col md:flex-row">
        <AdminSidebar />
        <ProductsContent />
      </div>
    </AdminGuard>
  );
}
