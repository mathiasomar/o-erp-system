"use client";

import { useEffect, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { Branch } from "@/types";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Field,
  FieldLabel,
  FieldError,
  FieldGroup,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  BranchFormValues,
  createBranch,
  updateBranch,
} from "@/actions/branch.action";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  code: z.string().min(2, "Min 2 characters").max(20, "Max 20 characters"),
  address: z.string().optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  isActive: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

type Props = {
  open: boolean;
  onClose: () => void;
  branch?: Branch;
};

export const BranchSheet = ({ open, onClose, branch }: Props) => {
  const isEdit = !!branch;
  const qc = useQueryClient();
  const [isPending, startTransition] = useTransition();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: branch?.name ?? "",
      code: branch?.code ?? "",
      address: branch?.address ?? "",
      phone: branch?.phone ?? "",
      email: branch?.email ?? "",
      isActive: branch?.isActive ?? true,
    },
  });

  useEffect(() => {
    if (!open) return;
    form.reset({
      name: branch?.name ?? "",
      code: branch?.code ?? "",
      address: branch?.address ?? "",
      phone: branch?.phone ?? "",
      email: branch?.email ?? "",
      isActive: branch?.isActive ?? true,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const onSubmit = (values: FormValues) => {
    startTransition(async () => {
      const payload: BranchFormValues = {
        name: values.name,
        code: values.code,
        address: values.address,
        phone: values.phone,
        email: values.email,
      };

      const result = isEdit
        ? await updateBranch(branch.id, {
            ...payload,
            isActive: values.isActive,
          })
        : await createBranch(payload);

      if (result.success) {
        qc.invalidateQueries({ queryKey: ["branches"] });
        toast.success(isEdit ? "Branch updated" : "Branch created");
        onClose();
      } else {
        toast.error(
          (result.error as string | undefined) ?? "Failed to save branch",
        );
      }
    });
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto p-4">
        <SheetHeader className="mb-4">
          <SheetTitle>{isEdit ? "Edit Branch" : "New Branch"}</SheetTitle>
          <SheetDescription>
            {isEdit ? `Editing ${branch.name}` : "Create a new branch location"}
          </SheetDescription>
        </SheetHeader>

        <Separator className="mb-5" />

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <FieldGroup className="space-y-4">
            <Controller
              name="name"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="branch-name">
                    Branch name <span className="text-destructive">*</span>
                  </FieldLabel>
                  <Input
                    {...field}
                    id="branch-name"
                    placeholder="e.g. Westlands Branch"
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Controller
              name="code"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="branch-code">
                    Branch code <span className="text-destructive">*</span>
                  </FieldLabel>
                  <Input
                    {...field}
                    id="branch-code"
                    placeholder="e.g. WEST"
                    className="uppercase"
                    onChange={(e) =>
                      field.onChange(e.target.value.toUpperCase())
                    }
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Controller
              name="address"
              control={form.control}
              render={({ field }) => (
                <Field>
                  <FieldLabel htmlFor="branch-address">Address</FieldLabel>
                  <Input
                    {...field}
                    id="branch-address"
                    placeholder="Physical address"
                  />
                </Field>
              )}
            />

            <Controller
              name="phone"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="branch-phone">Phone</FieldLabel>
                  <Input
                    {...field}
                    id="branch-phone"
                    type="tel"
                    placeholder="+254 7XX XXX XXX"
                    aria-invalid={fieldState.invalid}
                  />
                </Field>
              )}
            />

            <Controller
              name="email"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="branch-email">Email</FieldLabel>
                  <Input
                    {...field}
                    id="branch-email"
                    type="email"
                    placeholder="branch@company.com"
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            {isEdit && (
              <Controller
                name="isActive"
                control={form.control}
                render={({ field }) => (
                  <div
                    className="flex items-center justify-between
                                  rounded-lg border p-4"
                  >
                    <div>
                      <FieldLabel>Active</FieldLabel>
                      <p className="text-xs text-muted-foreground">
                        Inactive branches cannot be selected
                      </p>
                    </div>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </div>
                )}
              />
            )}
          </FieldGroup>

          <Separator />

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={isPending || (isEdit && !form.formState.isDirty)}
            >
              {isPending && <Loader2 size={14} className="mr-2 animate-spin" />}
              {isPending
                ? "Saving..."
                : isEdit
                  ? "Save changes"
                  : "Create branch"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
};
