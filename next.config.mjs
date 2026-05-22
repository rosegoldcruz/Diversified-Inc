import path from "path";

/** @type {import("next").NextConfig} */
const nextConfig = {
  // App directory is now stable in Next.js 14, no experimental flag needed
  webpack(config) {
    config.resolve = config.resolve || {};
    config.resolve.alias = config.resolve.alias || {};
    config.resolve.alias["@"] = path.resolve(process.cwd());
    return config;
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "img-src 'self' data: blob:",
              "font-src 'self' data: https://fonts.gstatic.com",
              "connect-src 'self' https://snrg-labs-qlkczg.us1.zitadel.cloud",
              "frame-src 'self'",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
