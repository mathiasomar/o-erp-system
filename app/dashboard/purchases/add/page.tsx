"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Button,
} from "@/components/ui/button";
import {
  Field,
  FieldLabel,
  FieldError,
  FieldGroup,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Trash2, Search, Package, ArrowLeft, Save } from "lucide-react";
import { useCreatePurchase } from "@/hooks/use-purchase";
import { useSuppliers } from "@/hooks/use-supplier";
import { useProducts } from "@/hooks/use-product";
import { PurchaseInput } from "@/actions/purchase.action";
import { toast } from "sonner";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import Link from "next/link";

const purchaseItemSchema = z.object({
  productId: z.string().optional(),
  productName: z.string().optional(),
  sku: z.string().optional(),
  orderedQty: z.number().int().min(1),
  unitCostExcl: z.number().min(0),
  taxRate: z.number().min(0).max(100),
  updateCostPrice: z.boolean(),
}).refine((data) => {
  // Either productId should be set, or both productName and sku should be set
  if (data.productId) return true;
  return !!(data.productName && data.sku);
}, {
  message: "Either select a product or provide product name and SKU",
}).transform((data) => {
  // If productId is set, ensure productName and sku are not sent as empty strings
  if (data.productId) {
    return {
      ...data,
      productName: data.productName || "",
      sku: data.sku || "",
    };
  }
  return data;
});

const purchaseSchema = z.object({
  supplierId: z.string().optional(),
  invoiceNumber: z.string().optional(),
  invoiceDate: z.string().optional(),
  expectedDate: z.string().optional(),
  paymentMethod: z.enum(["CASH", "MPESA", "CARD", "BANK_TRANSFER"]).optional(),
  discountAmount: z.number().min(0),
  shippingCost: z.number().min(0),
  notes: z.string().optional(),
  items: z.array(purchaseItemSchema).min(1, "At least one item required"),
});

type FormValues = z.infer<typeof purchaseSchema>;

const computeItem = (item: {
  unitCostExcl: number;
  taxRate: number;
  orderedQty: number;
}) => {
  const unitCostIncl = item.unitCostExcl * (1 + item.taxRate / 100);
  const subtotal = item.unitCostExcl * item.orderedQty;
  const taxAmount = unitCostIncl * item.orderedQty - subtotal;
  const total = subtotal + taxAmount;
  return { unitCostIncl, subtotal, taxAmount, total };
};

export default function AddPurchasePage() {
  const router = useRouter();
  const { data: suppliers = [] } = useSuppliers();
  const { data: products = [] } = useProducts();
  const { mutate: create, isPending: creating } = useCreatePurchase();
  const [selectedProducts, setSelectedProducts] = useState<Record<number, string>>({});

  const isPending = creating;

  const form = useForm<FormValues>({
    resolver: zodResolver(purchaseSchema),
    defaultValues: {
      supplierId: "",
      invoiceNumber: "",
      invoiceDate: "",
      expectedDate: "",
      paymentMethod: undefined,
      discountAmount: 0,
      shippingCost: 0,
      notes: "",
      items: [
        {
          productId: undefined,
          productName: "",
          sku: "",
          orderedQty: 1,
          unitCostExcl: 0,
          taxRate: 0,
          updateCostPrice: true,
        }
      ],
    } as FormValues,
  });

  const { fields, append, remove, update } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const onSubmit = (values: FormValues) => {
    create(values as PurchaseInput, {
      onSuccess: () => {
        toast.success("Purchase order created successfully");
        router.push("/dashboard/purchases");
      },
    });
  };

  const addItem = () => {
    append({
      productId: undefined,
      productName: "",
      sku: "",
      orderedQty: 1,
      unitCostExcl: 0,
      taxRate: 0,
      updateCostPrice: true,
    });
  };

  const removeItem = (index: number) => {
    if (fields.length > 1) {
      remove(index);
      setSelectedProducts(prev => {
        const copy = { ...prev };
        delete copy[index];
        return copy;
      });
    }
  };

  const handleProductSelect = (index: number, productId: string) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      update(index, {
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        orderedQty: 1,
        unitCostExcl: product.costPrice || 0,
        taxRate: product.purchaseTaxRate || 0,
        updateCostPrice: true,
      });
      setSelectedProducts(prev => ({ ...prev, [index]: productId }));
    }
  };

  const items = form.watch("items");
  const total = items.reduce((sum, item) => {
    const computed = computeItem(item);
    return sum + computed.total;
  }, 0) + (form.watch("shippingCost") || 0) - (form.watch("discountAmount") || 0);

  return (
    <div className="p-4 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard/purchases">Purchases</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>New Purchase Order</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Package size={22} /> New Purchase Order
          </h1>
          <p className="text-muted-foreground text-sm">
            Create a new purchase order for your supplier
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            asChild
          >
            <Link href="/dashboard/purchases">
              <ArrowLeft size={14} className="mr-1.5" /> Cancel
            </Link>
          </Button>
          <Button
            onClick={form.handleSubmit(onSubmit)}
            disabled={isPending}
          >
            {isPending && <Loader2 size={14} className="mr-2 animate-spin" />}
            <Save size={14} className="mr-1.5" />
            {isPending ? "Creating..." : "Create Purchase Order"}
          </Button>
        </div>
      </div>

      <Separator />

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Supplier and Invoice Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Controller
            name="supplierId"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="supplier">
                  Supplier <span className="text-destructive">*</span>
                </FieldLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger id="supplier">
                    <SelectValue placeholder="Select supplier" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />

          <Controller
            name="invoiceNumber"
            control={form.control}
            render={({ field }) => (
              <Field>
                <FieldLabel htmlFor="invoice-number">Invoice Number</FieldLabel>
                <Input
                  {...field}
                  id="invoice-number"
                  placeholder="Supplier's invoice number"
                />
              </Field>
            )}
          />

          <Controller
            name="invoiceDate"
            control={form.control}
            render={({ field }) => (
              <Field>
                <FieldLabel htmlFor="invoice-date">Invoice Date</FieldLabel>
                <Input
                  {...field}
                  id="invoice-date"
                  type="date"
                />
              </Field>
            )}
          />

          <Controller
            name="expectedDate"
            control={form.control}
            render={({ field }) => (
              <Field>
                <FieldLabel htmlFor="expected-date">Expected Delivery Date</FieldLabel>
                <Input
                  {...field}
                  id="expected-date"
                  type="date"
                />
              </Field>
            )}
          />

          <Controller
            name="paymentMethod"
            control={form.control}
            render={({ field }) => (
              <Field>
                <FieldLabel htmlFor="payment-method">Payment Method</FieldLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger id="payment-method">
                    <SelectValue placeholder="Select method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CASH">Cash</SelectItem>
                    <SelectItem value="MPESA">M-Pesa</SelectItem>
                    <SelectItem value="CARD">Card</SelectItem>
                    <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            )}
          />
        </div>

        {/* Items Table */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Order Items</h2>
            <Button type="button" variant="outline" size="sm" onClick={addItem}>
              <Plus size={14} className="mr-1" /> Add Item
            </Button>
          </div>

          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[300px]">Product</TableHead>
                  <TableHead className="w-[120px]">SKU</TableHead>
                  <TableHead className="w-[100px]">Quantity</TableHead>
                  <TableHead className="w-[120px]">Unit Cost (Excl)</TableHead>
                  <TableHead className="w-[100px]">Tax Rate %</TableHead>
                  <TableHead className="w-[120px]">Item Total</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fields.map((field, index) => (
                  <TableRow key={field.id}>
                    <TableCell>
                      <Controller
                        name={`items.${index}.productId`}
                        control={form.control}
                        render={({ field }) => (
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className="w-full justify-start text-left font-normal"
                              >
                                {selectedProducts[index] ? (
                                  products.find(p => p.id === selectedProducts[index])?.name
                                ) : (
                                  <span className="text-muted-foreground">
                                    {form.watch(`items.${index}.productName`) || "Search product..."}
                                  </span>
                                )}
                                <Search size={14} className="ml-auto opacity-50" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[400px] p-0" align="start">
                              <Command>
                                <CommandInput placeholder="Search products..." />
                                <CommandList className="max-h-[300px]">
                                  <CommandEmpty>No products found.</CommandEmpty>
                                  <CommandGroup>
                                    {products.map((product) => (
                                      <CommandItem
                                        key={product.id}
                                        value={product.name}
                                        onSelect={() => handleProductSelect(index, product.id)}
                                      >
                                        <div className="flex flex-col">
                                          <span className="font-medium">{product.name}</span>
                                          <span className="text-xs text-muted-foreground">
                                            SKU: {product.sku}
                                          </span>
                                        </div>
                                      </CommandItem>
                                    ))}
                                  </CommandGroup>
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>
                        )}
                      />
                    </TableCell>
                    <TableCell>
                      <Controller
                        name={`items.${index}.sku`}
                        control={form.control}
                        render={({ field }) => (
                          <Input
                            {...field}
                            placeholder="SKU"
                            disabled={!!selectedProducts[index]}
                          />
                        )}
                      />
                    </TableCell>
                    <TableCell>
                      <Controller
                        name={`items.${index}.orderedQty`}
                        control={form.control}
                        render={({ field, fieldState }) => (
                          <div>
                            <Input
                              {...field}
                              type="number"
                              min="1"
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                            />
                            {fieldState.invalid && (
                              <FieldError errors={[fieldState.error]} />
                            )}
                          </div>
                        )}
                      />
                    </TableCell>
                    <TableCell>
                      <Controller
                        name={`items.${index}.unitCostExcl`}
                        control={form.control}
                        render={({ field }) => (
                          <Input
                            {...field}
                            type="number"
                            step="0.01"
                            min="0"
                            onChange={(e) => {
                const val = e.target.value;
                field.onChange(val === "" ? "" : e.target.valueAsNumber);
              }}
              onBlur={(e) => {
                if (e.target.value === "") field.onChange(0);
                field.onBlur();
              }}
                          />
                        )}
                      />
                    </TableCell>
                    <TableCell>
                      <Controller
                        name={`items.${index}.taxRate`}
                        control={form.control}
                        render={({ field }) => (
                          <Input
                            {...field}
                            type="number"
                            step="0.1"
                            min="0"
                            max="100"
                            onChange={(e) => {
                              const val = e.target.value;
                              field.onChange(val === "" ? "" : e.target.valueAsNumber);
                            }}
                            onBlur={(e) => {
                              if (e.target.value === "") field.onChange(0);
                              field.onBlur();
                            }}
                          />
                        )}
                      />
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        KES {computeItem(items[index]).total.toFixed(2)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {fields.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeItem(index)}
                        >
                          <Trash2 size={14} className="text-destructive" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Additional Details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Controller
            name="discountAmount"
            control={form.control}
            render={({ field }) => (
              <Field>
                <FieldLabel htmlFor="discount">Discount Amount</FieldLabel>
                <Input
                  {...field}
                  id="discount"
                  type="number"
                  step="0.01"
                  min="0"
                  onChange={(e) => {
                const val = e.target.value;
                field.onChange(val === "" ? "" : e.target.valueAsNumber);
              }}
              onBlur={(e) => {
                if (e.target.value === "") field.onChange(0);
                field.onBlur();
              }}
                />
              </Field>
            )}
          />

          <Controller
            name="shippingCost"
            control={form.control}
            render={({ field }) => (
              <Field>
                <FieldLabel htmlFor="shipping">Shipping Cost</FieldLabel>
                <Input
                  {...field}
                  id="shipping"
                  type="number"
                  step="0.01"
                  min="0"
                  onChange={(e) => {
                    const val = e.target.value;
                    field.onChange(val === "" ? "" : e.target.valueAsNumber);
                  }}
                  onBlur={(e) => {
                    if (e.target.value === "") field.onChange(0);
                    field.onBlur();
                  }}
                />
              </Field>
            )}
          />

          <Controller
            name="notes"
            control={form.control}
            render={({ field }) => (
              <Field>
                <FieldLabel htmlFor="notes">Notes</FieldLabel>
                <Textarea
                  {...field}
                  id="notes"
                  placeholder="Additional notes..."
                  rows={1}
                />
              </Field>
            )}
          />
        </div>

        {/* Total */}
        <div className="flex justify-end">
          <div className="text-right space-y-1">
            <p className="text-sm text-muted-foreground">Total Amount</p>
            <p className="text-2xl font-bold">KES {total.toLocaleString()}</p>
          </div>
        </div>

        <Separator />

        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/dashboard/purchases")}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 size={14} className="mr-2 animate-spin" />}
            {isPending ? "Creating..." : "Create Purchase Order"}
          </Button>
        </div>
      </form>
    </div>
  );
}
