"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

export default function VerifyPhonePage() {
  const { token, user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [step, setStep] = useState("phone"); // "phone" | "otp"
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [authLoading, user, router]);

  if (authLoading || !user) {
    return <p className="max-w-sm mx-auto px-4 py-20 text-gray-500">Loading...</p>;
  }

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await api.sendOtp(phone, token);
      setMessage("A 6-digit code has been sent to your phone.");
      setStep("otp");
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await api.verifyOtp(otp, token);
      setMessage("Phone number verified ✅");
      setTimeout(() => router.push("/"), 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-sm mx-auto px-4 py-20">
      <h1 className="text-2xl font-bold mb-2">Verify Your Phone</h1>
      <p className="text-gray-500 text-sm mb-6">
        {step === "phone"
          ? "We'll text you a 6-digit code to confirm your number."
          : `Enter the code sent to ${phone}.`}
      </p>

      {step === "phone" ? (
        <form onSubmit={handleSendOtp} className="space-y-4">
          <input
            type="tel"
            placeholder="+923001234567"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
            className="w-full border rounded px-3 py-2"
          />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-brand text-white py-3 rounded font-medium hover:opacity-90 transition disabled:opacity-50"
          >
            {submitting ? "Sending..." : "Send Code"}
          </button>
        </form>
      ) : (
        <form onSubmit={handleVerifyOtp} className="space-y-4">
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            placeholder="123456"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
            required
            className="w-full border rounded px-3 py-2 text-center text-lg tracking-widest"
          />
          {message && <p className="text-green-600 text-sm">{message}</p>}
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-brand text-white py-3 rounded font-medium hover:opacity-90 transition disabled:opacity-50"
          >
            {submitting ? "Verifying..." : "Verify"}
          </button>
          <button
            type="button"
            onClick={() => setStep("phone")}
            className="w-full text-sm text-gray-500 hover:underline"
          >
            Use a different number
          </button>
        </form>
      )}
    </div>
  );
}
