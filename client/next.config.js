/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "marketplace-production-aa0f.up.railway.app", pathname: "/uploads/**" },
    ],
  },
};

module.exports = nextConfig;
