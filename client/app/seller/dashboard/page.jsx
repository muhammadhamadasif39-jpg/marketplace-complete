"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import SellerGuard from "@/components/seller/SellerGuard";
import SellerSidebar from "@/components/seller/SellerSidebar";
import { siteConfig } from "@/lib/siteConfig";

function DashboardContent() {
  const { token } = useAuth();
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.getMyProducts(token), api.getSellerOrders(token)])
      .then(([p, o]) => {
        setProducts(p);
        setOrders(o);
      })
      .catch((err) => console.error(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  const totalRevenue = orders
    .filter((o) => o.paymentStatus === "paid")
    .reduce((sum, o) => sum + o.total, 0);
  const pendingOrders = orders.filter((o) => o.orderStatus === "placed" || o.orderStatus === "processing").length;
  const lowStock = products.filter((p) => p.stock <= 5 && p.stock > 0).length;
  const outOfStock = products.filter((p) => p.stock === 0).length;

  const stats = [
    { label: "Total Products", value: products.length },
    { label: "Pending Orders", value: pendingOrders },
    { label: "Revenue (Paid)", value: `${siteConfig.currencySymbol}${totalRevenue.toLocaleString()}` },
    { label: "Low / Out of Stock", value: `${lowStock} / ${outOfStock}` },
  ];

  return (
    <div className="flex-1 px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <Link
          href="/seller/products/new"
          className="bg-brand text-white px-4 py-2 rounded text-sm font-medium hover:opacity-90 transition"
        >
          + Add Product
        </Link>
      </div>

      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {stats.map((s) => (
              <div key={s.label} className="border rounded-lg p-4">
                <p className="text-xs text-gray-500">{s.label}</p>
                <p className="text-xl font-bold mt-1">{s.value}</p>
              </div>
            ))}
          </div>

          <h2 className="font-semibold mb-3">Recent Orders</h2>
          {orders.length === 0 ? (
            <p className="text-gray-500 text-sm">No orders yet.</p>
          ) : (
            <div className="border rounded-lg divide-y">
              {orders.slice(0, 5).map((o) => (
                <div key={o._id} className="flex justify-between items-center px-4 py-3 text-sm">
                  <span>#{o._id.slice(-8).toUpperCase()}</span>
                  <span className="text-gray-500">{o.orderStatus}</span>
                  <span className="font-medium">
                    {siteConfig.currencySymbol}
                    {o.total.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function SellerDashboardPage() {
  return (
    <SellerGuard>
      <div className="flex flex-col md:flex-row">
        <SellerSidebar />
        <DashboardContent />
      </div>
    </SellerGuard>
  );
}
