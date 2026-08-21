"use client";

import { useState } from "react";
import { expenseColumns } from "@/components/expenses/ExpenseColumns";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Banknote,
  Smartphone,
  CreditCard,
  TrendingDown,
  Plus,
  Search,
  X,
  List,
} from "lucide-react";
import { useExpenseCategories, useExpenses } from "@/hooks/use-expense";
import { ExpenseChart } from "@/components/expenses/ExpenseChart";
import { ExpenseCategoryChart } from "@/components/expenses/ExpenseCategoryChart";
import { ExpenseDataTable } from "@/components/expenses/ExpenseDatatable";
import { ExpenseSheet } from "@/components/expenses/ExpenseSheet";
import { AddExpenseCategorySheet } from "@/components/expenses/categories/AddExpenseCategorySheet";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { BranchLabel } from "@/components/layout/BranchLabel";

const METHODS = [
  { value: "ALL", label: "All methods" },
  { value: "CASH", label: "Cash" },
  { value: "MPESA", label: "M-Pesa" },
  { value: "CARD", label: "Card" },
  { value: "BANK_TRANSFER", label: "Bank transfer" },
];

const FREQUENCIES = [
  { value: "ALL", label: "All types" },
  { value: "ONE_TIME", label: "One-time" },
  { value: "DAILY", label: "Daily" },
  { value: "WEEKLY", label: "Weekly" },
  { value: "MONTHLY", label: "Monthly" },
  { value: "YEARLY", label: "Yearly" },
];

export default function ExpensesPage() {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [method, setMethod] = useState("ALL");
  const [frequency, setFrequency] = useState("ALL");
  const [categoryId, setCategoryId] = useState("ALL");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [addCategoryOpen, setAddCategoryOpen] = useState(false);

  const { data: catData = [] } = useExpenseCategories();
  const { data, isLoading } = useExpenses({
    search: search || undefined,
    method: method !== "ALL" ? method : undefined,
    frequency: frequency !== "ALL" ? frequency : undefined,
    categoryId: categoryId !== "ALL" ? categoryId : undefined,
    from: from || undefined,
    to: to || undefined,
  });

  const expenses = data?.expenses ?? [];
  const totalAmount = data?.totalAmount ?? 0;
  const byMethod = data?.byMethod ?? {
    CASH: 0,
    MPESA: 0,
    CARD: 0,
    BANK_TRANSFER: 0,
  };
  const byCategory = data?.byCategory ?? {};

  const hasFilters =
    search ||
    method !== "ALL" ||
    frequency !== "ALL" ||
    categoryId !== "ALL" ||
    from ||
    to;

  function clearFilters() {
    setSearch("");
    setMethod("ALL");
    setFrequency("ALL");
    setCategoryId("ALL");
    setFrom("");
    setTo("");
  }

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Expenses</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Expenses</h1>
          <p className="text-muted-foreground text-sm">
            Track and manage your business expenses
          </p>
          <BranchLabel />
        </div>
        <div className="flex items-center flex-wrap gap-4">
          <div className="flex items-center flex-wrap gap-2">
            <Button
              onClick={() => setAddCategoryOpen(true)}
              variant={"outline"}
            >
              <Plus size={15} className="mr-1.5" /> Add Category
            </Button>
            <Button asChild>
              <a href="/dashboard/expenses/categories">
                <List size={15} className="mr-1.5" /> Category List
              </a>
            </Button>
          </div>
          <Button onClick={() => setSheetOpen(true)}>
            <Plus size={15} className="mr-1.5" /> Add Expense
          </Button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-5 flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total expenses</p>
              <p className="text-2xl font-bold text-destructive">
                KES {totalAmount.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground">
                {expenses.length} record{expenses.length !== 1 ? "s" : ""}
              </p>
            </div>
            <div className="p-2 rounded-lg bg-muted text-destructive">
              <TrendingDown size={20} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Cash</p>
              <p className="text-2xl font-bold">
                KES {byMethod.CASH.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground">
                {expenses.filter((e) => e.paymentMethod === "CASH").length}{" "}
                payments
              </p>
            </div>
            <div className="p-2 rounded-lg bg-muted text-green-600">
              <Banknote size={20} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">M-Pesa</p>
              <p className="text-2xl font-bold">
                KES {byMethod.MPESA.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground">
                {expenses.filter((e) => e.paymentMethod === "MPESA").length}{" "}
                payments
              </p>
            </div>
            <div className="p-2 rounded-lg bg-muted text-blue-600">
              <Smartphone size={20} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Card / Bank</p>
              <p className="text-2xl font-bold">
                KES {(byMethod.CARD + byMethod.BANK_TRANSFER).toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground">
                {
                  expenses.filter(
                    (e) =>
                      e.paymentMethod === "CARD" ||
                      e.paymentMethod === "BANK_TRANSFER",
                  ).length
                }{" "}
                payments
              </p>
            </div>
            <div className="p-2 rounded-lg bg-muted text-purple-600">
              <CreditCard size={20} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ExpenseChart />
        </div>
        <div>
          <ExpenseCategoryChart byCategory={byCategory} />
        </div>
      </div>

      <Separator />

      {/* Filters */}
      <div className="space-y-3">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Search */}
          <div className="relative flex-1 min-w-56 max-w-sm">
            <Search
              className="absolute left-3 top-2.5 text-muted-foreground"
              size={15}
            />
            <Input
              placeholder="Search expenses..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Method filter */}
          <Select value={method} onValueChange={setMethod}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {METHODS.map((m) => (
                <SelectItem key={m.value} value={m.value}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Frequency filter */}
          <Select value={frequency} onValueChange={setFrequency}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FREQUENCIES.map((f) => (
                <SelectItem key={f.value} value={f.value}>
                  {f.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Category filter */}
          <Select value={categoryId} onValueChange={setCategoryId}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All categories</SelectItem>
              {catData.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: cat.color ?? "#6b7280" }}
                    />
                    {cat.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Clear */}
          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground"
              onClick={clearFilters}
            >
              <X size={13} className="mr-1" /> Clear
            </Button>
          )}
        </div>

        {/* Date range */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-muted-foreground">Date range:</span>
          <Input
            type="date"
            className="w-40 text-sm"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
          <span className="text-muted-foreground text-sm">to</span>
          <Input
            type="date"
            className="w-40 text-sm"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-md" />
          ))}
        </div>
      ) : (
        <ExpenseDataTable data={expenses} columns={expenseColumns} />
      )}

      {/* Add sheet */}
      <ExpenseSheet open={sheetOpen} onClose={() => setSheetOpen(false)} />
      <AddExpenseCategorySheet
        open={addCategoryOpen}
        onClose={() => setAddCategoryOpen(false)}
      />
    </div>
  );
}
