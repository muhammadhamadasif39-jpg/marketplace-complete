import { siteConfig } from "@/lib/siteConfig";

export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold mb-4">About {siteConfig.name}</h1>
      <p className="text-gray-600 leading-relaxed mb-4">
        {siteConfig.name} is a multi-vendor marketplace connecting independent sellers with buyers
        looking for quality products at fair prices. Every store on our platform is run by a real
        person or small business — when you buy here, you&apos;re supporting them directly.
      </p>
      <p className="text-gray-600 leading-relaxed">
        Have questions or want to sell with us? Visit our{" "}
        <a href="/contact" className="text-brand-accent underline">
          Contact page
        </a>
        .
      </p>
    </div>
  );
}
