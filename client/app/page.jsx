"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import ProductCard from "@/components/product/ProductCard";
import { siteConfig } from "@/lib/siteConfig";

function FlashCountdown() {
  const [remaining, setRemaining] = useState(5 * 3600 + 42 * 60 + 10);

  useEffect(() => {
    const id = setInterval(() => {
      setRemaining((r) => (r <= 0 ? 6 * 3600 : r - 1));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const h = String(Math.floor(remaining / 3600)).padStart(2, "0");
  const m = String(Math.floor((remaining % 3600) / 60)).padStart(2, "0");
  const s = String(remaining % 60).padStart(2, "0");

  return (
    <div className="flex gap-2.5 relative z-10">
      {[
        [h, "Hours"],
        [m, "Mins"],
        [s, "Secs"],
      ].map(([val, label]) => (
        <div key={label} className="bg-white/10 border border-white/15 rounded-lg px-3.5 py-2.5 text-center min-w-[58px]">
          <div className="font-display font-bold text-xl">{val}</div>
          <div className="text-[10px] uppercase tracking-wide text-white/50">{label}</div>
        </div>
      ))}
    </div>
  );
}

export default function HomePage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getProducts("?limit=8&sort=newest")
      .then((data) => setProducts(data.products || []))
      .catch((err) => console.error(err.message))
      .finally(() => setLoading(false));
    api.getCategories().then(setCategories).catch(() => {});
  }, []);

  return (
    <div>
      {/* Category chips */}
      {categories.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 pt-4 flex gap-2 overflow-x-auto">
          {categories.map((c) => (
            <Link
              key={c._id}
              href={`/products?category=${c._id}`}
              className="px-4 py-1.5 rounded-full border border-brand/15 text-sm font-medium whitespace-nowrap hover:border-brand hover:bg-brand hover:text-white transition"
            >
              {c.name}
            </Link>
          ))}
        </div>
      )}

      {/* Hero / flash sale banner */}
      <section className="max-w-7xl mx-auto px-4 pt-6">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand to-[#23264A] text-white px-6 md:px-12 py-10 flex flex-wrap items-center gap-8">
          <div
            className="absolute -right-16 -top-16 w-56 h-56 rounded-full pointer-events-none"
            style={{ background: "radial-gradient(circle, rgba(255,106,57,.35), transparent 70%)" }}
          />
          <div className="flex-1 min-w-[240px] relative z-10">
            <span className="inline-flex items-center gap-1.5 bg-brand-accent text-white font-bold text-xs uppercase tracking-wide px-3 py-1.5 rounded-full">
              ⚡ Flash Sale
            </span>
            <h1 className="font-display font-extrabold text-3xl md:text-4xl mt-3 mb-2 leading-tight">
              {siteConfig.tagline}
            </h1>
            <p className="text-white/60 text-sm max-w-md mb-5">
              Handpicked deals from trusted sellers across every category.
            </p>
            <Link
              href="/products"
              className="inline-block bg-brand-accent text-white font-semibold px-6 py-3 rounded-lg hover:opacity-90 transition"
            >
              Start Shopping
            </Link>
          </div>
          <FlashCountdown />
        </div>
      </section>

      {/* Featured products */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <h2 className="font-display font-bold text-2xl mb-6">New Arrivals</h2>
        {loading ? (
          <p className="text-gray-500">Loading products...</p>
        ) : products.length === 0 ? (
          <p className="text-gray-500">
            No products yet. Sellers can{" "}
            <Link href="/seller/dashboard" className="text-brand-accent underline">
              add products here
            </Link>
            .
          </p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {products.map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
