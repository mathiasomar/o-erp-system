"use client";

import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";
import { useRef } from "react";

type Props = {
  search: string;
  onSearch: (value: string) => void;
};

export const ProductSearch = ({ search, onSearch }: Props) => {
  // const [scannerOpen, setScannerOpen] = useState(false);
  // const [isPending, startTransition] = useTransition();
  // const addItem = useCartStore((s) => s.addItem);

  // const handleBarcodeDetected = (barcode: string) => {
  //   startTransition(async () => {
  //     const { product } = await getProductByBarcode(barcode);

  //     if (!product) {
  //       toast.error(`No product found for barcode: ${barcode}`);
  //       return;
  //     }

  //     const stock = product.stock?.quantity ?? 0;
  //     if (stock === 0) {
  //       toast.error(`"${product.name}" is out of stock`);
  //       return;
  //     }

  //     addItem(product);
  //     toast.success(`Added: ${product.name}`);
  //   });
  // };

  const inputRef = useRef<HTMLInputElement>(null);

  const handleClear = () => {
    onSearch("");
    // Return focus to the input after clearing so the cashier
    // can immediately start typing the next product
    inputRef.current?.focus();
  };

  return (
    <>
      <div className="flex gap-2">
        {/* Search input */}
        <div className="relative flex-1">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2
                       text-muted-foreground pointer-events-none"
          />
          <Input
            placeholder="Search by name, SKU or scan barcode..."
            ref={inputRef}
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            className="pl-9"
          />

          {/* Clear button — only visible when search has content */}
          {search && (
            <button
              type="button"
              onClick={handleClear}
              aria-label="Clear search"
              className="absolute right-2.5 top-1/2 -translate-y-1/2
                     text-muted-foreground hover:text-foreground
                     transition-colors rounded-sm
                     focus-visible:outline-none focus-visible:ring-1
                     focus-visible:ring-ring"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Scan button */}
        {/* <Button
          variant="outline"
          size="icon"
          title="Scan barcode"
          disabled={isPending}
          onClick={() => setScannerOpen(true)}
          className="shrink-0"
        >
          <Scan size={16} />
        </Button> */}
      </div>

      {/* <BarcodeScannerDialog
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onDetected={handleBarcodeDetected}
      /> */}
    </>
  );
};
