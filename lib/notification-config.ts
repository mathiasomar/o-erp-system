import {
  ShoppingCart,
  AlertTriangle,
  PackageX,
  Smartphone,
  CheckCircle2,
  XCircle,
  Receipt,
  User,
  Bell,
} from "lucide-react";

export const NOTIFICATION_CONFIG: Record<
  string,
  {
    icon: React.ElementType;
    color: string;
    bg: string;
  }
> = {
  NEW_ORDER: {
    icon: ShoppingCart,
    color: "text-green-600",
    bg: "bg-green-50 dark:bg-green-950/20",
  },
  LOW_STOCK: {
    icon: AlertTriangle,
    color: "text-orange-500",
    bg: "bg-orange-50 dark:bg-orange-950/20",
  },
  OUT_OF_STOCK: {
    icon: PackageX,
    color: "text-red-500",
    bg: "bg-red-50 dark:bg-red-950/20",
  },
  MPESA_PENDING: {
    icon: Smartphone,
    color: "text-blue-500",
    bg: "bg-blue-50 dark:bg-blue-950/20",
  },
  MPESA_SUCCESS: {
    icon: CheckCircle2,
    color: "text-green-600",
    bg: "bg-green-50 dark:bg-green-950/20",
  },
  MPESA_FAILED: {
    icon: XCircle,
    color: "text-red-500",
    bg: "bg-red-50 dark:bg-red-950/20",
  },
  EXPENSE_ADDED: {
    icon: Receipt,
    color: "text-purple-600",
    bg: "bg-purple-50 dark:bg-purple-950/20",
  },
  USER_ACTION: {
    icon: User,
    color: "text-blue-500",
    bg: "bg-blue-50 dark:bg-blue-950/20",
  },
  SYSTEM: { icon: Bell, color: "text-muted-foreground", bg: "bg-muted" },
};
