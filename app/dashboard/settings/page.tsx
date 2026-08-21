"use client";

import { useMemo } from "react";
import { useSettings } from "@/hooks/use-settings";
import { usePermissions } from "@/hooks/use-permissions";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Building2,
  ReceiptText,
  Smartphone,
  Bell,
  Shield,
  Briefcase,
  Cloud,
  Settings,
  LucideIcon,
} from "lucide-react";
import { SettingsSection } from "@/components/settings/SettingsSection";
import { RolePermissionsManager } from "@/components/settings/RolePermissionsManager";
import { TestEmailButton } from "@/components/settings/TestEmailButton";
import { ThemeSelector } from "@/components/settings/ThemeSelector";

// ── Section config ────────────────────────────────────────────────────────────
// adminOnly: true  → manager sees it as read-only
// adminOnly: false → manager can edit

const SECTION_CONFIG: {
  group: string;
  title: string;
  description: string;
  icon: LucideIcon;
  adminOnly: boolean;
}[] = [
  {
    group: "general",
    title: "General",
    description: "Company identity, logos and regional settings",
    icon: Building2,
    adminOnly: false, // manager can edit general
  },
  {
    group: "receipt",
    title: "Receipt",
    description: "Customise how receipts look when printed",
    icon: ReceiptText,
    adminOnly: false, // manager can edit receipts
  },
  {
    group: "business",
    title: "Business",
    description: "Tax, discounts and fiscal year configuration",
    icon: Briefcase,
    adminOnly: false, // manager can edit
  },
  {
    group: "notifications",
    title: "Notifications",
    description: "Alert thresholds and notification preferences",
    icon: Bell,
    adminOnly: false, // manager can edit
  },
  {
    group: "mpesa",
    title: "M-Pesa Integration",
    description: "Safaricom Daraja API credentials and environment",
    icon: Smartphone,
    adminOnly: true, // admin only — contains secrets
  },
  {
    group: "cloudinary",
    title: "Cloudinary",
    description: "Image storage credentials for logo and file uploads",
    icon: Cloud,
    adminOnly: true, // admin only
  },
  {
    group: "security",
    title: "Security",
    description: "Session management and authentication settings",
    icon: Shield,
    adminOnly: true, // admin only
  },
];

export default function SettingsPage() {
  const { data: allSettings = [], isLoading } = useSettings();
  const { role, can } = usePermissions();

  const isAdmin = role === "ADMIN";
  const isManager = role === "MANAGER";

  // Group settings by their group key
  const grouped = useMemo(() => {
    return SECTION_CONFIG.map((section) => ({
      ...section,
      settings: allSettings.filter((s) => s.group === section.group),
    }));
  }, [allSettings]);

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Settings size={22} />
            Settings
          </h1>
          <p className="text-muted-foreground text-sm">
            Configure your system preferences and integrations
          </p>
        </div>
        <Badge variant={isAdmin ? "default" : "secondary"} className="gap-1">
          {isAdmin ? "Full access" : "Limited access"}
        </Badge>
      </div>

      <Separator />

      <ThemeSelector />

      <Separator />

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map((section) => {
            // Skip sections with no settings
            if (section.settings.length === 0) return null;

            // Manager sees admin-only sections as disabled (read-only)
            const isDisabled = section.adminOnly && !isAdmin;

            return (
              <SettingsSection
                key={section.group}
                title={section.title}
                description={section.description}
                icon={section.icon}
                settings={section.settings}
                disabled={isDisabled}
                footerAction={
                  section.group === "notifications" ? (
                    <TestEmailButton />
                  ) : undefined
                }
              />
            );
          })}

          {/* Role & Permission Assignment (admin only) */}
          {isAdmin && (
            <>
              <RolePermissionsManager />
              <Separator className="my-2" />
            </>
          )}
        </div>
      )}
    </div>
  );
}
