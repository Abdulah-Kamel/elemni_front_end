import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const imageOrigins = [
  "https://elemni3.b-cdn.net",
  "https://elemni.b-cdn.net",
  process.env.ASSETS_URL,
  process.env.API_URL ?? "http://localhost:8001",
].filter((origin): origin is string => Boolean(origin));

const remotePatterns = imageOrigins.map((origin) => {
  const url = new URL(origin);
  const basePath = url.pathname.replace(/\/$/, "");

  return {
    protocol: url.protocol === "http:" ? "http" as const : "https" as const,
    hostname: url.hostname,
    port: url.port,
    pathname: `${basePath}/**`,
  };
});

const nextConfig: NextConfig = {
  transpilePackages: ["next-intl", "@swc/helpers"],
  env: {
    // Asset URLs are public by definition because they are used by browser images.
    ASSETS_URL: process.env.ASSETS_URL,
  },
  experimental: {
    globalNotFound: true,
  },
  images: {
    remotePatterns,
  },
};

export default withNextIntl(nextConfig);
