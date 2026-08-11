import Link from "next/link";
import { siteConfig } from "@/lib/siteConfig";

export default function Footer() {
  return (
    <footer className="bg-brand text-white/70 mt-16">
      <div className="max-w-7xl mx-auto px-4 py-10 grid grid-cols-2 md:grid-cols-4 gap-8 text-sm">
        <div>
          <h4 className="text-white font-display font-bold mb-3">
            {siteConfig.name}
            <span className="text-brand-accent">.</span>
          </h4>
          <p>{siteConfig.tagline}</p>
        </div>
        <div>
          <h4 className="text-white font-semibold mb-3">Shop</h4>
          <ul className="space-y-2">
            <li><Link href="/products" className="hover:text-brand-accent transition">All Products</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-white font-semibold mb-3">Company</h4>
          <ul className="space-y-2">
            <li><Link href="/about" className="hover:text-brand-accent transition">About</Link></li>
            <li><Link href="/contact" className="hover:text-brand-accent transition">Contact</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-white font-semibold mb-3">Legal</h4>
          <ul className="space-y-2">
            <li><Link href="/privacy" className="hover:text-brand-accent transition">Privacy Policy</Link></li>
            <li><Link href="/terms" className="hover:text-brand-accent transition">Terms</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 py-4 text-center text-xs">
        © {new Date().getFullYear()} {siteConfig.name}. All rights reserved.
      </div>
    </footer>
  );
}
