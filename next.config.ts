import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const imageOrigins = [
  process.env.ASSETS_URL,
  process.env.API_URL ?? "http://localhost:8001",
].filter((origin): origin is string => Boolean(origin));

const nextConfig: NextConfig = {
  images: {
    remotePatterns: imageOrigins.map((origin) => new URL("/**", origin)),
  },
};

export default withNextIntl(nextConfig);
