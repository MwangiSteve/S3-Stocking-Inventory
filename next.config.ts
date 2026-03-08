import type { NextConfig } from "next";

const securityHeaders = [
  // Prevent browsers from MIME-sniffing the content type.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Deny embedding this page in an iframe to prevent clickjacking.
  { key: "X-Frame-Options", value: "DENY" },
  // Enable the browser's built-in XSS filter (IE/Edge legacy).
  { key: "X-XSS-Protection", value: "1; mode=block" },
  // Only send the origin (no path) as the referrer when navigating cross-origin.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Restrict which browser features can be used.
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  // Enforce HTTPS for 1 year (prod only – applied to all responses here).
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains; preload",
  },
  // Content Security Policy – tightened to prevent XSS / data injection.
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      // Next.js uses inline scripts for hydration; 'unsafe-inline' is needed
      // until nonce-based CSP is configured.
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "font-src 'self'",
      "connect-src 'self'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  reactStrictMode: false, // Disable React Strict Mode
  async headers() {
    return [
      {
        // Apply security headers to all routes.
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
