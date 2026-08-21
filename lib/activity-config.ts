import {
  ShoppingCart,
  Package,
  DollarSign,
  Boxes,
  Users,
  Settings,
  Shield,
  Tag,
  LogIn,
  LogOut,
  CheckCircle2,
  XCircle,
  Plus,
  Pencil,
  Trash2,
  SlidersHorizontal,
  RefreshCw,
} from "lucide-react";

type ActionConfig = {
  label: string;
  color: string;
  bg: string;
  icon: React.ElementType;
  entity: string;
};

export const ACTION_CONFIG: Record<string, ActionConfig> = {
  // Orders
  ORDER_CREATED: {
    label: "Order created",
    color: "text-green-600",
    bg: "bg-green-50 dark:bg-green-950/20",
    icon: ShoppingCart,
    entity: "Order",
  },
  ORDER_CANCELLED: {
    label: "Order cancelled",
    color: "text-red-500",
    bg: "bg-red-50 dark:bg-red-950/20",
    icon: XCircle,
    entity: "Order",
  },
  ORDER_COMPLETED: {
    label: "Order completed",
    color: "text-green-600",
    bg: "bg-green-50 dark:bg-green-950/20",
    icon: CheckCircle2,
    entity: "Order",
  },

  // Products
  PRODUCT_CREATED: {
    label: "Product created",
    color: "text-blue-600",
    bg: "bg-blue-50 dark:bg-blue-950/20",
    icon: Plus,
    entity: "Product",
  },
  PRODUCT_UPDATED: {
    label: "Product updated",
    color: "text-blue-500",
    bg: "bg-blue-50 dark:bg-blue-950/20",
    icon: Pencil,
    entity: "Product",
  },
  PRODUCT_DELETED: {
    label: "Product deleted",
    color: "text-red-500",
    bg: "bg-red-50 dark:bg-red-950/20",
    icon: Trash2,
    entity: "Product",
  },

  // Expenses
  EXPENSE_CREATED: {
    label: "Expense added",
    color: "text-orange-600",
    bg: "bg-orange-50 dark:bg-orange-950/20",
    icon: Plus,
    entity: "Expense",
  },
  EXPENSE_UPDATED: {
    label: "Expense updated",
    color: "text-orange-500",
    bg: "bg-orange-50 dark:bg-orange-950/20",
    icon: Pencil,
    entity: "Expense",
  },
  EXPENSE_DELETED: {
    label: "Expense deleted",
    color: "text-red-500",
    bg: "bg-red-50 dark:bg-red-950/20",
    icon: Trash2,
    entity: "Expense",
  },

  // Inventory
  STOCK_ADJUSTED: {
    label: "Stock adjusted",
    color: "text-amber-600",
    bg: "bg-amber-50 dark:bg-amber-950/20",
    icon: SlidersHorizontal,
    entity: "Stock",
  },
  STOCK_BULK_ADJUSTED: {
    label: "Bulk stock adjusted",
    color: "text-amber-600",
    bg: "bg-amber-50 dark:bg-amber-950/20",
    icon: RefreshCw,
    entity: "Stock",
  },

  // Users
  USER_CREATED: {
    label: "User created",
    color: "text-purple-600",
    bg: "bg-purple-50 dark:bg-purple-950/20",
    icon: Plus,
    entity: "User",
  },
  USER_UPDATED: {
    label: "User updated",
    color: "text-purple-500",
    bg: "bg-purple-50 dark:bg-purple-950/20",
    icon: Pencil,
    entity: "User",
  },
  USER_ROLE_CHANGED: {
    label: "Role changed",
    color: "text-purple-600",
    bg: "bg-purple-50 dark:bg-purple-950/20",
    icon: Shield,
    entity: "User",
  },
  USER_ACTIVATED: {
    label: "User activated",
    color: "text-green-600",
    bg: "bg-green-50 dark:bg-green-950/20",
    icon: CheckCircle2,
    entity: "User",
  },
  USER_DEACTIVATED: {
    label: "User deactivated",
    color: "text-red-500",
    bg: "bg-red-50 dark:bg-red-950/20",
    icon: XCircle,
    entity: "User",
  },
  USER_LOGIN: {
    label: "User logged in",
    color: "text-teal-600",
    bg: "bg-teal-50 dark:bg-teal-950/20",
    icon: LogIn,
    entity: "User",
  },
  USER_LOGOUT: {
    label: "User logged out",
    color: "text-teal-500",
    bg: "bg-teal-50 dark:bg-teal-950/20",
    icon: LogOut,
    entity: "User",
  },

  // Settings
  SETTINGS_UPDATED: {
    label: "Settings updated",
    color: "text-gray-600",
    bg: "bg-gray-50 dark:bg-gray-900/20",
    icon: Settings,
    entity: "Settings",
  },
  PERMISSIONS_UPDATED: {
    label: "Permissions updated",
    color: "text-gray-600",
    bg: "bg-gray-50 dark:bg-gray-900/20",
    icon: Shield,
    entity: "Permissions",
  },

  // Categories
  CATEGORY_CREATED: {
    label: "Category created",
    color: "text-teal-600",
    bg: "bg-teal-50 dark:bg-teal-950/20",
    icon: Plus,
    entity: "Category",
  },
  CATEGORY_UPDATED: {
    label: "Category updated",
    color: "text-teal-500",
    bg: "bg-teal-50 dark:bg-teal-950/20",
    icon: Pencil,
    entity: "Category",
  },
  CATEGORY_DELETED: {
    label: "Category deleted",
    color: "text-red-500",
    bg: "bg-red-50 dark:bg-red-950/20",
    icon: Trash2,
    entity: "Category",
  },
};

export const ENTITY_TYPES = [
  "Order",
  "Product",
  "Expense",
  "Stock",
  "User",
  "Settings",
  "Permissions",
  "Category",
];

export const ACTION_TYPES = Object.keys(ACTION_CONFIG);
