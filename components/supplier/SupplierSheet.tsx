"use client";

import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";
import { useCreateSupplier, useUpdateSupplier } from "@/hooks/use-supplier";
import { SupplierValues } from "@/actions/supplier.action";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  contactName: z.string().optional().or(z.literal("")),
  taxPin: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
  status: z.enum(["ACTIVE", "INACTIVE"]),
});

type FormValues = z.infer<typeof schema>;

type Props = {
  open: boolean;
  onClose: () => void;
  supplier?: any;
};

export const SupplierSheet = ({ open, onClose, supplier }: Props) => {
  const isEdit = !!supplier;

  const { mutate: create, isPending: creating } = useCreateSupplier(onClose);
  const { mutate: update, isPending: updating } = useUpdateSupplier(
    supplier?.id ?? "",
    onClose,
  );

  const isPending = creating || updating;

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: supplier?.name ?? "",
      email: supplier?.email ?? "",
      phone: supplier?.phone ?? "",
      address: supplier?.address ?? "",
      contactName: supplier?.contactName ?? "",
      taxPin: supplier?.taxPin ?? "",
      notes: supplier?.notes ?? "",
      status: supplier?.status ?? "ACTIVE",
    } as FormValues,
  });

  useEffect(() => {
    if (!open) return;
    form.reset({
      name: supplier?.name ?? "",
      email: supplier?.email ?? "",
      phone: supplier?.phone ?? "",
      address: supplier?.address ?? "",
      contactName: supplier?.contactName ?? "",
      taxPin: supplier?.taxPin ?? "",
      notes: supplier?.notes ?? "",
      status: supplier?.status ?? "ACTIVE",
    } as FormValues);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const onSubmit = (values: FormValues) => {
    if (isEdit) {
      update(values);
    } else {
      create(values);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto p-4">
        <SheetHeader className="mb-4">
          <SheetTitle>{isEdit ? "Edit Supplier" : "New Supplier"}</SheetTitle>
          <SheetDescription>
            {isEdit
              ? `Editing ${supplier.name}`
              : "Add a new supplier to your system"}
          </SheetDescription>
        </SheetHeader>

        <Separator className="mb-5" />

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FieldGroup className="space-y-4">
            <Controller
              name="name"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="sup-name">
                    Company name <span className="text-destructive">*</span>
                  </FieldLabel>
                  <Input
                    {...field}
                    id="sup-name"
                    placeholder="e.g. Acme Supplies Ltd"
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Controller
              name="contactName"
              control={form.control}
              render={({ field }) => (
                <Field>
                  <FieldLabel htmlFor="sup-contact">Contact person</FieldLabel>
                  <Input
                    {...field}
                    id="sup-contact"
                    placeholder="e.g. John Smith"
                  />
                </Field>
              )}
            />

            <Controller
              name="email"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="sup-email">Email</FieldLabel>
                  <Input
                    {...field}
                    id="sup-email"
                    type="email"
                    placeholder="supplier@example.com"
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Controller
              name="phone"
              control={form.control}
              render={({ field }) => (
                <Field>
                  <FieldLabel htmlFor="sup-phone">Phone number</FieldLabel>
                  <Input
                    {...field}
                    id="sup-phone"
                    type="tel"
                    placeholder="+254 7XX XXX XXX"
                  />
                </Field>
              )}
            />

            <Controller
              name="address"
              control={form.control}
              render={({ field }) => (
                <Field>
                  <FieldLabel htmlFor="sup-address">Address</FieldLabel>
                  <Input
                    {...field}
                    id="sup-address"
                    placeholder="Physical address"
                  />
                </Field>
              )}
            />

            <Controller
              name="taxPin"
              control={form.control}
              render={({ field }) => (
                <Field>
                  <FieldLabel htmlFor="sup-taxpin">Tax PIN</FieldLabel>
                  <Input
                    {...field}
                    id="sup-taxpin"
                    placeholder="Tax identification number"
                  />
                </Field>
              )}
            />

            <Controller
              name="notes"
              control={form.control}
              render={({ field }) => (
                <Field>
                  <FieldLabel htmlFor="sup-notes">Notes</FieldLabel>
                  <Textarea
                    {...field}
                    id="sup-notes"
                    placeholder="Internal notes about this supplier..."
                    rows={3}
                    className="resize-none"
                  />
                </Field>
              )}
            />

            <Controller
              name="status"
              control={form.control}
              render={({ field }) => (
                <Field className="flex items-center justify-between">
                  <FieldLabel htmlFor="sup-status">Active supplier</FieldLabel>
                  <Switch
                    id="sup-status"
                    checked={field.value === "ACTIVE"}
                    onCheckedChange={(checked) =>
                      field.onChange(checked ? "ACTIVE" : "INACTIVE")
                    }
                  />
                </Field>
              )}
            />
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
                ? isEdit
                  ? "Saving..."
                  : "Creating..."
                : isEdit
                  ? "Save changes"
                  : "Create supplier"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
};
