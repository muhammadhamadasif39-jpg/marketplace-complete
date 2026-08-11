"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "buyer" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await register(form.name, form.email, form.password, form.role);
      router.push("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <h1 className="text-2xl font-bold mb-6">Create an Account</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          placeholder="Full Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
          className="w-full border rounded px-3 py-2"
        />
        <input
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required
          className="w-full border rounded px-3 py-2"
        />
        <input
          type="password"
          placeholder="Password (min 6 characters)"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          required
          minLength={6}
          className="w-full border rounded px-3 py-2"
        />

        <div>
          <label className="block text-sm font-medium mb-2">I want to:</label>
          <div className="flex gap-3">
            <label className="flex items-center gap-2 border rounded px-3 py-2 flex-1 cursor-pointer">
              <input
                type="radio"
                checked={form.role === "buyer"}
                onChange={() => setForm({ ...form, role: "buyer" })}
              />
              Shop as a Buyer
            </label>
            <label className="flex items-center gap-2 border rounded px-3 py-2 flex-1 cursor-pointer">
              <input
                type="radio"
                checked={form.role === "seller"}
                onChange={() => setForm({ ...form, role: "seller" })}
              />
              Sell as a Seller
            </label>
          </div>
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-brand text-white py-3 rounded font-medium hover:opacity-90 transition disabled:opacity-50"
        >
          {submitting ? "Creating account..." : "Create Account"}
        </button>
      </form>
      <p className="text-sm text-gray-500 mt-4">
        Already have an account?{" "}
        <Link href="/login" className="text-brand-accent underline">
          Login
        </Link>
      </p>
    </div>
  );
}
