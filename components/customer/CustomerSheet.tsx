"use client";

import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Customer } from "@/types";
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
import { Loader2 } from "lucide-react";
import { useCreateCustomer, useUpdateCustomer } from "@/hooks/use-customer";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().optional().or(z.literal("")),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
});

type FormValues = z.infer<typeof schema>;

type Props = {
  open: boolean;
  onClose: () => void;
  customer?: Customer;
};

export const CustomerSheet = ({ open, onClose, customer }: Props) => {
  const isEdit = !!customer;

  const { mutate: create, isPending: creating } = useCreateCustomer(onClose);
  const { mutate: update, isPending: updating } = useUpdateCustomer(
    customer?.id ?? "",
    onClose,
  );

  const isPending = creating || updating;

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: customer?.name ?? "",
      phone: customer?.phone ?? "",
      email: customer?.email ?? "",
      address: customer?.address ?? "",
      notes: customer?.notes ?? "",
    },
  });

  useEffect(() => {
    if (!open) return;
    form.reset({
      name: customer?.name ?? "",
      phone: customer?.phone ?? "",
      email: customer?.email ?? "",
      address: customer?.address ?? "",
      notes: customer?.notes ?? "",
    });
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
          <SheetTitle>{isEdit ? "Edit Customer" : "New Customer"}</SheetTitle>
          <SheetDescription>
            {isEdit
              ? `Editing ${customer.name}`
              : "Add a new customer to your CRM"}
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
                  <FieldLabel htmlFor="cust-name">
                    Full name <span className="text-destructive">*</span>
                  </FieldLabel>
                  <Input
                    {...field}
                    id="cust-name"
                    placeholder="e.g. Jane Doe"
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
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="cust-phone">Phone number</FieldLabel>
                  <Input
                    {...field}
                    id="cust-phone"
                    type="tel"
                    placeholder="+254 7XX XXX XXX"
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Controller
              name="email"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="cust-email">Email</FieldLabel>
                  <Input
                    {...field}
                    id="cust-email"
                    type="email"
                    placeholder="jane@example.com"
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
                  <FieldLabel htmlFor="cust-address">Address</FieldLabel>
                  <Input
                    {...field}
                    id="cust-address"
                    placeholder="Physical address"
                  />
                </Field>
              )}
            />

            <Controller
              name="notes"
              control={form.control}
              render={({ field }) => (
                <Field>
                  <FieldLabel htmlFor="cust-notes">Notes</FieldLabel>
                  <Textarea
                    {...field}
                    id="cust-notes"
                    placeholder="Internal notes about this customer..."
                    rows={3}
                    className="resize-none"
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
                  : "Create customer"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
};
