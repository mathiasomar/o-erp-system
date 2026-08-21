// components/ThemeAwareImage.tsx
"use client";

import { useTheme } from "next-themes";
import Image from "next/image";
import { useEffect, useState } from "react";

interface ThemeAwareImageProps {
  lightSrc: string;
  darkSrc: string;
  alt: string;
  priority?: boolean;
}

export const ThemeAwareImage = ({
  lightSrc,
  darkSrc,
  alt,
  priority = false,
}: ThemeAwareImageProps) => {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      setMounted(true);
    });

    return () => cancelAnimationFrame(id);
  }, []);

  if (!mounted) {
    return null;
  }

  const imageSrc = resolvedTheme === "dark" ? darkSrc : lightSrc;

  return (
    <Image
      src={imageSrc || "/logo.png"}
      alt={alt}
      fill
      className="object-cover"
      priority={priority}
    />
  );
};
