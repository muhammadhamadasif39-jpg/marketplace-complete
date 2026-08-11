import Link from "next/link";

export default function NotFound() {
  return (
    <div className="max-w-md mx-auto px-4 py-24 text-center">
      <p className="text-brand-accent font-bold text-sm mb-2">404</p>
      <h1 className="text-2xl font-bold mb-3">Page not found</h1>
      <p className="text-gray-500 mb-8">
        The page you&apos;re looking for doesn&apos;t exist or may have been moved.
      </p>
      <Link
        href="/"
        className="inline-block bg-brand text-white px-6 py-3 rounded font-medium hover:opacity-90 transition"
      >
        Back to Home
      </Link>
    </div>
  );
}
