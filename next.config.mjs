/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Avoid the Next 15.1 + ESLint 9 "Cannot serialize key parse" crash on Vercel.
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
