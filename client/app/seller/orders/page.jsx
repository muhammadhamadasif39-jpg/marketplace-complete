"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import SellerGuard from "@/components/seller/SellerGuard";
import SellerSidebar from "@/components/seller/SellerSidebar";
import { siteConfig } from "@/lib/siteConfig";

const statusOptions = ["placed", "processing", "shipped", "delivered", "cancelled"];

function OrdersContent() {
  const { token } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);

  const fetchOrders = () => {
    setLoading(true);
    api
      .getSellerOrders(token)
      .then(setOrders)
      .catch((err) => console.error(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(fetchOrders, [token]);

  const handleStatusChange = async (orderId, orderStatus) => {
    setSavingId(orderId);
    try {
      const updated = await api.updateOrderStatus(orderId, { orderStatus }, token);
      setOrders((prev) => prev.map((o) => (o._id === orderId ? updated : o)));
    } catch (err) {
      alert(err.message);
    } finally {
      setSavingId(null);
    }
  };

  const handleTracking = async (orderId, trackingNumber) => {
    if (!trackingNumber) return;
    setSavingId(orderId);
    try {
      const updated = await api.updateOrderStatus(orderId, { trackingNumber }, token);
      setOrders((prev) => prev.map((o) => (o._id === orderId ? updated : o)));
    } catch (err) {
      alert(err.message);
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="flex-1 px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Orders</h1>

      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : orders.length === 0 ? (
        <p className="text-gray-500">No orders yet.</p>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order._id} className="border rounded-lg p-4">
              <div className="flex flex-wrap justify-between items-start gap-2 mb-3">
                <div>
                  <p className="font-medium">Order #{order._id.slice(-8).toUpperCase()}</p>
                  <p className="text-xs text-gray-400">{new Date(order.createdAt).toLocaleDateString()}</p>
                </div>
                <p className="font-semibold">
                  {siteConfig.currencySymbol}
                  {order.total.toLocaleString()}
                </p>
              </div>

              <div className="text-sm text-gray-700 mb-3">
                {order.items.map((item, i) => (
                  <p key={i}>
                    {item.title} × {item.quantity}
                  </p>
                ))}
              </div>

              <p className="text-xs text-gray-500 mb-3">
                Ship to: {order.shippingAddress.fullName}, {order.shippingAddress.street},{" "}
                {order.shippingAddress.city} — {order.shippingAddress.phone}
              </p>

              <div className="flex flex-wrap items-center gap-3">
                <select
                  value={order.orderStatus}
                  onChange={(e) => handleStatusChange(order._id, e.target.value)}
                  disabled={savingId === order._id}
                  className="border rounded px-3 py-1.5 text-sm"
                >
                  {statusOptions.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>

                <input
                  type="text"
                  placeholder="Tracking number"
                  defaultValue={order.trackingNumber}
                  onBlur={(e) => handleTracking(order._id, e.target.value)}
                  className="border rounded px-3 py-1.5 text-sm"
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function SellerOrdersPage() {
  return (
    <SellerGuard>
      <div className="flex flex-col md:flex-row">
        <SellerSidebar />
        <OrdersContent />
      </div>
    </SellerGuard>
  );
}
