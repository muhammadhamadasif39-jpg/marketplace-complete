"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";

// Wraps any seller page: redirects non-sellers, and prompts store creation if missing.
export default function SellerGuard({ children }) {
  const { user, token, loading: authLoading } = useAuth();
  const router = useRouter();
  const [store, setStore] = useState(null);
  const [checkingStore, setCheckingStore] = useState(true);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push("/login");
      return;
    }
    if (user.role !== "seller" && user.role !== "admin") {
      router.push("/");
      return;
    }

    api
      .getMyStore(token)
      .then(setStore)
      .catch(() => setStore(null))
      .finally(() => setCheckingStore(false));
  }, [user, authLoading, token, router]);

  if (authLoading || checkingStore) {
    return <p className="max-w-5xl mx-auto px-4 py-16 text-gray-500">Loading...</p>;
  }

  if (!store) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <h1 className="text-xl font-bold mb-2">Set up your store first</h1>
        <p className="text-gray-500 mb-6">
          You need to create a store before you can start selling.
        </p>
        <Link
          href="/seller/store"
          className="inline-block bg-brand text-white px-6 py-3 rounded font-medium hover:opacity-90 transition"
        >
          Create Store
        </Link>
      </div>
    );
  }

  return children;
}
