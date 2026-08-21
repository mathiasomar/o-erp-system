"use client";

import { useEffect, useRef } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { toast } from "sonner";

const ProxyErrorToastInner = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const shown = useRef(false); // prevent double-toast on strict mode

  useEffect(() => {
    const error = searchParams.get("error");
    if (!error || shown.current) return;

    shown.current = true;

    switch (error) {
      case "unauthorized":
        toast.error("You don't have permission to access that page.");
        break;
      case "account_disabled":
        toast.error("Your account has been deactivated. Contact an admin.");
        break;
      default:
        toast.error("Something went wrong.");
    }

    // Remove ?error= from URL cleanly without re-render
    const params = new URLSearchParams(searchParams.toString());
    params.delete("error");
    const newUrl =
      params.size > 0 ? `${pathname}?${params.toString()}` : pathname;
    router.replace(newUrl);
  }, [searchParams, router, pathname]);

  return null;
};

// Wrap in Suspense — required by Next.js for useSearchParams in App Router
import { Suspense } from "react";

export const ProxyErrorToast = () => (
  <Suspense fallback={null}>
    <ProxyErrorToastInner />
  </Suspense>
);
