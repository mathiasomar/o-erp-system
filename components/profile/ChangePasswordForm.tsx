"use client";

import { useState, useTransition } from "react";
import { Controller, Control, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Field,
  FieldLabel,
  FieldError,
  FieldGroup,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Loader2, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { changePassword } from "@/actions/profile.action";

const schema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password"),
    newPassword: z.string().min(8, "Must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type FormValues = z.infer<typeof schema>;

type PasswordInputProps = {
  id: string;
  name: keyof FormValues;
  label: string;
  show: boolean;
  toggle: () => void;
  placeholder: string;
  control: Control<FormValues>;
};

const PasswordInput = ({
  id,
  name,
  label,
  show,
  toggle,
  placeholder,
  control,
}: PasswordInputProps) => (
  <Controller
    name={name}
    control={control}
    render={({ field, fieldState }) => (
      <Field data-invalid={fieldState.invalid}>
        <FieldLabel htmlFor={id}>{label}</FieldLabel>
        <div className="relative">
          <Input
            {...field}
            id={id}
            type={show ? "text" : "password"}
            placeholder={placeholder}
            className="pr-9"
            autoComplete="new-password"
            aria-invalid={fieldState.invalid}
          />
          <button
            type="button"
            onClick={toggle}
            className="absolute right-2.5 top-1/2 -translate-y-1/2
                       text-muted-foreground hover:text-foreground"
          >
            {show ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        </div>
        {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
      </Field>
    )}
  />
);

type Props = { onSuccess?: () => void };

export const ChangePasswordForm = ({ onSuccess }: Props) => {
  const [isPending, startTransition] = useTransition();
  const [done, setDone] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const newPassword = useWatch({ control: form.control, name: "newPassword" });

  // Password strength indicator
  const strength = (() => {
    if (!newPassword) return 0;
    let s = 0;
    if (newPassword.length >= 8) s++;
    if (/[A-Z]/.test(newPassword)) s++;
    if (/[0-9]/.test(newPassword)) s++;
    if (/[^A-Za-z0-9]/.test(newPassword)) s++;
    return s;
  })();

  const strengthLabel = ["", "Weak", "Fair", "Good", "Strong"];
  const strengthColor = [
    "",
    "bg-red-500",
    "bg-orange-400",
    "bg-blue-500",
    "bg-green-500",
  ];

  const onSubmit = (values: FormValues) => {
    startTransition(async () => {
      const result = await changePassword(values);
      if (result.success) {
        setDone(true);
        form.reset();
        toast.success("Password changed successfully");
        onSuccess?.();
      } else {
        const err =
          typeof result.error === "string"
            ? result.error
            : "Failed to change password";
        toast.error(err);
      }
    });
  };

  if (done) {
    return (
      <div
        className="flex flex-col items-center justify-center
                      gap-3 py-8 text-center"
      >
        <div className="p-3 rounded-full bg-green-50 dark:bg-green-950/20">
          <CheckCircle2 size={24} className="text-green-600" />
        </div>
        <p className="font-semibold">Password changed</p>
        <p className="text-sm text-muted-foreground">
          You have been signed out of other sessions.
        </p>
        <Button size="sm" variant="outline" onClick={() => setDone(false)}>
          Change again
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
      <FieldGroup className="space-y-4">
        <PasswordInput
          id="current-password"
          name="currentPassword"
          label="Current password"
          show={showCurrent}
          toggle={() => setShowCurrent((v) => !v)}
          placeholder="Enter current password"
          control={form.control}
        />

        <div className="space-y-2">
          <PasswordInput
            id="new-password"
            name="newPassword"
            label="New password"
            show={showNew}
            toggle={() => setShowNew((v) => !v)}
            placeholder="Min 8 characters"
            control={form.control}
          />

          {/* Strength bar */}
          {newPassword && (
            <div className="space-y-1">
              <div className="flex gap-1">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className={`h-1 flex-1 rounded-full transition-colors ${
                      i <= strength ? strengthColor[strength] : "bg-muted"
                    }`}
                  />
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Strength:{" "}
                <span
                  className={`font-medium ${
                    strength <= 1
                      ? "text-red-500"
                      : strength === 2
                        ? "text-orange-400"
                        : strength === 3
                          ? "text-blue-500"
                          : "text-green-500"
                  }`}
                >
                  {strengthLabel[strength]}
                </span>
              </p>
            </div>
          )}
        </div>

        <PasswordInput
          id="confirm-password"
          name="confirmPassword"
          label="Confirm new password"
          show={showConfirm}
          toggle={() => setShowConfirm((v) => !v)}
          placeholder="Re-enter new password"
          control={form.control}
        />
      </FieldGroup>

      <Separator />

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending && <Loader2 size={14} className="mr-2 animate-spin" />}
        {isPending ? "Changing password..." : "Change password"}
      </Button>
    </form>
  );
};
