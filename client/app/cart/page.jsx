"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { siteConfig } from "@/lib/siteConfig";

export default function CartPage() {
  const { cart, updateItem, removeItem } = useCart();
  const { user } = useAuth();
  const router = useRouter();

  const items = cart.items || [];
  const subtotal = items.reduce((sum, item) => {
    const price = item.product?.discountPrice || item.product?.price || 0;
    return sum + price * item.quantity;
  }, 0);

  const handleCheckout = () => {
    if (!user) {
      router.push("/login");
      return;
    }
    router.push("/checkout");
  };

  if (items.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-2">Your cart is empty</h1>
        <Link href="/products" className="text-brand-accent underline">
          Browse products
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 grid md:grid-cols-3 gap-8">
      <div className="md:col-span-2 space-y-4">
        <h1 className="text-2xl font-bold mb-4">Your Cart</h1>
        {items.map((item) => (
          <div key={item.product._id} className="flex gap-4 border-b pb-4">
            <div className="relative w-20 h-24 bg-gray-100 rounded overflow-hidden shrink-0">
              {item.product.images?.[0] && (
                <Image src={item.product.images[0]} alt={item.product.title} fill className="object-cover" />
              )}
            </div>
            <div className="flex-1">
              <h3 className="font-medium">{item.product.title}</h3>
              {item.variant?.size && (
                <p className="text-xs text-gray-500">Size: {item.variant.size}</p>
              )}
              <p className="text-brand font-semibold mt-1">
                {siteConfig.currencySymbol}
                {(item.product.discountPrice || item.product.price)?.toLocaleString()}
              </p>
              <div className="flex items-center gap-3 mt-2">
                <input
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(e) => updateItem(item.product._id, Number(e.target.value))}
                  className="w-16 border rounded px-2 py-1 text-sm"
                />
                <button
                  onClick={() => removeItem(item.product._id)}
                  className="text-sm text-red-500 hover:underline"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Order summary */}
      <div className="border rounded-lg p-5 h-fit">
        <h2 className="font-semibold mb-4">Order Summary</h2>
        <div className="flex justify-between text-sm mb-2">
          <span>Subtotal</span>
          <span>
            {siteConfig.currencySymbol}
            {subtotal.toLocaleString()}
          </span>
        </div>
        <p className="text-xs text-gray-500 mb-4">Shipping and tax calculated at checkout</p>
        <button
          onClick={handleCheckout}
          className="w-full bg-brand text-white py-3 rounded font-medium hover:opacity-90 transition"
        >
          Proceed to Checkout
        </button>
      </div>
    </div>
  );
}
