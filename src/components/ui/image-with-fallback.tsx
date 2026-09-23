"use client";

import Image, { type ImageProps } from "next/image";
import { useState } from "react";
import { resolveAssetUrl } from "@/src/lib/asset-url";

type ImageWithFallbackProps = Omit<ImageProps, "src" | "onError"> & {
  src: string | null | undefined;
  fallbackSrc: ImageProps["src"];
};

export default function ImageWithFallback({
  src,
  fallbackSrc,
  alt,
  ...props
}: ImageWithFallbackProps) {
  const resolvedSrc = resolveAssetUrl(src, "");
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const useFallback = !resolvedSrc || failedSrc === resolvedSrc;

  return (
    <Image
      {...props}
      alt={alt}
      src={useFallback ? fallbackSrc : resolvedSrc}
      onError={() => {
        if (!useFallback) setFailedSrc(resolvedSrc);
      }}
    />
  );
}
