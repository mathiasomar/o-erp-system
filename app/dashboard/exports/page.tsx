"use client";

import { usePermissions } from "@/hooks/use-permissions";
import { ExportCard } from "@/components/exports/ExportCard";
import {
  useExportOrders,
  useExportProducts,
  useExportExpenses,
  useExportUsers,
  useExportStock,
  useFullBackup,
} from "@/hooks/use-export";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  ShoppingCart,
  Package,
  Coins,
  Users,
  Boxes,
  Database,
  FileText,
  Sheet,
  Download,
  Shield,
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileDown,
} from "lucide-react";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export default function ExportsPage() {
  // usePageTitle("Exports & Backup")

  const { role } = usePermissions();
  const isAdmin = role === "ADMIN";

  const orders = useExportOrders();
  const products = useExportProducts();
  const expenses = useExportExpenses();
  const users = useExportUsers();
  const stock = useExportStock();
  const backup = useFullBackup();

  if (!isAdmin) {
    return (
      <div className="p-6 flex flex-col items-center justify-center h-96 gap-3">
        <Shield size={32} className="text-muted-foreground/40" />
        <p className="text-muted-foreground">Admin access required</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Exports & Backup</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileDown size={22} />
            Exports &amp; Backup
          </h1>
          <p className="text-muted-foreground text-sm">
            Download your data in Excel, PDF, or JSON formats
          </p>
        </div>
        <Badge variant="outline" className="gap-1 text-red-500 border-red-300">
          <Shield size={11} /> Admin only
        </Badge>
      </div>

      {/* Audit notice */}
      <Alert>
        <CheckCircle2 size={14} className="text-green-600" />
        <AlertTitle>Audit-ready exports</AlertTitle>
        <AlertDescription className="text-xs">
          All exports include timestamps, user names, and full transaction
          details. PDF exports are paginated and signed with the company name.
          JSON backups exclude secrets and sensitive credentials.
        </AlertDescription>
      </Alert>

      {/* Export cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {/* Orders */}
        <ExportCard
          title="Orders"
          description="All orders with items, payments, cashier details"
          icon={ShoppingCart}
          iconColor="text-purple-600"
          iconBg="bg-purple-50 dark:bg-purple-950/20"
          showDates
          showStatus
          loading={orders.loading}
          options={[
            {
              label: "Export to Excel",
              format: "xlsx",
              icon: Sheet,
              color: "text-green-600",
              onClick: (range, extra) =>
                orders.exportXLSX(range, extra?.status),
            },
            {
              label: "Export to PDF",
              format: "pdf",
              icon: FileText,
              color: "text-red-500",
              onClick: (range, extra) => orders.exportPDF(range, extra?.status),
            },
          ]}
        />

        {/* Products */}
        <ExportCard
          title="Products"
          description="Full product catalog with prices, stock levels, categories"
          icon={Package}
          iconColor="text-blue-600"
          iconBg="bg-blue-50 dark:bg-blue-950/20"
          showDates={false}
          loading={products.loading}
          options={[
            {
              label: "Export to Excel",
              format: "xlsx",
              icon: Sheet,
              color: "text-green-600",
              onClick: () => products.exportXLSX(),
            },
            {
              label: "Export to PDF",
              format: "pdf",
              icon: FileText,
              color: "text-red-500",
              onClick: () => products.exportPDF(),
            },
          ]}
        />

        {/* Expenses */}
        <ExportCard
          title="Expenses"
          description="All expenses with categories and amounts"
          icon={Coins}
          iconColor="text-orange-600"
          iconBg="bg-orange-50 dark:bg-orange-950/20"
          showDates
          loading={expenses.loading}
          options={[
            {
              label: "Export to Excel",
              format: "xlsx",
              icon: Sheet,
              color: "text-green-600",
              onClick: (range) => expenses.exportXLSX(range),
            },
            {
              label: "Export to PDF",
              format: "pdf",
              icon: FileText,
              color: "text-red-500",
              onClick: (range) => expenses.exportPDF(range),
            },
          ]}
        />

        {/* Users */}
        <ExportCard
          title="Users"
          description="User accounts with roles, order counts, activity stats"
          icon={Users}
          iconColor="text-teal-600"
          iconBg="bg-teal-50 dark:bg-teal-950/20"
          showDates={false}
          loading={users.loading}
          options={[
            {
              label: "Export to Excel",
              format: "xlsx",
              icon: Sheet,
              color: "text-green-600",
              onClick: () => users.exportXLSX(),
            },
          ]}
        />

        {/* Stock movement */}
        <ExportCard
          title="Stock Movement"
          description="Full inventory adjustment history with reasons"
          icon={Boxes}
          iconColor="text-amber-600"
          iconBg="bg-amber-50 dark:bg-amber-950/20"
          showDates
          loading={stock.loading}
          options={[
            {
              label: "Export to Excel",
              format: "xlsx",
              icon: Sheet,
              color: "text-green-600",
              onClick: (range) => stock.exportXLSX(range),
            },
          ]}
        />

        {/* Full JSON backup */}
        <Card
          className="flex flex-col border-dashed border-2
                         border-muted-foreground/30"
        >
          <CardContent
            className="flex-1 flex flex-col items-center
                                  justify-center p-6 gap-4 text-center"
          >
            <div className="p-3 rounded-full bg-muted">
              <Database size={24} className="text-muted-foreground" />
            </div>
            <div>
              <p className="font-semibold">Full Database Backup</p>
              <p className="text-xs text-muted-foreground mt-1">
                Complete JSON export of all data. Excludes API keys and secrets.
              </p>
            </div>

            <Alert variant="destructive" className="text-left py-2">
              <AlertTriangle size={12} />
              <AlertDescription className="text-[11px]">
                This file may be large. Do not share it. Store securely — it
                contains all business data.
              </AlertDescription>
            </Alert>

            <Button
              className="w-full"
              disabled={backup.loading}
              onClick={() => backup.downloadBackup()}
            >
              {backup.loading ? (
                <>
                  <Clock size={14} className="mr-2 animate-spin" />
                  Preparing backup...
                </>
              ) : (
                <>
                  <Download size={14} className="mr-2" />
                  Download full backup
                </>
              )}
            </Button>

            <p className="text-[10px] text-muted-foreground">
              Format: JSON · Includes: orders, products, expenses, users,
              activity logs, settings
            </p>
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Format guide */}
      <div>
        <h2 className="text-sm font-semibold mb-3">Export format guide</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              icon: Sheet,
              color: "text-green-600",
              bg: "bg-green-50 dark:bg-green-950/20",
              title: "Excel (.xlsx)",
              desc: "Best for analysis, filtering, and sharing with accountants. Multiple sheets per export. Opens in Excel, Google Sheets, LibreOffice.",
            },
            {
              icon: FileText,
              color: "text-red-500",
              bg: "bg-red-50 dark:bg-red-950/20",
              title: "PDF",
              desc: "Best for printing and formal audit submissions. Includes company header, page numbers, and generation timestamp.",
            },
            {
              icon: Database,
              color: "text-blue-600",
              bg: "bg-blue-50 dark:bg-blue-950/20",
              title: "JSON backup",
              desc: "Complete machine-readable backup. Use for disaster recovery, data migration, or importing into another system.",
            },
          ].map((f) => (
            <div
              key={f.title}
              className="flex items-start gap-3 p-4 rounded-xl border"
            >
              <div className={`p-2 rounded-lg shrink-0 ${f.bg}`}>
                <f.icon size={16} className={f.color} />
              </div>
              <div>
                <p className="text-sm font-medium">{f.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
