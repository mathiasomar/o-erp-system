import { Product } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Tag,
  Barcode,
  Package,
  DollarSign,
  Layers,
  ToggleLeft,
  ImageIcon,
} from "lucide-react";
import Link from "next/link";
import { BarcodeDisplay } from "@/components/BarcodeDisplay";

type Props = {
  product: Product;
};

const DetailRow = ({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
}) => {
  return (
    <div className="flex items-center justify-between py-2.5">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Icon size={15} />
        {label}
      </div>
      <div className="text-sm font-medium">{value}</div>
    </div>
  );
};

export const ProductDetails = ({ product }: Props) => {
  const stockQty = product.stock?.quantity ?? 0;
  const lowAt = product.stock?.lowStockAt ?? 10;
  const isLow = stockQty > 0 && stockQty <= lowAt;
  const isEmpty = stockQty === 0;

  const margin =
    product.costPrice > 0 && product.price > 0
      ? (((product.price - product.costPrice) / product.price) * 100).toFixed(1)
      : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Product Details</CardTitle>
      </CardHeader>
      <CardContent className="divide-y px-6">
        <DetailRow
          icon={Tag}
          label="SKU"
          value={
            <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded">
              {product.sku}
            </span>
          }
        />

        {product.barcode && (
          <>
            <DetailRow
              icon={Barcode}
              label="Barcode"
              value={
                <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded">
                  {product.barcode}
                </span>
              }
            />
            {/* Barcode image preview */}
            <div className="py-3 flex justify-center">
              <BarcodeDisplay
                value={product.barcode}
                productName={product.name}
                price={product.price}
                showPrice
                width={1.2}
                height={45}
              />
            </div>
          </>
        )}

        <DetailRow
          icon={Layers}
          label="Category"
          value={
            product.category ? (
              <Badge
                style={{ backgroundColor: product.category.color ?? "#6b7280" }}
                className="text-white"
              >
                {product.category.name}
              </Badge>
            ) : (
              <span className="text-muted-foreground text-xs">
                Uncategorised
              </span>
            )
          }
        />

        <Separator className="my-1" />

        <DetailRow
          icon={DollarSign}
          label="Selling Price"
          value={
            <span className="font-semibold">
              KES {product.price.toLocaleString()}
            </span>
          }
        />

        <DetailRow
          icon={DollarSign}
          label="Last Price"
          value={
            <span className="font-semibold">
              KES {product.lastPrice.toLocaleString()}
            </span>
          }
        />

        <DetailRow
          icon={DollarSign}
          label="Cost Price"
          value={
            product.costPrice > 0 ? (
              `KES ${product.costPrice.toLocaleString()}`
            ) : (
              <span className="text-muted-foreground text-xs">—</span>
            )
          }
        />

        {margin && (
          <DetailRow
            icon={DollarSign}
            label="Gross Margin"
            value={
              <span
                className={
                  parseFloat(margin) < 0 ? "text-destructive" : "text-green-600"
                }
              >
                {margin}%
              </span>
            }
          />
        )}

        {(product.discountRate ?? 0) > 0 && (
          <DetailRow
            icon={Tag}
            label="Discount"
            value={
              <Badge
                variant="outline"
                className="text-orange-600 border-orange-300"
              >
                {product.discountRate}% off
              </Badge>
            }
          />
        )}

        {(product.taxRate ?? 0) > 0 && (
          <DetailRow
            icon={Tag}
            label="Tax Rate"
            value={`${product.taxRate}%`}
          />
        )}

        <Separator className="my-1" />

        <DetailRow
          icon={Package}
          label="Current Stock"
          value={
            <Badge
              variant={
                isEmpty ? "destructive" : isLow ? "outline" : "secondary"
              }
              className={
                isLow && !isEmpty ? "border-orange-400 text-orange-600" : ""
              }
            >
              {isEmpty ? "Out of stock" : `${stockQty} units`}
            </Badge>
          }
        />

        <DetailRow
          icon={Package}
          label="Low Stock Alert"
          value={
            <span className="text-muted-foreground text-xs">
              Triggers at ≤ {lowAt} units
            </span>
          }
        />

        <DetailRow
          icon={ToggleLeft}
          label="Status"
          value={
            <Badge variant={product.isActive ? "default" : "secondary"}>
              {product.isActive ? "Active" : "Inactive"}
            </Badge>
          }
        />

        {product.imageUrl && (
          <DetailRow
            icon={ImageIcon}
            label="Image"
            value={
              <Link
                href={product.imageUrl}
                target="_blank"
                rel="noreferrer"
                className="text-primary underline text-xs"
              >
                View image ↗
              </Link>
            }
          />
        )}
      </CardContent>
    </Card>
  );
};
