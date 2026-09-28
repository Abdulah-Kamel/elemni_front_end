"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/src/lib/cn";

/** Up to two initials, taken from the first and last words of the name. */
export function teacherInitials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return "؟";
  const first = Array.from(words[0])[0] ?? "";
  const last = words.length > 1 ? Array.from(words[words.length - 1])[0] ?? "" : "";
  return (first + last).toLocaleUpperCase();
}

/**
 * The teacher's photo, or their initials on a sticker tile when there is no
 * photo or it fails to load. Never substitutes someone else's picture.
 */
export function TeacherAvatar({
  name,
  src,
  sizes,
  className,
  initialsClassName,
  priority = false,
}: {
  name: string;
  src: string | null | undefined;
  sizes: string;
  className?: string;
  initialsClassName?: string;
  priority?: boolean;
}) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const showPhoto = Boolean(src) && failedSrc !== src;

  return (
    <div
      className={cn(
        "relative grid shrink-0 place-items-center overflow-hidden border-2 border-ink bg-brand-100 text-brand-700 dark:border-brand-300 dark:bg-slate-800 dark:text-brand-300",
        className,
      )}
    >
      {showPhoto ? (
        <Image
          src={src!}
          alt={name}
          fill
          sizes={sizes}
          priority={priority}
          onError={() => setFailedSrc(src!)}
          className="object-cover object-center"
        />
      ) : (
        <span role="img" aria-label={name} className={cn("select-none font-black leading-none tracking-tight", initialsClassName)}>
          {teacherInitials(name)}
        </span>
      )}
    </div>
  );
}
