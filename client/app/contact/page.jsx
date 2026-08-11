"use client";

import { useState } from "react";
import { siteConfig } from "@/lib/siteConfig";

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Note: no backend endpoint wired up yet — this just confirms the form works.
    // Wire this to a real /api/contact endpoint (or an email service) when ready.
    console.log("Contact form submitted:", form);
    setSubmitted(true);
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold mb-2">Contact Us</h1>
      <p className="text-gray-500 mb-6 text-sm">
        Questions about an order, a store, or {siteConfig.name} in general? Send us a message.
      </p>

      {submitted ? (
        <p className="text-green-600 text-sm bg-green-50 rounded px-4 py-3">
          Thanks for reaching out! This is a demo form — connect it to a real backend endpoint
          when you&apos;re ready to receive messages.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            placeholder="Your Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
            className="w-full border rounded px-3 py-2"
          />
          <input
            type="email"
            placeholder="Your Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
            className="w-full border rounded px-3 py-2"
          />
          <textarea
            placeholder="Message"
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
            required
            rows={5}
            className="w-full border rounded px-3 py-2"
          />
          <button
            type="submit"
            className="bg-brand text-white px-6 py-2 rounded font-medium hover:opacity-90 transition"
          >
            Send Message
          </button>
        </form>
      )}
    </div>
  );
}
