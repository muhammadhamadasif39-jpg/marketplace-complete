"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { siteConfig } from "@/lib/siteConfig";

const statusColors = {
  placed: "bg-gray-100 text-gray-700",
  processing: "bg-yellow-100 text-yellow-700",
  shipped: "bg-blue-100 text-blue-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

function OrdersContent() {
  const { token, user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const params = useSearchParams();
  const justPlaced = params.get("placed");

  useEffect(() => {
    if (!token) return;
    api
      .getMyOrders(token)
      .then(setOrders)
      .catch((err) => console.error(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  if (authLoading) return null;
  if (!user) return <p className="max-w-3xl mx-auto px-4 py-16 text-center text-gray-500">Please log in to view your orders.</p>;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-2">My Orders</h1>
      {justPlaced && (
        <p className="bg-green-50 text-green-700 text-sm rounded px-4 py-3 mb-6">
          🎉 Order placed successfully!
        </p>
      )}

      {loading ? (
        <p className="text-gray-500">Loading orders...</p>
      ) : orders.length === 0 ? (
        <p className="text-gray-500">No orders yet.</p>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order._id} className="border rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="text-sm text-gray-500">Order #{order._id.slice(-8).toUpperCase()}</p>
                  <p className="text-xs text-gray-400">{new Date(order.createdAt).toLocaleDateString()}</p>
                </div>
                <span className={`text-xs font-medium px-2 py-1 rounded ${statusColors[order.orderStatus]}`}>
                  {order.orderStatus}
                </span>
              </div>
              <div className="text-sm text-gray-700 space-y-1">
                {order.items.map((item, i) => (
                  <p key={i}>
                    {item.title} × {item.quantity}
                  </p>
                ))}
              </div>
              <div className="mt-2 flex justify-between text-sm font-medium border-t pt-2">
                <span>Total</span>
                <span>
                  {siteConfig.currencySymbol}
                  {order.total.toLocaleString()}
                </span>
              </div>
              {order.trackingNumber && (
                <p className="text-xs text-gray-500 mt-1">Tracking: {order.trackingNumber}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function OrdersPage() {
  return (
    <Suspense fallback={<p className="max-w-3xl mx-auto px-4 py-16 text-gray-500">Loading...</p>}>
      <OrdersContent />
    </Suspense>
  );
}
