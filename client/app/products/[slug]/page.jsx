"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, notFound } from "next/navigation";
import Image from "next/image";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/context/ToastContext";
import { siteConfig } from "@/lib/siteConfig";
import ReviewsSection from "@/components/product/ReviewsSection";
import StarRating from "@/components/ui/StarRating";

export default function ProductDetailPage() {
  const { slug } = useParams();
  const router = useRouter();
  const { token, user } = useAuth();
  const { addItem } = useCart();
  const { showToast } = useToast();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [message, setMessage] = useState("");
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    api
      .getProduct(slug)
      .then(setProduct)
      .catch((err) => {
        if (err.status === 404) {
          setLoadError("not-found"); // trigger real 404 after render, not mid-fetch
        } else {
          console.error(err.message);
          setLoadError(err.message);
        }
      })
      .finally(() => setLoading(false));
  }, [slug]);

  // Rendering notFound() during the fetch's .then/.catch would throw outside React's
  // render cycle, so we flag it in state and call it here, in the component body.
  if (loadError === "not-found") {
    notFound();
  }

  const handleAddToCart = async () => {
    if (!user) {
      router.push("/login");
      return;
    }
    try {
      await addItem(product._id, quantity);
      setMessage("Added to cart ✅");
      showToast("Added to cart 🛍️", "success");
      setTimeout(() => setMessage(""), 2000);
    } catch (err) {
      setMessage(err.message);
      showToast(err.message, "error");
    }
  };

  const handleBuyNow = () => {
    if (!user) {
      router.push("/login");
      return;
    }
    // Stash just this one item for checkout - doesn't touch the cart at all.
    // The checkout page reads this and, if present, orders only this item.
    sessionStorage.setItem(
      "buyNowItem",
      JSON.stringify({
        productId: product._id,
        quantity,
        title: product.title,
        price: product.discountPrice || product.price,
        image: product.images?.[0],
      })
    );
    router.push("/checkout?mode=buynow");
  };

  const handleAddToWishlist = async () => {
    if (!user) {
      router.push("/login");
      return;
    }
    try {
      await api.addToWishlist(product._id, token);
      setMessage("Added to wishlist ❤️");
      setTimeout(() => setMessage(""), 2000);
    } catch (err) {
      setMessage(err.message);
    }
  };

  if (loading) return <p className="max-w-7xl mx-auto px-4 py-12 text-gray-500">Loading...</p>;
  if (!product) return <p className="max-w-7xl mx-auto px-4 py-12 text-gray-500">{loadError || "Something went wrong loading this product."}</p>;

  const price = product.discountPrice || product.price;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 grid md:grid-cols-2 gap-10">
      {/* Images */}
      <div>
        <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden mb-3">
          {product.images?.[activeImage] ? (
            <Image src={product.images[activeImage]} alt={product.title} fill className="object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">No image</div>
          )}
        </div>
        {product.images?.length > 1 && (
          <div className="flex gap-2">
            {product.images.map((img, i) => (
              <button
                key={i}
                onClick={() => setActiveImage(i)}
                className={`relative w-16 h-16 rounded overflow-hidden border-2 ${
                  i === activeImage ? "border-brand-accent" : "border-transparent"
                }`}
              >
                <Image src={img} alt="" fill className="object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Details */}
      <div>
        <p className="text-sm text-gray-500">{product.seller?.storeName}</p>
        <h1 className="text-2xl font-bold mt-1">{product.title}</h1>
        {product.rating?.count > 0 && (
          <div className="flex items-center gap-1.5 mt-1.5">
            <StarRating value={Math.round(product.rating.average)} readOnly size="text-sm" />
            <span className="text-xs text-gray-500">
              {product.rating.average.toFixed(1)} ({product.rating.count})
            </span>
          </div>
        )}
        <div className="mt-3 flex items-center gap-3">
          <span className="text-2xl font-bold text-brand">
            {siteConfig.currencySymbol}
            {price?.toLocaleString()}
          </span>
          {product.discountPrice && (
            <span className="text-gray-400 line-through">
              {siteConfig.currencySymbol}
              {product.price.toLocaleString()}
            </span>
          )}
        </div>

        <p className="mt-6 text-gray-700 leading-relaxed">{product.description}</p>

        <p className="mt-4 text-sm text-gray-500">
          {product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}
        </p>

        <div className="mt-6 flex items-center gap-3 flex-wrap">
          <input
            type="number"
            min="1"
            max={product.stock}
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
            className="w-20 border rounded px-3 py-2"
          />
          <button
            onClick={handleBuyNow}
            disabled={product.stock === 0}
            className="bg-brand-accent text-brand px-6 py-2 rounded font-semibold hover:opacity-90 transition disabled:opacity-40"
          >
            Buy Now
          </button>
          <button
            onClick={handleAddToCart}
            disabled={product.stock === 0}
            className="bg-brand text-white px-6 py-2 rounded font-medium hover:opacity-90 transition disabled:opacity-40"
          >
            Add to Cart
          </button>
          <button
            onClick={handleAddToWishlist}
            className="border border-brand px-4 py-2 rounded font-medium hover:bg-gray-50 transition"
          >
            ♡ Wishlist
          </button>
        </div>

        {message && <p className="mt-3 text-sm text-green-600">{message}</p>}
      </div>

      <div className="md:col-span-2">
        <ReviewsSection
          productId={product._id}
          initialReviews={product.reviews || []}
          initialRating={product.rating}
        />
      </div>
    </div>
  );
}
