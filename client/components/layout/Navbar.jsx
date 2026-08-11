"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { siteConfig } from "@/lib/siteConfig";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { itemCount } = useCart();
  const router = useRouter();
  const [search, setSearch] = useState("");

  const handleSearch = (e) => {
    e.preventDefault();
    router.push(search ? `/products?search=${encodeURIComponent(search)}` : "/products");
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-brand/10 shadow-sm">
      <div className="bg-brand text-white text-xs">
        <div className="max-w-7xl mx-auto px-4 py-1.5 flex justify-between items-center">
          <span className="opacity-80">📦 Free delivery on orders over Rs. 2,500</span>
          <span className="opacity-80 hidden sm:inline">💬 Cash on Delivery available</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-4 flex-wrap">
        <Link href="/" className="font-display font-extrabold text-2xl text-brand tracking-tight">
          {siteConfig.name}
          <span className="text-brand-accent">.</span>
        </Link>

        <form onSubmit={handleSearch} className="flex-1 min-w-[200px] max-w-xl relative order-3 md:order-none basis-full md:basis-auto">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search for products..."
            className="w-full border-2 border-brand rounded-full px-4 py-2 text-sm focus:outline-none focus:border-brand-accent"
          />
          <button
            type="submit"
            aria-label="Search"
            className="absolute right-1 top-1 bottom-1 w-9 bg-brand text-white rounded-full flex items-center justify-center"
          >
            🔍
          </button>
        </form>

        <nav className="hidden md:flex items-center gap-5 text-sm font-medium text-brand">
          {user?.role === "seller" && (
            <Link href="/seller/dashboard" className="hover:text-brand-accent transition">
              Seller Dashboard
            </Link>
          )}
          {user?.role === "admin" && (
            <Link href="/admin/dashboard" className="hover:text-brand-accent transition">
              Admin
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-4 text-sm font-medium text-brand">
          <Link href="/cart" className="relative hover:text-brand-accent transition">
            🛍️ Cart
            {itemCount > 0 && (
              <span className="absolute -top-2 -right-3 bg-brand-accent text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                {itemCount}
              </span>
            )}
          </Link>

          {user ? (
            <div className="flex items-center gap-3">
              <Link href="/account/profile" className="hover:text-brand-accent transition">
                {user.name?.split(" ")[0]}
              </Link>
              <Link href="/account/orders" className="hover:text-brand-accent transition hidden sm:inline">
                Orders
              </Link>
              <button onClick={logout} className="text-brand/50 hover:text-brand transition">
                Logout
              </button>
            </div>
          ) : (
            <Link href="/login" className="hover:text-brand-accent transition">
              Login
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
