"use client";

import Barcode from "react-barcode";
import { cn } from "@/lib/utils";

type Props = {
  value: string;
  productName?: string;
  price?: number;
  showPrice?: boolean;
  width?: number;
  height?: number;
  className?: string;
};

export function BarcodeDisplay({
  value,
  productName,
  price,
  showPrice = false,
  width = 1.5,
  height = 50,
  className,
}: Props) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-1 p-2 border rounded-lg bg-white text-black",
        className,
      )}
    >
      {productName && (
        <p className="text-xs font-medium text-center leading-tight max-w-35 truncate">
          {productName}
        </p>
      )}
      <Barcode
        value={value}
        width={width}
        height={height}
        fontSize={11}
        margin={4}
        background="#ffffff"
        lineColor="#000000"
        displayValue
      />
      {showPrice && price !== undefined && (
        <p className="text-xs font-bold">KES {price.toLocaleString()}</p>
      )}
    </div>
  );
}
