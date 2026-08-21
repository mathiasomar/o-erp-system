"use client";

import { useEffect } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { ProfileUser } from "@/types";
import { useCloudinaryUpload } from "@/hooks/use-cloudinary-upload";
import {
  Field,
  FieldLabel,
  FieldError,
  FieldGroup,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Loader2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { useTransition, useRef } from "react";
import NextImage from "next/image";
import { updateProfile } from "@/actions/profile.action";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  username: z.string().regex(/^[a-z][a-z0-9_]{2,19}$/, "Invalid username"),
  image: z.string().url("Invalid URL").optional().or(z.literal("")),
});

type FormValues = z.infer<typeof schema>;

type Props = {
  user: ProfileUser;
  onSuccess?: () => void;
};

export const EditProfileForm = ({ user, onSuccess }: Props) => {
  const qc = useQueryClient();
  const [isPending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);
  const { upload, uploading } = useCloudinaryUpload();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: user.name,
      email: user.email,
      username: user.username,
      image: user.image ?? "",
    },
  });

  useEffect(() => {
    form.reset({
      name: user.name,
      email: user.email,
      username: user.username,
      image: user.image ?? "",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.id]);

  const watchedImage = useWatch({ control: form.control, name: "image" });
  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const result = await upload(file);
    if (result) {
      form.setValue("image", result.url, { shouldDirty: true });
      toast.success("Photo uploaded");
    }
  };

  const onSubmit = (values: FormValues) => {
    startTransition(async () => {
      const result = await updateProfile(values);
      if (result.success) {
        qc.invalidateQueries({ queryKey: ["profile"] });
        qc.invalidateQueries({ queryKey: ["profile-stats"] });
        qc.invalidateQueries({ queryKey: ["users"] });
        toast.success("Profile updated");
        onSuccess?.();
      } else {
        toast.error("Failed to update profile");
      }
    });
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {/* Avatar section */}
      <div className="flex flex-col items-center gap-3">
        <div className="relative group">
          <Avatar className="h-24 w-24">
            {watchedImage ? (
              <div className="relative h-full w-full">
                <NextImage
                  src={watchedImage}
                  alt={user.name}
                  fill
                  className="object-cover rounded-full"
                  unoptimized
                />
              </div>
            ) : (
              <AvatarFallback className="text-2xl font-bold bg-muted">
                {initials}
              </AvatarFallback>
            )}
          </Avatar>

          {/* Overlay upload button */}
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="absolute inset-0 rounded-full bg-black/50
                       flex items-center justify-center opacity-0
                       group-hover:opacity-100 transition-opacity"
          >
            {uploading ? (
              <Loader2 size={18} className="text-white animate-spin" />
            ) : (
              <Upload size={18} className="text-white" />
            )}
          </button>
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageUpload}
        />

        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="text-xs h-7"
            disabled={uploading}
            onClick={() => fileRef.current?.click()}
          >
            <Upload size={11} className="mr-1.5" />
            {uploading ? "Uploading..." : "Upload photo"}
          </Button>
          {watchedImage && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-xs h-7 text-destructive"
              onClick={() => form.setValue("image", "", { shouldDirty: true })}
            >
              <X size={11} className="mr-1" /> Remove
            </Button>
          )}
        </div>
      </div>

      <Separator />

      <FieldGroup className="space-y-4">
        {/* Name */}
        <Controller
          name="name"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="profile-name">
                Full name <span className="text-destructive">*</span>
              </FieldLabel>
              <Input
                {...field}
                id="profile-name"
                autoComplete="name"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        {/* Email */}
        <Controller
          name="email"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="profile-email">
                Email <span className="text-destructive">*</span>
              </FieldLabel>
              <Input
                {...field}
                id="profile-email"
                type="email"
                autoComplete="email"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        {/* Username */}
        <Controller
          name="username"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="profile-username">
                Username <span className="text-destructive">*</span>
              </FieldLabel>
              <Input
                {...field}
                id="profile-username"
                type="text"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </FieldGroup>

      {form.formState.isDirty && (
        <p className="text-xs text-muted-foreground text-center">
          You have unsaved changes
        </p>
      )}

      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          onClick={() => form.reset()}
          disabled={!form.formState.isDirty || isPending}
        >
          Reset
        </Button>
        <Button
          type="submit"
          className="flex-1"
          disabled={isPending || !form.formState.isDirty}
        >
          {isPending && <Loader2 size={14} className="mr-2 animate-spin" />}
          {isPending ? "Saving..." : "Save changes"}
        </Button>
      </div>
    </form>
  );
};
