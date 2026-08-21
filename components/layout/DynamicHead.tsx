"use client";

import { useEffect, useRef } from "react";
import { useSystemSettings } from "../providers/SettingsProvider";

export const DynamicHead = () => {
  const { settings } = useSystemSettings(); // ← context, not separate query
  const iconRef = useRef<HTMLLinkElement | null>(null);
  const shortcutRef = useRef<HTMLLinkElement | null>(null);

  const companyName = settings.company_name || "POS System";
  const faviconUrl = settings.favicon_url || "/favicon.ico";

  // ── Title — updates instantly when settings.company_name changes ──────────
  useEffect(() => {
    document.title = companyName;
  }, [companyName]);

  // ── Favicon — updates when settings.favicon_url changes ──────────────────
  useEffect(() => {
    if (typeof document === "undefined") return;

    // Just update href on existing refs if they exist
    if (iconRef.current && shortcutRef.current) {
      iconRef.current.href = faviconUrl;
      shortcutRef.current.href = faviconUrl;
      return;
    }

    // First mount — remove statics and create our own
    document
      .querySelectorAll("link[rel='icon'], link[rel='shortcut icon']")
      .forEach((el) => el.remove());

    const icon = document.createElement("link");
    icon.rel = "icon";
    icon.type = "image/png";
    icon.href = faviconUrl;
    document.head.appendChild(icon);
    iconRef.current = icon;

    const shortcut = document.createElement("link");
    shortcut.rel = "shortcut icon";
    shortcut.href = faviconUrl;
    document.head.appendChild(shortcut);
    shortcutRef.current = shortcut;

    return () => {
      iconRef.current?.remove();
      shortcutRef.current?.remove();
      iconRef.current = null;
      shortcutRef.current = null;
    };
    // Only re-run when faviconUrl changes — uses ref for the DOM update path
  }, [faviconUrl]);

  return null;
};
