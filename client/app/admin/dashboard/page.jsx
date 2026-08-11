"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import AdminGuard from "@/components/admin/AdminGuard";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { siteConfig } from "@/lib/siteConfig";

function DashboardContent() {
  const { token } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getAdminStats(token)
      .then(setStats)
      .catch((err) => console.error(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return <div className="flex-1 px-4 py-8 text-gray-500">Loading...</div>;

  const cards = [
    { label: "Total Buyers", value: stats?.totalUsers ?? 0 },
    { label: "Total Sellers", value: stats?.totalSellers ?? 0 },
    { label: "Pending Seller Approvals", value: stats?.pendingSellers ?? 0, highlight: stats?.pendingSellers > 0 },
    { label: "Total Products", value: stats?.totalProducts ?? 0 },
    { label: "Total Orders", value: stats?.totalOrders ?? 0 },
    { label: "Total Revenue (Paid)", value: `${siteConfig.currencySymbol}${(stats?.totalRevenue ?? 0).toLocaleString()}` },
  ];

  return (
    <div className="flex-1 px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Admin Overview</h1>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {cards.map((c) => (
          <div
            key={c.label}
            className={`border rounded-lg p-4 ${c.highlight ? "border-brand-accent bg-orange-50" : ""}`}
          >
            <p className="text-xs text-gray-500">{c.label}</p>
            <p className="text-xl font-bold mt-1">{c.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  return (
    <AdminGuard>
      <div className="flex flex-col md:flex-row">
        <AdminSidebar />
        <DashboardContent />
      </div>
    </AdminGuard>
  );
}
