"use client";

import {
  useState,
  useRef,
  useCallback,
  useTransition,
  type ChangeEvent,
  type DragEvent,
} from "react";
import Papa, { type ParseResult as PapaParseResult } from "papaparse";
import * as XLSX from "xlsx";
import {
  importProducts,
  validateImportRows,
  type ImportRow,
  type ImportResult,
} from "@/actions/import.action";
import { useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Upload,
  FileSpreadsheet,
  FileJson,
  Download,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Loader2,
  Plus,
  Trash2,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Input } from "../ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";

type Step = "upload" | "preview" | "importing" | "done";

type EditableRow = ImportRow & {
  _id: string; // local key for React list
  _hasError: boolean; // validation error flag
  _errors: string[]; // per-row error messages
};

type Props = {
  open: boolean;
  onClose: () => void;
};

const STATUS_CONFIG = {
  created: {
    label: "Created",
    color: "text-green-600",
    bg: "bg-green-50 dark:bg-green-950/20",
    icon: CheckCircle2,
  },
  updated: {
    label: "Updated",
    color: "text-blue-600",
    bg: "bg-blue-50 dark:bg-blue-950/20",
    icon: CheckCircle2,
  },
  skipped: {
    label: "Skipped",
    color: "text-muted-foreground",
    bg: "bg-muted/50",
    icon: AlertTriangle,
  },
  error: {
    label: "Error",
    color: "text-destructive",
    bg: "bg-destructive/5",
    icon: XCircle,
  },
};

// Cell style shared across all editable inputs
const CELL_INPUT = cn(
  "h-7 px-1.5 text-xs rounded-md border-0 ring-0",
  "bg-transparent hover:bg-muted/60 focus:bg-background",
  "focus:ring-1 focus:ring-primary/50 transition-colors w-full",
  "placeholder:text-muted-foreground/40",
);

// ── Helpers ───────────────────────────────────────────────────────────────────

let _idCounter = 0;
const uid = () =>
  `row-${++_idCounter}-${Math.random().toString(36).slice(2, 6)}`;

const rowsToEditable = (rows: ImportRow[]): EditableRow[] =>
  rows.map((r) => ({
    ...r,
    _id: uid(),
    _hasError: false,
    _errors: [],
  }));

const stripEditableFields = (row: EditableRow): ImportRow => {
  const { _id, _hasError, _errors, ...rest } = row;
  void _id;
  void _hasError;
  void _errors;
  return rest;
};

const normalizeInputValue = (value: unknown): string | number =>
  value === undefined || value === null ? "" : (value as string | number);

export function ImportProductsDialog({ open, onClose }: Props) {
  const qc = useQueryClient();
  const [step, setStep] = useState<Step>("upload");
  const [rows, setRows] = useState<EditableRow[]>([]);
  const [fileName, setFileName] = useState("");
  const [strategy, setStrategy] = useState<"skip" | "update">("update");
  const [result, setResult] = useState<ImportResult | null>(null);
  const [showErrors, setShowErrors] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [progress, setProgress] = useState(0);
  const [validating, setValidating] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const errorRows = rows.filter((r) => r._hasError);
  const validRows = rows.filter((r) => !r._hasError);
  const totalErrors = errorRows.length;

  // ── Validate rows and attach error flags ──────────────────────────────────

  const revalidate = useCallback(async (current: EditableRow[]) => {
    setValidating(true);
    const issues = await validateImportRows(current.map(stripEditableFields));
    const issueMap = new Map(issues.map((i) => [i.rowIndex, i.errors]));

    setRows(
      current.map((r, i) => ({
        ...r,
        _hasError: issueMap.has(i),
        _errors: issueMap.get(i) ?? [],
      })),
    );
    setValidating(false);
  }, []);

  // ── Preview helper ──────────────────────────────────────────────────────

  const preview = useCallback(async (data: ImportRow[]) => {
    if (data.length === 0) {
      toast.error("File is empty or has no valid rows");
      return;
    }
    if (data.length > 2000) {
      toast.error("Maximum 2,000 rows per import. Split your file.");
      return;
    }

    const issues = await validateImportRows(data);
    const issueMap = new Map(issues.map((i) => [i.rowIndex, i.errors]));
    setRows(
      rowsToEditable(data).map((r, idx) => ({
        ...r,
        _hasError: issueMap.has(idx),
        _errors: issueMap.get(idx) ?? [],
      })),
    );
    setStep("preview");
  }, []);

  // ── Parse file ────────────────────────────────────────────────────────────

  const parseFile = useCallback(
    async (file: File) => {
      setFileName(file.name);
      const ext = file.name.split(".").pop()?.toLowerCase();

      if (ext === "csv") {
        Papa.parse<Record<string, string>>(file, {
          header: true,
          skipEmptyLines: true,
          transformHeader: (h: string) => h.trim(),
          complete: async (res: PapaParseResult<Record<string, string>>) => {
            const parsed = res.data as ImportRow[];
            await preview(parsed);
          },
          error: (err: { message: string }) => {
            toast.error(`CSV parse error: ${err.message}`);
          },
        });
      } else if (ext === "xlsx" || ext === "xls") {
        const buf = await file.arrayBuffer();
        const wb = XLSX.read(buf, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, {
          defval: "",
        }) as ImportRow[];
        await preview(data);
      } else if (ext === "json") {
        const text = await file.text();
        try {
          const data = JSON.parse(text) as ImportRow[];
          if (!Array.isArray(data)) {
            toast.error("JSON must be an array of product objects");
            return;
          }
          await preview(data);
        } catch {
          toast.error("Invalid JSON file");
        }
      } else {
        toast.error("Unsupported file type. Use CSV, XLSX, or JSON.");
      }
    },
    [preview],
  );

  // ── Drag and drop ─────────────────────────────────────────────────────────

  const onDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) parseFile(file);
    },
    [parseFile],
  );

  const onFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) parseFile(file);
    e.target.value = "";
  };

  // ── Row editing ───────────────────────────────────────────────────────────

  const updateCell = useCallback(
    (id: string, field: keyof ImportRow, value: string | number | boolean) => {
      setRows((prev) =>
        prev.map((r) => (r._id === id ? { ...r, [field]: value } : r)),
      );
    },
    [],
  );

  // Re-validate on blur (not on every keystroke — avoids re-render spam)
  const handleBlur = useCallback(async () => {
    await revalidate(rows);
  }, [revalidate, rows]);

  const deleteRow = useCallback((id: string) => {
    setRows((prev) => prev.filter((r) => r._id !== id));
  }, []);

  const addBlankRow = () => {
    const blank: EditableRow = {
      _id: uid(),
      _hasError: false,
      _errors: [],
      name: "",
      sku: "",
      barcode: "",
      price: 0,
      lastPrice: 0,
      costPrice: 0,
      category: "",
      quantity: 0,
      lowStockAt: 10,
      isActive: true,
      discountRate: 0,
      taxRate: 0,
      imageUrl: "",
    };
    setRows((prev) => [...prev, blank]);
  };

  // ── Run import ────────────────────────────────────────────────────────────

  const handleImport = () => {
    startTransition(async () => {
      setStep("importing");
      setProgress(0);

      // Simulate progress ticks while import runs
      const interval = setInterval(() => {
        setProgress((p) => Math.min(p + Math.random() * 12, 85));
      }, 300);

      const res = await importProducts(rows, strategy);

      clearInterval(interval);
      setProgress(100);

      setResult(res);
      setStep("done");

      qc.invalidateQueries({ queryKey: ["products-all"] });
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["categories"] });
      qc.invalidateQueries({ queryKey: ["inventory"] });

      if (res.errors === 0) {
        toast.success(
          `Import complete — ${res.created} created, ${res.updated} updated`,
        );
      } else {
        toast.warning(
          `Import done with ${res.errors} error${res.errors !== 1 ? "s" : ""}`,
        );
      }
    });
  };

  // ── Reset ─────────────────────────────────────────────────────────────────

  const handleReset = () => {
    setStep("upload");
    setRows([]);
    setFileName("");
    setResult(null);
    setShowErrors(false);
    setProgress(0);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  // ── Download template ─────────────────────────────────────────────────────

  const downloadTemplate = () => {
    window.open("/api/products/import-template", "_blank");
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col gap-0 p-0">
        <DialogHeader className="px-6 pt-6 pb-4 shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet size={18} className="text-primary" />
            Import Products
          </DialogTitle>
          <DialogDescription>
            Import from CSV, Excel (.xlsx), or JSON. Up to 2,000 rows per batch.
          </DialogDescription>
        </DialogHeader>

        <Separator />

        <div className="flex-1 min-h-0 px-6 py-5 flex flex-col">
          {/* ── Step: Upload ──────────────────────────────────────────── */}
          {step === "upload" && (
            <div className="space-y-4">
              {/* Download template */}
              <div
                className="flex items-center justify-between
                                rounded-lg border bg-muted/30 px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium">Download template</p>
                  <p className="text-xs text-muted-foreground">
                    Start with our CSV template for correct column names
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={downloadTemplate}>
                  <Download size={13} className="mr-1.5" />
                  Template
                </Button>
              </div>

              {/* Drop zone */}
              <div
                ref={dropRef}
                onDrop={onDrop}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => fileRef.current?.click()}
                className="flex flex-col items-center justify-center
                             rounded-xl border-2 border-dashed border-border
                             hover:border-primary/50 hover:bg-muted/30
                             cursor-pointer transition-colors py-12 gap-3"
              >
                <div className="p-3 rounded-full bg-muted">
                  <Upload size={24} className="text-muted-foreground" />
                </div>
                <div className="text-center">
                  <p className="font-medium text-sm">
                    Drop your file here or click to browse
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Supports CSV, XLSX, XLS, JSON
                  </p>
                </div>

                {/* Format badges */}
                <div className="flex gap-2 mt-1">
                  {[
                    { icon: FileSpreadsheet, label: "CSV" },
                    { icon: FileSpreadsheet, label: "XLSX" },
                    { icon: FileJson, label: "JSON" },
                  ].map(({ icon: Icon, label }) => (
                    <Badge key={label} variant="outline" className="gap-1">
                      <Icon size={10} />
                      {label}
                    </Badge>
                  ))}
                </div>
              </div>

              <input
                ref={fileRef}
                type="file"
                className="hidden"
                accept=".csv,.xlsx,.xls,.json"
                onChange={onFileChange}
              />

              {/* Column reference */}
              <div className="rounded-lg border bg-muted/20 p-4 space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Expected columns
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                  {[
                    { col: "name", req: true, desc: "Product name" },
                    { col: "sku", req: true, desc: "Unique code" },
                    { col: "price", req: true, desc: "Selling price" },
                    {
                      col: "lastPrice",
                      req: false,
                      desc: "Min/bargain price",
                    },
                    { col: "costPrice", req: false, desc: "Cost price" },
                    { col: "category", req: false, desc: "Category name" },
                    { col: "quantity", req: false, desc: "Stock quantity" },
                    {
                      col: "lowStockAt",
                      req: false,
                      desc: "Alert threshold",
                    },
                    { col: "barcode", req: false, desc: "Barcode" },
                    { col: "isActive", req: false, desc: "true/false" },
                    { col: "discountRate", req: false, desc: "Discount %" },
                    { col: "taxRate", req: false, desc: "Tax %" },
                  ].map(({ col, req }) => (
                    <div key={col} className="flex items-start gap-1.5 text-xs">
                      <span
                        className={cn(
                          "font-mono font-medium shrink-0",
                          req ? "text-foreground" : "text-muted-foreground",
                        )}
                      >
                        {col}
                      </span>
                      {req && (
                        <span className="text-destructive shrink-0">*</span>
                      )}
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-muted-foreground">
                  <span className="text-destructive">*</span> required
                </p>
              </div>
            </div>
          )}

          {/* ── Step: Preview (editable) ──────────────────────────────── */}
          {step === "preview" && (
            <div className="flex flex-col flex-1 min-h-0">
              {/* Toolbar */}
              <div
                className="px-6 py-3 shrink-0 flex items-center
                              justify-between gap-3 flex-wrap border-b
                              bg-muted/20"
              >
                <div className="flex items-center gap-3 flex-wrap">
                  {/* File name + count */}
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet
                      size={15}
                      className="text-primary shrink-0"
                    />
                    <span className="text-sm font-medium truncate max-w-48">
                      {fileName}
                    </span>
                    <Badge variant="secondary" className="text-[10px]">
                      {rows.length} row{rows.length !== 1 ? "s" : ""}
                    </Badge>
                  </div>

                  {/* Error count */}
                  {totalErrors > 0 && (
                    <button
                      onClick={() => setShowErrors((v) => !v)}
                      className="flex items-center gap-1.5 text-xs
                                 text-destructive hover:text-destructive/80
                                 transition-colors"
                    >
                      <AlertTriangle size={12} />
                      {totalErrors} error{totalErrors !== 1 ? "s" : ""} — click
                      to
                      {showErrors ? " hide" : " show"}
                      {showErrors ? (
                        <ChevronUp size={12} />
                      ) : (
                        <ChevronDown size={12} />
                      )}
                    </button>
                  )}

                  {validating && (
                    <span
                      className="flex items-center gap-1 text-xs
                                     text-muted-foreground"
                    >
                      <Loader2 size={11} className="animate-spin" />
                      Validating…
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {/* Duplicate strategy */}
                  <Select
                    value={strategy}
                    onValueChange={(v) => setStrategy(v as "skip" | "update")}
                  >
                    <SelectTrigger className="h-8 text-xs w-52">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="update">
                        Update when SKU exists
                      </SelectItem>
                      <SelectItem value="skip">Skip when SKU exists</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Add blank row */}
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs"
                    onClick={addBlankRow}
                  >
                    <Plus size={13} className="mr-1" />
                    Add row
                  </Button>

                  {/* Change file */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 text-xs text-muted-foreground"
                    onClick={handleReset}
                  >
                    Change file
                  </Button>
                </div>
              </div>

              {/* Error details panel */}
              {showErrors && totalErrors > 0 && (
                <div
                  className="px-6 py-2 bg-destructive/5 border-b
                                border-destructive/20 shrink-0 max-h-32
                                overflow-y-auto"
                >
                  {errorRows.map((r) => (
                    <div key={r._id} className="flex gap-2 text-xs py-0.5">
                      <span className="font-medium text-destructive shrink-0">
                        {r.name || "(blank name)"}:
                      </span>
                      <span className="text-muted-foreground">
                        {r._errors.join(" · ")}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Editable table */}
              <ScrollArea className="flex-1 min-h-0 w-full max-h-[56vh] overflow-y-auto">
                <div className="min-w-max">
                  <table className="text-xs border-collapse min-w-max">
                    <thead className="sticky top-0 z-10 bg-muted/90 backdrop-blur-sm">
                      <tr>
                        {/* Status indicator */}
                        <th className="w-6 px-2 py-2.5" />

                        {[
                          { key: "name", label: "Name *", w: "160px" },
                          { key: "sku", label: "SKU", w: "110px" },
                          { key: "price", label: "Price", w: "80px" },
                          { key: "lastPrice", label: "Min Price", w: "80px" },
                          { key: "costPrice", label: "Cost", w: "80px" },
                          { key: "category", label: "Category", w: "110px" },
                          { key: "quantity", label: "Qty", w: "60px" },
                          { key: "lowStockAt", label: "Alert", w: "60px" },
                          { key: "barcode", label: "Barcode", w: "110px" },
                          { key: "isActive", label: "Active", w: "70px" },
                          { key: "discountRate", label: "Disc %", w: "60px" },
                          { key: "taxRate", label: "Tax %", w: "60px" },
                        ].map(({ key, label, w }) => (
                          <th
                            key={key}
                            style={{ minWidth: w }}
                            className="px-2 py-2.5 text-left font-semibold
                                     text-muted-foreground whitespace-nowrap
                                     border-b border-border/60"
                          >
                            {label}
                          </th>
                        ))}

                        {/* Delete column */}
                        <th className="w-8 px-2 py-2.5 border-b border-border/60" />
                      </tr>
                    </thead>

                    <tbody>
                      {rows.length === 0 && (
                        <tr>
                          <td
                            colSpan={14}
                            className="px-4 py-10 text-center
                                     text-muted-foreground text-sm"
                          >
                            No rows — click Add row to add products manually
                          </td>
                        </tr>
                      )}

                      {rows.map((row) => (
                        <tr
                          key={row._id}
                          className={cn(
                            "group border-b border-border/30",
                            "hover:bg-muted/20 transition-colors",
                            row._hasError &&
                              "bg-destructive/5 hover:bg-destructive/8",
                          )}
                        >
                          {/* Row status dot */}
                          <td className="px-2 py-1 text-center">
                            {row._hasError ? (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="inline-flex items-center">
                                    <AlertTriangle
                                      size={12}
                                      className="text-destructive"
                                    />
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent className="max-w-60 text-xs">
                                  {row._errors.join("; ")}
                                </TooltipContent>
                              </Tooltip>
                            ) : (
                              <span
                                className="inline-block w-1.5 h-1.5
                                             rounded-full bg-green-500
                                             opacity-60 mt-0.5"
                              />
                            )}
                          </td>

                          {/* Name */}
                          <td className="px-1 py-1">
                            <Input
                              value={String(row.name ?? "")}
                              onChange={(e) =>
                                updateCell(row._id, "name", e.target.value)
                              }
                              onBlur={handleBlur}
                              placeholder="Product name"
                              className={cn(
                                CELL_INPUT,
                                row._hasError &&
                                  row._errors.some((e) => e.includes("name")) &&
                                  "ring-1 ring-destructive/50",
                              )}
                            />
                          </td>

                          {/* SKU */}
                          <td className="px-1 py-1">
                            <Input
                              value={String(row.sku ?? "")}
                              onChange={(e) =>
                                updateCell(row._id, "sku", e.target.value)
                              }
                              onBlur={handleBlur}
                              placeholder="Auto-generate"
                              className={cn(CELL_INPUT, "font-mono")}
                            />
                          </td>

                          {/* Price */}
                          <td className="px-1 py-1">
                            <Input
                              type="number"
                              min={0}
                              step="0.01"
                              value={normalizeInputValue(row.price)}
                              onChange={(e) =>
                                updateCell(
                                  row._id,
                                  "price",
                                  parseFloat(e.target.value) || 0,
                                )
                              }
                              onBlur={handleBlur}
                              placeholder="0"
                              className={cn(
                                CELL_INPUT,
                                "text-left",
                                row._hasError &&
                                  row._errors.some((e) =>
                                    e.includes("price"),
                                  ) &&
                                  "ring-1 ring-destructive/50",
                              )}
                            />
                          </td>

                          {/* Last price */}
                          <td className="px-1 py-1">
                            <Input
                              type="number"
                              min={0}
                              step="0.01"
                              value={normalizeInputValue(row.lastPrice)}
                              onChange={(e) =>
                                updateCell(
                                  row._id,
                                  "lastPrice",
                                  parseFloat(e.target.value) || 0,
                                )
                              }
                              onBlur={handleBlur}
                              placeholder="0"
                              className={cn(
                                CELL_INPUT,
                                "text-left text-orange-600",
                              )}
                            />
                          </td>

                          {/* Cost price */}
                          <td className="px-1 py-1">
                            <Input
                              type="number"
                              min={0}
                              step="0.01"
                              value={normalizeInputValue(row.costPrice)}
                              onChange={(e) =>
                                updateCell(
                                  row._id,
                                  "costPrice",
                                  parseFloat(e.target.value) || 0,
                                )
                              }
                              onBlur={handleBlur}
                              placeholder="0"
                              className={cn(CELL_INPUT, "text-left")}
                            />
                          </td>

                          {/* Category */}
                          <td className="px-1 py-1">
                            <Input
                              value={String(row.category ?? "")}
                              onChange={(e) =>
                                updateCell(row._id, "category", e.target.value)
                              }
                              onBlur={handleBlur}
                              placeholder="Category"
                              className={CELL_INPUT}
                            />
                          </td>

                          {/* Quantity */}
                          <td className="px-1 py-1">
                            <Input
                              type="number"
                              min={0}
                              value={normalizeInputValue(row.quantity)}
                              onChange={(e) =>
                                updateCell(
                                  row._id,
                                  "quantity",
                                  parseInt(e.target.value) || 0,
                                )
                              }
                              onBlur={handleBlur}
                              placeholder="0"
                              className={cn(CELL_INPUT, "text-center")}
                            />
                          </td>

                          {/* Low stock at */}
                          <td className="px-1 py-1">
                            <Input
                              type="number"
                              min={0}
                              value={normalizeInputValue(row.lowStockAt)}
                              onChange={(e) =>
                                updateCell(
                                  row._id,
                                  "lowStockAt",
                                  parseInt(e.target.value) || 10,
                                )
                              }
                              onBlur={handleBlur}
                              placeholder="10"
                              className={cn(CELL_INPUT, "text-center")}
                            />
                          </td>

                          {/* Barcode */}
                          <td className="px-1 py-1">
                            <Input
                              value={String(row.barcode ?? "")}
                              onChange={(e) =>
                                updateCell(row._id, "barcode", e.target.value)
                              }
                              onBlur={handleBlur}
                              placeholder="Auto-generate"
                              className={cn(CELL_INPUT, "font-mono")}
                            />
                          </td>

                          {/* isActive */}
                          <td className="px-1 py-1">
                            <Select
                              value={
                                String(row.isActive) === "false" ||
                                String(row.isActive) === "0" ||
                                String(row.isActive) === "no"
                                  ? "false"
                                  : "true"
                              }
                              onValueChange={(v) =>
                                updateCell(row._id, "isActive", v === "true")
                              }
                            >
                              <SelectTrigger
                                className="h-7 text-xs border-0 bg-transparent
                                         hover:bg-muted/60 focus:ring-1
                                         focus:ring-primary/50"
                              >
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="true">Active</SelectItem>
                                <SelectItem value="false">Inactive</SelectItem>
                              </SelectContent>
                            </Select>
                          </td>

                          {/* Discount rate */}
                          <td className="px-1 py-1">
                            <Input
                              type="number"
                              min={0}
                              max={100}
                              value={normalizeInputValue(row.discountRate)}
                              onChange={(e) =>
                                updateCell(
                                  row._id,
                                  "discountRate",
                                  parseFloat(e.target.value) || 0,
                                )
                              }
                              onBlur={handleBlur}
                              placeholder="0"
                              className={cn(CELL_INPUT, "text-center")}
                            />
                          </td>

                          {/* Tax rate */}
                          <td className="px-1 py-1">
                            <Input
                              type="number"
                              min={0}
                              max={100}
                              value={normalizeInputValue(row.taxRate)}
                              onChange={(e) =>
                                updateCell(
                                  row._id,
                                  "taxRate",
                                  parseFloat(e.target.value) || 0,
                                )
                              }
                              onBlur={handleBlur}
                              placeholder="0"
                              className={cn(CELL_INPUT, "text-center")}
                            />
                          </td>

                          {/* Delete row */}
                          <td className="px-2 py-1">
                            <button
                              type="button"
                              onClick={() => deleteRow(row._id)}
                              className="opacity-0 group-hover:opacity-100
                                       text-muted-foreground hover:text-destructive
                                       transition-all duration-150"
                              title="Remove row"
                            >
                              <Trash2 size={13} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <ScrollBar orientation="horizontal" />
              </ScrollArea>

              {/* Table footer — summary row */}
              <div
                className="shrink-0 border-t bg-muted/30 px-6 py-2
                              flex items-center justify-between text-xs
                              text-muted-foreground"
              >
                <div className="flex items-center gap-4">
                  <span>
                    <span className="font-medium text-green-600">
                      {validRows.length}
                    </span>{" "}
                    valid
                  </span>
                  {totalErrors > 0 && (
                    <span>
                      <span className="font-medium text-destructive">
                        {totalErrors}
                      </span>{" "}
                      with errors (will be skipped)
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <Info size={11} />
                  Click any cell to edit · Hover row to delete
                </div>
              </div>
            </div>
          )}

          {/* ── Step: Importing ───────────────────────────────────────── */}
          {step === "importing" && (
            <div
              className="flex flex-col items-center justify-center
                              py-12 gap-5"
            >
              <div className="relative">
                <FileSpreadsheet
                  size={40}
                  className="text-muted-foreground/30"
                />
                <Loader2
                  size={18}
                  className="animate-spin text-primary absolute
                               -top-1 -right-1"
                />
              </div>
              <div className="w-full max-w-xs space-y-2">
                <div
                  className="flex justify-between text-xs
                                  text-muted-foreground"
                >
                  <span>Importing {rows.length} products…</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
              <p className="text-xs text-muted-foreground">
                Please wait — do not close this window
              </p>
            </div>
          )}

          {/* ── Step: Done ────────────────────────────────────────────── */}
          {step === "done" && result && (
            <div className="space-y-4">
              {/* Summary cards */}
              <div className="grid grid-cols-4 gap-3">
                {[
                  { label: "Total", value: result.total, color: "" },
                  {
                    label: "Created",
                    value: result.created,
                    color: "text-green-600",
                  },
                  {
                    label: "Updated",
                    value: result.updated,
                    color: "text-blue-600",
                  },
                  {
                    label: "Errors",
                    value: result.errors,
                    color:
                      result.errors > 0
                        ? "text-destructive"
                        : "text-muted-foreground",
                  },
                ].map((s) => (
                  <div
                    key={s.label}
                    className="rounded-lg border bg-muted/30 p-3 text-center"
                  >
                    <p className={cn("text-2xl font-bold", s.color)}>
                      {s.value}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {s.label}
                    </p>
                  </div>
                ))}
              </div>

              {/* Per-row results */}
              <div className="rounded-lg border overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-muted/50">
                    <tr>
                      {["#", "Product", "SKU", "Status", "Note"].map((h) => (
                        <th
                          key={h}
                          className="px-3 py-2 text-left font-medium
                                       text-muted-foreground"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {result.rows.map((r) => {
                      const sc = STATUS_CONFIG[r.status];
                      const Icon = sc.icon;
                      return (
                        <tr key={r.row} className={cn("border-t", sc.bg)}>
                          <td className="px-3 py-2 font-mono text-muted-foreground">
                            {r.row}
                          </td>
                          <td className="px-3 py-2 font-medium max-w-28 truncate">
                            {r.name}
                          </td>
                          <td className="px-3 py-2 font-mono text-muted-foreground">
                            {r.sku}
                          </td>
                          <td className="px-3 py-2">
                            <span
                              className={cn(
                                "flex items-center gap-1 font-medium",
                                sc.color,
                              )}
                            >
                              <Icon size={11} />
                              {sc.label}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-muted-foreground">
                            {r.message}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <Separator />

        {/* ── Footer buttons ──────────────────────────────────────────── */}
        <div className="px-6 py-4 flex gap-3 shrink-0">
          {step === "upload" && (
            <Button variant="outline" className="flex-1" onClick={handleClose}>
              Cancel
            </Button>
          )}

          {step === "preview" && (
            <>
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleReset}
              >
                Back
              </Button>
              <Button
                className="flex-1"
                disabled={isPending}
                onClick={handleImport}
              >
                {isPending ? (
                  <>
                    <Loader2 size={14} className="mr-1.5 animate-spin" />
                    Importing…
                  </>
                ) : (
                  `Import ${rows.length} product${rows.length !== 1 ? "s" : ""}`
                )}
              </Button>
            </>
          )}

          {step === "done" && (
            <>
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleReset}
              >
                <RefreshCw size={13} className="mr-1.5" />
                Import more
              </Button>
              <Button className="flex-1" onClick={handleClose}>
                Done
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
