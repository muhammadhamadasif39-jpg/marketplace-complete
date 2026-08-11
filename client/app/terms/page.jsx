import { siteConfig } from "@/lib/siteConfig";

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold mb-4">Terms of Service</h1>
      <p className="text-gray-500 text-sm mb-6">Placeholder terms — replace with your real terms before going live.</p>

      <div className="space-y-4 text-gray-600 leading-relaxed text-sm">
        <p>
          By using {siteConfig.name}, you agree to purchase products in good faith and provide
          accurate shipping and payment information.
        </p>
        <p>
          Sellers are responsible for the accuracy of their product listings, fulfilling orders in
          a timely manner, and complying with all applicable consumer protection laws.
        </p>
        <p>
          {siteConfig.name} acts as a marketplace connecting buyers and sellers. Disputes about
          product quality or delivery should first be raised with the relevant seller through the
          order page.
        </p>
        <p>
          We reserve the right to suspend accounts that violate these terms, including fraudulent
          listings or repeated policy violations.
        </p>
      </div>
    </div>
  );
}
