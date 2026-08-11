"use client";

import Link from "next/link";
import Image from "next/image";
import { siteConfig } from "@/lib/siteConfig";

export default function ProductCard({ product }) {
  const price = product.discountPrice || product.price;
  const hasDiscount = product.discountPrice && product.discountPrice < product.price;

  const discountPct = hasDiscount ? Math.round((1 - product.discountPrice / product.price) * 100) : 0;

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group block rounded-2xl overflow-hidden border border-brand/10 bg-white hover:-translate-y-1 hover:shadow-lg transition-all duration-200"
    >
      <div className="relative aspect-square bg-[#F1EFE8]">
        {hasDiscount && (
          <span className="absolute top-2.5 left-2.5 z-10 bg-brand-accent text-white text-[11px] font-bold px-2 py-1 rounded-md">
            -{discountPct}%
          </span>
        )}
        {product.images?.[0] ? (
          <Image
            src={product.images[0]}
            alt={product.title}
            fill
            className="object-cover group-hover:scale-105 transition duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
            No image
          </div>
        )}
      </div>
      <div className="p-3.5">
        <p className="text-xs text-gray-500 truncate">{product.seller?.storeName}</p>
        <h3 className="text-sm font-medium text-brand truncate mt-0.5">{product.title}</h3>
        <div className="mt-1.5 flex items-center gap-2 flex-wrap">
          <span className="font-display font-bold text-brand">
            {siteConfig.currencySymbol}
            {price?.toLocaleString()}
          </span>
          {hasDiscount && (
            <span className="text-xs text-gray-400 line-through">
              {siteConfig.currencySymbol}
              {product.price.toLocaleString()}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
