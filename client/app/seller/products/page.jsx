"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import SellerGuard from "@/components/seller/SellerGuard";
import SellerSidebar from "@/components/seller/SellerSidebar";
import { siteConfig } from "@/lib/siteConfig";

function ProductsContent() {
  const { token } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchProducts = () => {
    setLoading(true);
    api
      .getMyProducts(token)
      .then(setProducts)
      .catch((err) => console.error(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(fetchProducts, [token]);

  const handleDelete = async (id, title) => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    try {
      await api.deleteProduct(id, token);
      setProducts((prev) => prev.filter((p) => p._id !== id));
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="flex-1 px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Products</h1>
        <Link
          href="/seller/products/new"
          className="bg-brand text-white px-4 py-2 rounded text-sm font-medium hover:opacity-90 transition"
        >
          + Add Product
        </Link>
      </div>

      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : products.length === 0 ? (
        <p className="text-gray-500">No products yet. Add your first one!</p>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-gray-500">
              <tr>
                <th className="px-4 py-2">Title</th>
                <th className="px-4 py-2">Price</th>
                <th className="px-4 py-2">Stock</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {products.map((p) => (
                <tr key={p._id}>
                  <td className="px-4 py-3">{p.title}</td>
                  <td className="px-4 py-3">
                    {siteConfig.currencySymbol}
                    {p.price.toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <span className={p.stock === 0 ? "text-red-500" : p.stock <= 5 ? "text-yellow-600" : ""}>
                      {p.stock}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        p.isPublished ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {p.isPublished ? "Published" : "Draft"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right space-x-3">
                    <Link href={`/seller/products/${p._id}/edit`} className="text-brand-accent hover:underline">
                      Edit
                    </Link>
                    <button onClick={() => handleDelete(p._id, p.title)} className="text-red-500 hover:underline">
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

export default function SellerProductsPage() {
  return (
    <SellerGuard>
      <div className="flex flex-col md:flex-row">
        <SellerSidebar />
        <ProductsContent />
      </div>
    </SellerGuard>
  );
}
