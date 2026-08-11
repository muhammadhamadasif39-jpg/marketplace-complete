"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/context/ToastContext";
import { siteConfig } from "@/lib/siteConfig";

// Builds and submits a hidden HTML form to a payment gateway's hosted checkout page.
// JazzCash and Easypaisa both work by POSTing signed fields directly to their own page -
// there's no JSON API redirect for these, the browser has to literally submit a form there.
function submitHiddenForm(url, fields) {
  const form = document.createElement("form");
  form.method = "POST";
  form.action = url;

  Object.entries(fields).forEach(([key, value]) => {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = key;
    input.value = value;
    form.appendChild(input);
  });

  document.body.appendChild(form);
  form.submit();
}

function CheckoutContent() {
  const { token } = useAuth();
  const { cart, refreshCart } = useCart();
  const { showToast } = useToast();
  const router = useRouter();
  const params = useSearchParams();
  const isBuyNow = params.get("mode") === "buynow";

  // Buy Now reads a single item stashed in sessionStorage by the product page -
  // it never touches the persisted cart.
  const [buyNowItem, setBuyNowItem] = useState(null);
  const [checkingBuyNow, setCheckingBuyNow] = useState(isBuyNow);

  useEffect(() => {
    if (!isBuyNow) {
      setCheckingBuyNow(false);
      return;
    }
    const saved = sessionStorage.getItem("buyNowItem");
    if (saved) setBuyNowItem(JSON.parse(saved));
    setCheckingBuyNow(false);
  }, [isBuyNow]);

  const [form, setForm] = useState({
    fullName: "",
    street: "",
    city: "",
    country: "Pakistan",
    postalCode: "",
    phone: "",
  });
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const payload = { shippingAddress: form, paymentMethod };
      if (isBuyNow && buyNowItem) {
        payload.buyNowItem = { productId: buyNowItem.productId, quantity: buyNowItem.quantity };
      }

      const order = await api.createOrder(payload, token);

      if (isBuyNow) {
        sessionStorage.removeItem("buyNowItem");
      } else {
        await refreshCart();
      }

      // COD orders are done immediately. Online methods redirect to the gateway -
      // the order already exists in the database as "pending" and gets marked "paid"
      // once the gateway confirms (via callback/webhook), not by this redirect alone.
      if (paymentMethod === "cod") {
        showToast("Order placed successfully! 🎉", "success");
        router.push(`/account/orders?placed=${order._id}`);
      } else if (paymentMethod === "jazzcash") {
        const { url, fields } = await api.initiateJazzCash(order._id, token);
        submitHiddenForm(url, fields);
      } else if (paymentMethod === "easypaisa") {
        const { url, fields } = await api.initiateEasypaisa(order._id, token);
        submitHiddenForm(url, fields);
      } else if (paymentMethod === "stripe") {
        const { url } = await api.createStripeSession(order._id, token);
        window.location.href = url;
      }
    } catch (err) {
      setError(err.message);
      showToast(err.message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (checkingBuyNow) {
    return <p className="max-w-2xl mx-auto px-4 py-16 text-gray-500">Loading...</p>;
  }

  if (isBuyNow && !buyNowItem) {
    return (
      <p className="max-w-2xl mx-auto px-4 py-16 text-center text-gray-500">
        No item selected for Buy Now. Go back to the product and try again.
      </p>
    );
  }

  if (!isBuyNow && (!cart.items || cart.items.length === 0)) {
    return <p className="max-w-2xl mx-auto px-4 py-16 text-center text-gray-500">Your cart is empty.</p>;
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-2">Checkout</h1>

      {/* Order summary - single item for Buy Now, full cart otherwise */}
      <div className="border rounded-lg p-4 mb-6 text-sm">
        {isBuyNow ? (
          <div className="flex justify-between">
            <span>
              {buyNowItem.title} × {buyNowItem.quantity}
            </span>
            <span className="font-medium">
              {siteConfig.currencySymbol}
              {(buyNowItem.price * buyNowItem.quantity).toLocaleString()}
            </span>
          </div>
        ) : (
          <div className="space-y-1">
            {cart.items.map((item) => (
              <div key={item.product._id} className="flex justify-between">
                <span>
                  {item.product.title} × {item.quantity}
                </span>
                <span>
                  {siteConfig.currencySymbol}
                  {((item.product.discountPrice || item.product.price) * item.quantity).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          name="fullName"
          placeholder="Full Name"
          value={form.fullName}
          onChange={handleChange}
          required
          className="w-full border rounded px-3 py-2"
        />
        <input
          name="street"
          placeholder="Street Address"
          value={form.street}
          onChange={handleChange}
          required
          className="w-full border rounded px-3 py-2"
        />
        <div className="grid grid-cols-2 gap-3">
          <input
            name="city"
            placeholder="City"
            value={form.city}
            onChange={handleChange}
            required
            className="border rounded px-3 py-2"
          />
          <input
            name="postalCode"
            placeholder="Postal Code"
            value={form.postalCode}
            onChange={handleChange}
            className="border rounded px-3 py-2"
          />
        </div>
        <input
          name="phone"
          placeholder="Phone Number"
          value={form.phone}
          onChange={handleChange}
          required
          className="w-full border rounded px-3 py-2"
        />

        <div>
          <label className="block text-sm font-medium mb-2">Payment Method</label>
          <div className="space-y-2">
            {[
              { value: "cod", label: "Cash on Delivery" },
              { value: "jazzcash", label: "JazzCash" },
              { value: "easypaisa", label: "Easypaisa" },
              { value: "stripe", label: "Credit/Debit Card (needs Stripe account set up)" },
            ].map((opt) => (
              <label
                key={opt.value}
                className="flex items-center gap-3 border rounded px-3 py-2 cursor-pointer"
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value={opt.value}
                  checked={paymentMethod === opt.value}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                />
                {opt.label}
              </label>
            ))}
          </div>
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-brand text-white py-3 rounded font-medium hover:opacity-90 transition disabled:opacity-50"
        >
          {submitting ? "Placing Order..." : "Place Order"}
        </button>
        <p className="text-xs text-gray-400 text-center">
          Your order is placed directly on {siteConfig.name} — no WhatsApp or third-party app needed.
        </p>
      </form>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<p className="max-w-2xl mx-auto px-4 py-16 text-gray-500">Loading...</p>}>
      <CheckoutContent />
    </Suspense>
  );
}
