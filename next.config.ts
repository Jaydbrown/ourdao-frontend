import type { NextConfig } from "next";
import { version } from "./package.json";

/**
 * Build image remote patterns from IPFS gateway configuration.
 * 
 * Note: CSP and other security headers are now generated in src/middleware.ts
 * to support per-request nonce generation for script-src. The buildCsp function
 * has been removed; see middleware.ts for the new nonce-based policy.
 */

function buildImageRemotePatterns() {
  const ipfsGateways = (process.env.NEXT_PUBLIC_IPFS_GATEWAY || "")
    .split(",")
    .map((g) => g.trim())
    .filter(Boolean);

  const patterns: {
    protocol?: "http" | "https";
    hostname: string;
    port?: string;
    pathname?: string;
  }[] = [];
  const seen = new Set<string>();

  for (const raw of ipfsGateways) {
    try {
      const u = new URL(raw);
      const protocol = (u.protocol.replace(":", "") as "http" | "https") || "https";
      const hostname = u.hostname;
      const port = u.port || undefined;
      let pathname = u.pathname;
      if (!pathname || pathname === "/") {
        pathname = "/**";
      } else {
        pathname = pathname.endsWith("/") ? `${pathname}**` : `${pathname}/**`;
      }

      const key = `${protocol}://${hostname}:${port ?? ""}${pathname}`;
      if (!seen.has(key)) {
        seen.add(key);
        patterns.push({
          protocol,
          hostname,
          ...(port ? { port } : {}),
          pathname,
        });
      }
    } catch {
      // Ignore malformed env values — don't break the build
    }
  }

  return patterns;
}

/**
 * Build an env-driven Content-Security-Policy.
 */
function buildCsp(): string {
  const rpcUrl = process.env.NEXT_PUBLIC_SOROBAN_RPC_URL || "https://soroban-testnet.stellar.org";
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";
  // NEXT_PUBLIC_IPFS_GATEWAY may be a comma-separated list of gateways.
  const ipfsGateways = (process.env.NEXT_PUBLIC_IPFS_GATEWAY || "https://gateway.pinata.cloud/ipfs/")
    .split(",")
    .map((g) => g.trim())
    .filter(Boolean);

  const origins = new Set<string>();

  for (const raw of [rpcUrl, backendUrl, ...ipfsGateways]) {
    try {
      const u = new URL(raw);
      origins.add(u.origin);
    } catch {
      // Ignore malformed env values — don't break the build
    }
  }

  // Allow ws/wss variants for local dev HMR and any WS-based RPC endpoint.
  const wsOrigins = new Set<string>();
  for (const o of origins) {
    try {
      const u = new URL(o);
      if (u.protocol === "http:") wsOrigins.add(`ws://${u.host}`);
      if (u.protocol === "https:") wsOrigins.add(`wss://${u.host}`);
    } catch {
      // ignore
    }
  }

  const connectSrc = [
    "'self'",
    ...Array.from(origins),
    ...Array.from(wsOrigins),
    "ws://localhost:*",
    "wss://localhost:*",
  ].join(" ");

  const directives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    `connect-src ${connectSrc}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "worker-src 'self' blob:",
    "media-src 'self' blob: data:",
  ];

  return directives.join("; ");
}

export { buildImageRemotePatterns, buildCsp };

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  turbopack: {},
  productionBrowserSourceMaps: process.env.ANALYZE_BUNDLE === "1",
  env: {
    NEXT_PUBLIC_APP_VERSION: version,
    NEXT_PUBLIC_GIT_SHA: process.env.VERCEL_GIT_COMMIT_SHA || process.env.GITHUB_SHA || "",
  },
  pageExtensions:
    process.env.NODE_ENV === "production"
      ? ["tsx", "ts", "jsx", "js"]
      : ["dev.tsx", "tsx", "ts", "jsx", "js"],
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: buildImageRemotePatterns(),
  },
  async headers() {
    const csp = buildCsp();
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: csp,
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), interest-cohort=(), browsing-topics=()",
          },
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
