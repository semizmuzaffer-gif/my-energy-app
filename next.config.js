/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  async headers() {
    const isDev = process.env.NODE_ENV !== "production";

    const csp = [
      "default-src 'self'",
      "base-uri 'self'",
      "object-src 'none'",

      // Next.js hydration + Stripe
      `script-src 'self' 'unsafe-inline' ${isDev ? "'unsafe-eval' " : ""}https://js.stripe.com https://m.stripe.network`,
      "style-src 'self' 'unsafe-inline' https://m.stripe.network",

      "frame-src https://js.stripe.com https://hooks.stripe.com",
      "connect-src 'self' https://api.stripe.com https://m.stripe.network",

      "img-src 'self' data: https:",
      "font-src 'self' data: https:",
    ].join("; ");

    return [
      {
        source: "/(.*)",
        headers: [{ key: "Content-Security-Policy", value: csp }],
      },
    ];
  },
};

module.exports = nextConfig;
