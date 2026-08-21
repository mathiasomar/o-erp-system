"use client";

import { useState, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { SystemSetting } from "@/types";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Save, Eye, EyeOff, LucideIcon } from "lucide-react";
import { toast } from "sonner";
import { ImageUploadField } from "./ImageUploadField";
import { updateSettings } from "@/actions/settings.action";
import { useQueryClient } from "@tanstack/react-query";

type Props = {
  title: string;
  description: string;
  icon: LucideIcon;
  settings: SystemSetting[];
  disabled?: boolean; // manager read-only on some sections
  footerAction?: React.ReactNode;
};

export const SettingsSection = ({
  title,
  description,
  icon: Icon,
  settings,
  disabled = false,
  footerAction,
}: Props) => {
  const router = useRouter();
  const qc = useQueryClient();
  const [isPending, startTransition] = useTransition();
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});

  // Build default values from current settings
  const defaultValues = Object.fromEntries(
    settings.map((s) => [s.key, s.value]),
  ) as Record<string, string>;

  const {
    control,
    handleSubmit,
    reset,
    formState: { isDirty },
  } = useForm<Record<string, string>>({
    defaultValues,
  });

  const onSubmit = (values: Record<string, string>) => {
    startTransition(async () => {
      const result = await updateSettings(values);
      if (result.success) {
        // 1. Refresh the settings context — updates DynamicHead, DynamicLogo,
        // 1. Invalidate React Query cache
        await qc.invalidateQueries({ queryKey: ["settings"] });
        await qc.invalidateQueries({ queryKey: ["settings-public"] });
        //    Navbar, Sidebar instantly without a page refresh
        router.refresh();

        // 2. Reset the form dirty state so "unsaved changes" clears
        reset(values);

        toast.success(`${title} settings saved`);
      } else {
        toast.error("Failed to save settings");
      }
    });
  };

  const toggleReveal = (key: string) =>
    setRevealed((prev) => ({ ...prev, [key]: !prev[key] }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Icon size={16} />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {settings.map((setting) => (
              <Controller
                key={setting.key}
                name={setting.key}
                control={control}
                render={({ field }) => {
                  // ── Image ────────────────────────────────────────────────
                  if (setting.type === "image") {
                    return (
                      <div className="sm:col-span-2">
                        <ImageUploadField
                          label={setting.label}
                          value={field.value}
                          onChange={field.onChange}
                          disabled={disabled}
                        />
                      </div>
                    );
                  }

                  // ── Boolean / toggle ─────────────────────────────────────
                  if (setting.type === "boolean") {
                    return (
                      <div
                        className="flex items-center justify-between
                                      rounded-lg border p-4 sm:col-span-1"
                      >
                        <div>
                          <FieldLabel>{setting.label}</FieldLabel>
                        </div>
                        <Switch
                          checked={field.value === "true"}
                          onCheckedChange={(v) => field.onChange(String(v))}
                          disabled={disabled}
                        />
                      </div>
                    );
                  }

                  // ── Secret ───────────────────────────────────────────────
                  if (setting.type === "secret") {
                    const isRevealed = revealed[setting.key];
                    return (
                      <Field>
                        <FieldLabel htmlFor={setting.key}>
                          {setting.label}
                          <Badge
                            variant="outline"
                            className="ml-2 text-[10px] text-orange-600
                                       border-orange-300"
                          >
                            secret
                          </Badge>
                        </FieldLabel>
                        <div className="relative">
                          <Input
                            {...field}
                            id={setting.key}
                            type={isRevealed ? "text" : "password"}
                            placeholder="••••••••••••"
                            disabled={disabled}
                            className="pr-9"
                            autoComplete="off"
                          />
                          <button
                            type="button"
                            onClick={() => toggleReveal(setting.key)}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2
                                       text-muted-foreground hover:text-foreground"
                          >
                            {isRevealed ? (
                              <EyeOff size={14} />
                            ) : (
                              <Eye size={14} />
                            )}
                          </button>
                        </div>
                      </Field>
                    );
                  }

                  // ── Number ───────────────────────────────────────────────
                  if (setting.type === "number") {
                    return (
                      <Field>
                        <FieldLabel htmlFor={setting.key}>
                          {setting.label}
                        </FieldLabel>
                        <Input
                          {...field}
                          id={setting.key}
                          type="number"
                          disabled={disabled}
                          autoComplete="off"
                        />
                      </Field>
                    );
                  }

                  // ── URL / email / phone / text (default) ─────────────────
                  return (
                    <Field>
                      <FieldLabel htmlFor={setting.key}>
                        {setting.label}
                      </FieldLabel>
                      <Input
                        {...field}
                        id={setting.key}
                        type={
                          setting.type === "email"
                            ? "email"
                            : setting.type === "url"
                              ? "url"
                              : setting.type === "phone"
                                ? "tel"
                                : "text"
                        }
                        disabled={disabled}
                        autoComplete="off"
                      />
                    </Field>
                  );
                }}
              />
            ))}
          </div>

          {/* Save */}
          {!disabled && (
            <div
              className="flex items-center justify-between pt-2
                            border-t gap-3"
            >
              <div className="flex items-center gap-2">
                {isDirty && (
                  <p className="text-xs text-muted-foreground">
                    You have unsaved changes
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="submit"
                  size="sm"
                  disabled={isPending || !isDirty}
                >
                  {isPending && (
                    <Loader2 size={13} className="mr-2 animate-spin" />
                  )}
                  <Save size={13} className="mr-1.5" />
                  {isPending ? "Saving..." : "Save changes"}
                </Button>
                {footerAction}
              </div>
            </div>
          )}

          {disabled && (
            <p
              className="text-xs text-muted-foreground text-center
                          border-t pt-3"
            >
              This section requires Admin access to edit.
            </p>
          )}
        </form>
      </CardContent>
    </Card>
  );
};
