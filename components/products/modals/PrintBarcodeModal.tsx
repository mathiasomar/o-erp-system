"use client";

import { useEffect, useRef } from "react";
import JsBarcode from "jsbarcode";
import QRCode from "qrcode";
import { useReactToPrint } from "react-to-print";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Product } from "@/types";
import { Printer } from "lucide-react";

type Props = {
  open: boolean;
  onClose: () => void;
  products: Product[];
};

// ── Shared JsBarcode config ──────────────────────────────────────────────────

const BARCODE_BASE: JsBarcode.Options = {
  format: "CODE128",
  displayValue: true,
  font: "monospace",
  textAlign: "center",
  textPosition: "bottom",
  background: "#ffffff",
  lineColor: "#000000",
};

// ── Label dimensions ─────────────────────────────────────────────────────────

const BARCODE_LABEL_W = "50mm";
const BARCODE_LABEL_H = "25mm";
const TAG_LABEL_W = "60mm";
const TAG_LABEL_H = "40mm";

// ── BarcodeSvg ───────────────────────────────────────────────────────────────

function BarcodeSvg({
  value,
  width,
  height,
  fontSize,
  textMargin,
  margin,
  style,
}: {
  value: string;
  width: number;
  height: number;
  fontSize: number;
  textMargin: number;
  margin: number;
  style?: React.CSSProperties;
}) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;
    try {
      JsBarcode(svgRef.current, value, {
        ...BARCODE_BASE,
        width,
        height,
        fontSize,
        textMargin,
        margin,
      });
    } catch {
      if (svgRef.current) {
        svgRef.current.innerHTML = `
          <text x="50%" y="50%" dominant-baseline="middle"
                text-anchor="middle" font-size="10" fill="#000">
            Invalid barcode
          </text>`;
      }
    }
  }, [value, width, height, fontSize, textMargin, margin]);

  return <svg ref={svgRef} style={{ display: "block", ...style }} />;
}

// ── QRCanvas ─────────────────────────────────────────────────────────────────
// Value encodes: "NAME | BARCODE | KES PRICE"

function QRCanvas({ product, size }: { product: Product; size: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    // Use barcode value if available, fall back to SKU
    const barcodeValue = product.barcode?.trim() || product.sku;
    const value = `${product.name} | ${barcodeValue} | KES ${product.price}`;
    QRCode.toCanvas(canvasRef.current, value, {
      width: size,
      margin: 1,
      color: { dark: "#000000", light: "#ffffff" },
    }).catch(() => {});
  }, [product.name, product.barcode, product.sku, product.price, size]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      style={{ display: "block" }}
    />
  );
}

// ── BarcodePreviewCard ────────────────────────────────────────────────────────
// Uses product.barcode — falls back to SKU only if barcode is null

function BarcodePreviewCard({ product }: { product: Product }) {
  // Prefer barcode, fall back to SKU
  const barcodeValue =
    product.barcode?.trim() || product.sku?.trim() || String(product.id);
  const hasBarcode = !!product.barcode;

  return (
    <div
      className="border rounded p-2 text-center text-xs flex flex-col
                    items-center gap-1 bg-white overflow-hidden relative"
    >
      {/* Flag if using SKU fallback */}
      {!hasBarcode && (
        <span
          className="absolute top-1 right-1 text-[9px] text-orange-500
                         bg-orange-50 border border-orange-200 rounded px-1"
        >
          SKU fallback
        </span>
      )}
      <BarcodeSvg
        value={barcodeValue}
        width={2}
        height={40}
        fontSize={10}
        textMargin={2}
        margin={2}
        style={{ width: "100%", height: "auto" }}
      />
      <span className="font-medium truncate w-full text-foreground">
        {product.name}
      </span>
      <span className="font-mono text-muted-foreground text-[10px]">
        {product.barcode ?? product.sku}
      </span>
      <span className="font-bold text-foreground">
        KES {product.price.toLocaleString()}
      </span>
    </div>
  );
}

// ── BarcodePrintSheet ─────────────────────────────────────────────────────────
// Barcode only — 50×25mm per label

function BarcodePrintSheet({ products }: { products: Product[] }) {
  return (
    <div style={{ width: BARCODE_LABEL_W, margin: 0, padding: 0 }}>
      <style>{`
        @page {
          size: ${BARCODE_LABEL_W} ${BARCODE_LABEL_H};
          margin: 0 !important;
        }
        html, body {
          width:  ${BARCODE_LABEL_W} !important;
          height: ${BARCODE_LABEL_H} !important;
          margin:  0 !important;
          padding: 0 !important;
        }
        .barcode-label {
          width:           ${BARCODE_LABEL_W};
          height:          ${BARCODE_LABEL_H};
          display:         flex;
          align-items:     center;
          justify-content: center;
          background:      #ffffff;
          page-break-after: always;
          break-after:     page;
          overflow:        hidden;
          box-sizing:      border-box;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .barcode-label svg {
          width:  90% !important;
          height: auto !important;
          display: block;
        }
      `}</style>

      {products.map((p) => {
        const barcodeValue = p.barcode?.trim() || p.sku?.trim() || String(p.id);
        return (
          <div key={p.id} className="barcode-label">
            <BarcodeSvg
              value={barcodeValue}
              width={4}
              height={80}
              fontSize={16}
              textMargin={6}
              margin={0}
            />
          </div>
        );
      })}
    </div>
  );
}

// ── TagPrintSheet ─────────────────────────────────────────────────────────────
// Name + price + QR — 60×40mm per tag

function TagPrintSheet({ products }: { products: Product[] }) {
  return (
    <div style={{ width: TAG_LABEL_W, margin: 0, padding: 0 }}>
      <style>{`
        @page {
          size: ${TAG_LABEL_W} ${TAG_LABEL_H};
          margin: 0 !important;
        }
        html, body {
          width:  ${TAG_LABEL_W} !important;
          height: ${TAG_LABEL_H} !important;
          margin:  0 !important;
          padding: 0 !important;
        }
        .tag-label {
          width:           ${TAG_LABEL_W};
          height:          ${TAG_LABEL_H};
          display:         flex;
          flex-direction:  row;
          align-items:     center;
          justify-content: space-between;
          background:      #ffffff;
          page-break-after: always;
          break-after:     page;
          overflow:        hidden;
          box-sizing:      border-box;
          padding:         3mm;
          gap:             2mm;
          -webkit-print-color-adjust: exact;
          print-color-adjust:         exact;
          border: 0.3mm solid #000;
        }
        .tag-info {
          display:        flex;
          flex-direction: column;
          justify-content: center;
          gap:            1.5mm;
          flex:           1;
          overflow:       hidden;
        }
        .tag-name {
          font-family: sans-serif;
          font-size:   8pt;
          font-weight: 700;
          color:       #000;
          word-break:  break-word;
          line-height: 1.2;
        }
        .tag-barcode {
          font-family: monospace;
          font-size:   6pt;
          color:       #333;
        }
        .tag-sku {
          font-family: monospace;
          font-size:   6pt;
          color:       #777;
        }
        .tag-price {
          font-family: sans-serif;
          font-size:   11pt;
          font-weight: 900;
          color:       #000;
          margin-top:  1mm;
        }
        .tag-qr {
          flex-shrink: 0;
          display:     flex;
          align-items: center;
          justify-content: center;
        }
        .tag-qr canvas {
          display: block;
          width:   26mm !important;
          height:  26mm !important;
        }
      `}</style>

      {products.map((p) => (
        <div key={p.id} className="tag-label">
          {/* Left: product info */}
          <div className="tag-info">
            <div className="tag-name">{p.name}</div>
            {/* Show barcode number if available */}
            {p.barcode && <div className="tag-barcode">BC: {p.barcode}</div>}
            <div className="tag-sku">SKU: {p.sku}</div>
            <div className="tag-price">KES {p.price.toLocaleString()}</div>
          </div>

          {/* Right: QR code — encodes barcode or SKU */}
          <div className="tag-qr">
            <QRCanvas product={p} size={98} />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Modal ─────────────────────────────────────────────────────────────────────

export function PrintBarcodesModal({ open, onClose, products }: Props) {
  const barcodeRef = useRef<HTMLDivElement>(null);
  const tagRef = useRef<HTMLDivElement>(null);

  const withBarcode = products.filter((p) => p.barcode);
  const withoutBarcode = products.filter((p) => !p.barcode);

  const handlePrintBarcodes = useReactToPrint({
    contentRef: barcodeRef,
    documentTitle: "Barcodes",
    pageStyle: `
      @page {
        size: ${BARCODE_LABEL_W} ${BARCODE_LABEL_H};
        margin: 0 !important;
      }
      html, body {
        width:  ${BARCODE_LABEL_W} !important;
        height: ${BARCODE_LABEL_H} !important;
        margin:  0 !important;
        padding: 0 !important;
      }
    `,
  });

  const handlePrintTags = useReactToPrint({
    contentRef: tagRef,
    documentTitle: "Product Tags",
    pageStyle: `
      @page {
        size: ${TAG_LABEL_W} ${TAG_LABEL_H};
        margin: 0 !important;
      }
      html, body {
        width:  ${TAG_LABEL_W} !important;
        height: ${TAG_LABEL_H} !important;
        margin:  0 !important;
        padding: 0 !important;
      }
    `,
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Printer size={18} /> Print Barcodes &amp; Tags
          </DialogTitle>
          <DialogDescription>
            Generate printable barcodes and product tags for selected items.
            Barcode values are used where available — SKU is the fallback.
          </DialogDescription>
        </DialogHeader>

        {/* ── Warning — products without barcode ───────────────────────── */}
        {withoutBarcode.length > 0 && products.length > 0 && (
          <div
            className="flex items-start gap-2 p-3 rounded-lg border
                          border-orange-200 bg-orange-50
                          dark:bg-orange-950/20 dark:border-orange-800
                          text-sm"
          >
            <span className="text-orange-600 shrink-0 mt-0.5">⚠</span>
            <div className="space-y-1">
              <p className="text-orange-700 dark:text-orange-400">
                <span className="font-semibold">
                  {withoutBarcode.length} product
                  {withoutBarcode.length !== 1 ? "s" : ""}
                </span>{" "}
                {withoutBarcode.length !== 1 ? "have" : "has"} no barcode —
                their <span className="font-medium">SKU</span> will be used as
                the barcode value instead.
              </p>
              <div className="flex flex-wrap gap-1">
                {withoutBarcode.map((p) => (
                  <Badge
                    key={p.id}
                    variant="outline"
                    className="text-[10px] border-orange-300 text-orange-600"
                  >
                    {p.name}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Preview grid ─────────────────────────────────────────────── */}
        <div className="max-h-80 overflow-y-auto space-y-2 py-2">
          {products.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              No products selected. Select products from the table first.
            </p>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {products.map((p) => (
                <BarcodePreviewCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </div>

        {/* ── Summary badges ────────────────────────────────────────────── */}
        {products.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="secondary">
              {products.length} product{products.length !== 1 ? "s" : ""}{" "}
              selected
            </Badge>
            {withBarcode.length > 0 && (
              <Badge variant="default">{withBarcode.length} with barcode</Badge>
            )}
            {withoutBarcode.length > 0 && (
              <Badge
                variant="outline"
                className="border-orange-300 text-orange-600"
              >
                {withoutBarcode.length} using SKU fallback
              </Badge>
            )}
          </div>
        )}

        {/* ── Off-screen print sheets ───────────────────────────────────── */}
        <div style={{ position: "absolute", left: "-9999px", top: 0 }}>
          <div ref={barcodeRef}>
            <BarcodePrintSheet products={products} />
          </div>
          <div ref={tagRef}>
            <TagPrintSheet products={products} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button
            variant="outline"
            onClick={() => handlePrintTags()}
            disabled={products.length === 0}
          >
            Print Tags
          </Button>
          <Button
            onClick={() => handlePrintBarcodes()}
            disabled={products.length === 0}
          >
            Print Barcodes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
