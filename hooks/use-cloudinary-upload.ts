"use client";

import { useState } from "react";
import { toast } from "sonner";
import { usePublicSettings } from "./use-settings";

type UploadResult = {
  url: string;
  publicId: string;
  width: number;
  height: number;
};

export const useCloudinaryUpload = () => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Read Cloudinary config from the public settings already in React Query cache
  const { data: settings } = usePublicSettings();

  const upload = async (file: File): Promise<UploadResult | null> => {
    setUploading(true);
    setError(null);

    try {
      const cloudName = settings?.cloudinary_cloud_name ?? "";
      const uploadPreset = settings?.cloudinary_upload_preset ?? "";

      if (!cloudName) {
        throw new Error(
          "Cloudinary cloud name is not configured. Go to Settings → Cloudinary.",
        );
      }

      if (!uploadPreset) {
        throw new Error(
          "Cloudinary upload preset is not configured. Go to Settings → Cloudinary.",
        );
      }

      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", uploadPreset);
      formData.append("folder", "pos-system");

      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        { method: "POST", body: formData },
      );

      if (!res.ok) {
        // Try to get Cloudinary's error message
        const errData = (await res.json().catch(() => ({}))) as {
          error?: { message?: string };
        };
        throw new Error(
          errData.error?.message ?? `Upload failed with status ${res.status}`,
        );
      }

      const data = (await res.json()) as {
        secure_url: string;
        public_id: string;
        width: number;
        height: number;
      };

      return {
        url: data.secure_url,
        publicId: data.public_id,
        width: data.width,
        height: data.height,
      };
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Upload failed";
      setError(msg);
      toast.error(msg);
      return null;
    } finally {
      setUploading(false);
    }
  };

  return { upload, uploading, error };
};
