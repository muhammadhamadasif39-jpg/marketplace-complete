import { siteConfig } from "@/lib/siteConfig";

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12 prose-sm">
      <h1 className="text-2xl font-bold mb-4">Privacy Policy</h1>
      <p className="text-gray-500 text-sm mb-6">Placeholder policy — replace with your real policy before going live.</p>

      <div className="space-y-4 text-gray-600 leading-relaxed text-sm">
        <p>
          {siteConfig.name} collects the information you provide when creating an account, placing
          an order, or contacting support — including your name, email, shipping address, and phone
          number. Sellers additionally provide store and payout details.
        </p>
        <p>
          We use this information to process orders, communicate with you about your account, and
          improve the platform. We do not sell your personal information to third parties.
        </p>
        <p>
          Payment details are processed by our payment providers and are never stored on our
          servers in raw form.
        </p>
        <p>
          You can request access to, correction of, or deletion of your personal data at any time
          by contacting us.
        </p>
      </div>
    </div>
  );
}
