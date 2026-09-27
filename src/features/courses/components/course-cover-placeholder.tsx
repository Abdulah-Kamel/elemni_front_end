"use client";

import Image from "next/image";
import { useState } from "react";
import { resolveAssetUrl } from "@/src/lib/asset-url";
import { getCourseArtwork } from "../subject-art";

export default function CourseCover({
  src, subject, alt, sizes, className = "", priority = false,
}: {
  src: string | null | undefined; subject: string | null; alt: string; sizes: string; className?: string; priority?: boolean;
}) {
  const resolvedSrc = resolveAssetUrl(src, "");
  const [failed, setFailed] = useState(false);
  const { Icon, tone } = getCourseArtwork(subject);
  return resolvedSrc && !failed ? (
    <Image src={resolvedSrc} alt={alt} fill sizes={sizes} priority={priority} className={className} onError={() => setFailed(true)} />
  ) : (
    <div aria-label={alt} role="img" className={`flex h-full w-full items-center justify-center ${tone}`}>
      <Icon className="size-12" strokeWidth={1.5} aria-hidden="true" />
    </div>
  );
}
