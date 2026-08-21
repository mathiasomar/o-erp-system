"use client";

import { useRef, useState } from "react";
import { useCloudinaryUpload } from "@/hooks/use-cloudinary-upload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Field,
  FieldLabel,
  FieldDescription,
  FieldError,
} from "@/components/ui/field";
import {
  Loader2,
  Upload,
  X,
  ExternalLink,
  Image as ImageIcon,
} from "lucide-react";
import { toast } from "sonner";
import NextImage from "next/image";

type Props = {
  label: string;
  value: string;
  onChange: (url: string) => void;
  description?: string;
  disabled?: boolean;
};

export const ImageUploadField = ({
  label,
  value,
  onChange,
  description,
  disabled,
}: Props) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<"upload" | "url">("upload");
  const [urlInput, setUrlInput] = useState(value);
  const { upload, uploading, error } = useCloudinaryUpload();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB");
      return;
    }

    const result = await upload(file);
    if (result) {
      onChange(result.url);
      toast.success("Image uploaded successfully");
    }
  };

  const handleUrlApply = () => {
    if (!urlInput.trim()) return;
    onChange(urlInput.trim());
    toast.success("Image URL saved");
  };

  const handleClear = () => {
    onChange("");
    setUrlInput("");
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <Field>
      <FieldLabel>{label}</FieldLabel>

      {/* Preview */}
      {value && (
        <div
          className="relative w-full h-24 rounded-lg border bg-muted/40
                        flex items-center justify-center overflow-hidden mb-2"
        >
          <NextImage
            src={value}
            alt={label}
            fill
            className="object-contain p-2"
            unoptimized
          />
          <div className="absolute top-1.5 right-1.5 flex gap-1">
            <a
              href={value}
              target="_blank"
              rel="noreferrer"
              className="h-6 w-6 rounded bg-background/80 flex items-center
                         justify-center hover:bg-background transition-colors"
            >
              <ExternalLink size={11} />
            </a>
            {!disabled && (
              <button
                type="button"
                onClick={handleClear}
                className="h-6 w-6 rounded bg-background/80 flex items-center
                           justify-center hover:bg-destructive/80
                           hover:text-white transition-colors"
              >
                <X size={11} />
              </button>
            )}
          </div>
        </div>
      )}

      {!disabled && (
        <>
          {/* Mode toggle */}
          <div className="flex gap-1 mb-2">
            <Button
              type="button"
              size="sm"
              variant={mode === "upload" ? "default" : "outline"}
              className="h-7 text-xs"
              onClick={() => setMode("upload")}
            >
              <Upload size={11} className="mr-1" /> Upload
            </Button>
            <Button
              type="button"
              size="sm"
              variant={mode === "url" ? "default" : "outline"}
              className="h-7 text-xs"
              onClick={() => setMode("url")}
            >
              <ExternalLink size={11} className="mr-1" /> Paste URL
            </Button>
          </div>

          {/* Upload mode */}
          {mode === "upload" && (
            <div>
              <input
                ref={inputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full border-dashed"
                disabled={uploading}
                onClick={() => inputRef.current?.click()}
              >
                {uploading ? (
                  <>
                    <Loader2 size={13} className="mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <ImageIcon size={13} className="mr-2" />
                    {value ? "Replace image" : "Choose image"}
                  </>
                )}
              </Button>
              {error && <FieldError errors={[{ message: error }]} />}
            </div>
          )}

          {/* URL mode */}
          {mode === "url" && (
            <div className="flex gap-2">
              <Input
                placeholder="https://example.com/logo.png"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                className="text-sm"
              />
              <Button
                type="button"
                size="sm"
                onClick={handleUrlApply}
                disabled={!urlInput.trim()}
              >
                Apply
              </Button>
            </div>
          )}
        </>
      )}

      {description && <FieldDescription>{description}</FieldDescription>}
    </Field>
  );
};
