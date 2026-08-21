"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { generateMpesaStatementPDF } from "@/lib/mpesa-statement-pdf";
import { MpesaTransaction } from "@/types";
import { FileDown, Printer, Filter } from "lucide-react";
import { format } from "date-fns";

type Filters = {
  search?: string;
  status?: string;
  from?: string;
  to?: string;
};

type Props = {
  transactions: MpesaTransaction[];
  filters: Filters;
  storeName?: string;
  branchName?: string;
};

export function MpesaStatementButton({
  transactions,
  filters,
  storeName,
  branchName,
}: Props) {
  const [previewOpen, setPreviewOpen] = useState(false);

  const successCount = transactions.filter(
    (t) => t.status === "SUCCESS",
  ).length;
  const failedCount = transactions.filter((t) => t.status === "FAILED").length;
  const pendingCount = transactions.filter(
    (t) => t.status === "PENDING",
  ).length;
  const totalAmount = transactions
    .filter((t) => t.status === "SUCCESS")
    .reduce((s, t) => s + t.amount, 0);

  const hasFilters =
    (filters.status && filters.status !== "ALL") ||
    filters.from ||
    filters.to ||
    filters.search;

  function handleDownload() {
    generateMpesaStatementPDF({ transactions, filters, storeName, branchName });
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <FileDown size={14} className="mr-1.5" />
            Export statement
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuLabel>Statement options</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setPreviewOpen(true)}>
            <Printer size={14} className="mr-2" />
            Preview &amp; download
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleDownload}>
            <FileDown size={14} className="mr-2" />
            Download PDF directly
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Preview dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileDown size={16} />
              M-Pesa Statement Preview
            </DialogTitle>
            <DialogDescription>
              Review the statement details before downloading.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Summary */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border bg-muted/40 p-3">
                <p className="text-xs text-muted-foreground">Total records</p>
                <p className="text-xl font-bold">{transactions.length}</p>
              </div>
              <div
                className="rounded-lg border bg-green-50 dark:bg-green-950/20
                              border-green-200 dark:border-green-800 p-3"
              >
                <p className="text-xs text-muted-foreground">Total received</p>
                <p className="text-xl font-bold text-green-600">
                  KES {totalAmount.toLocaleString()}
                </p>
              </div>
            </div>

            {/* Status breakdown */}
            <div className="flex gap-2 flex-wrap">
              <Badge variant="default">{successCount} successful</Badge>
              <Badge variant="secondary">{pendingCount} pending</Badge>
              <Badge variant="destructive">{failedCount} failed</Badge>
            </div>

            <Separator />

            {/* Active filters */}
            {hasFilters ? (
              <div className="space-y-2">
                <p className="text-xs font-medium flex items-center gap-1.5">
                  <Filter size={12} />
                  Active filters included in statement
                </p>
                <div className="flex gap-2 flex-wrap">
                  {filters.status && filters.status !== "ALL" && (
                    <Badge variant="outline" className="text-xs">
                      Status: {filters.status}
                    </Badge>
                  )}
                  {filters.from && (
                    <Badge variant="outline" className="text-xs">
                      From: {format(new Date(filters.from), "dd MMM yyyy")}
                    </Badge>
                  )}
                  {filters.to && (
                    <Badge variant="outline" className="text-xs">
                      To: {format(new Date(filters.to), "dd MMM yyyy")}
                    </Badge>
                  )}
                  {filters.search && (
                    <Badge variant="outline" className="text-xs">
                      Search: &quot;{filters.search}&quot;
                    </Badge>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                No filters applied — all transactions will be included.
              </p>
            )}

            {/* Format info */}
            <div
              className="rounded-lg border bg-muted/30 p-3 text-xs
                            text-muted-foreground space-y-1"
            >
              <p>📄 Format: PDF (A4 Landscape)</p>
              <p>
                📊 Includes: Status, receipt no., phone, amount, checkout ID,
                merchant ID, result code, date
              </p>
              <p>🖨 Printable with page numbers and header on every page</p>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setPreviewOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                handleDownload();
                setPreviewOpen(false);
              }}
            >
              <FileDown size={14} className="mr-1.5" />
              Download PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
