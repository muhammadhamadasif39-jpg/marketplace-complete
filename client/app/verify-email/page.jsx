"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/api";

function VerifyEmailContent() {
  const params = useSearchParams();
  const token = params.get("token");
  const [status, setStatus] = useState("verifying"); // verifying | success | error
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("No verification token found in the link.");
      return;
    }

    api
      .verifyEmail(token)
      .then(() => setStatus("success"))
      .catch((err) => {
        setStatus("error");
        setMessage(err.message);
      });
  }, [token]);

  return (
    <div className="max-w-md mx-auto px-4 py-20 text-center">
      {status === "verifying" && <p className="text-gray-500">Verifying your email...</p>}

      {status === "success" && (
        <>
          <h1 className="text-2xl font-bold mb-2">Email Verified ✅</h1>
          <p className="text-gray-500 mb-6">Your email has been verified successfully.</p>
          <Link href="/login" className="text-brand-accent underline">
            Go to Login
          </Link>
        </>
      )}

      {status === "error" && (
        <>
          <h1 className="text-2xl font-bold mb-2">Verification Failed</h1>
          <p className="text-gray-500 mb-6">{message}</p>
          <Link href="/login" className="text-brand-accent underline">
            Back to Login
          </Link>
        </>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<p className="max-w-md mx-auto px-4 py-20 text-center text-gray-500">Loading...</p>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
