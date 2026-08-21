import {
  LayoutDashboard,
  Target,
  Users,
  Package,
  Tag,
  ShoppingCart,
  ReceiptText,
  Boxes,
  Coins,
  Truck,
  Banknote,
  Smartphone,
  Activity,
  BarChart2,
  LineChart,
  Settings,
  Logs,
  UserCircle,
  Plus,
  FileDown,
  Sun,
  Moon,
  LogOut,
} from "lucide-react";

export type CommandPage = {
  label: string;
  url: string;
  icon: React.ElementType;
  keywords?: string[];
  permission?: string; // matches keys in ROLE_PERMISSIONS
};

export const COMMAND_PAGES: CommandPage[] = [
  {
    label: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
    permission: "dashboard.view",
  },
  {
    label: "POS",
    url: "/dashboard/pos",
    icon: Target,
    permission: "orders.create",
  },
  {
    label: "Users",
    url: "/dashboard/users",
    icon: Users,
    permission: "users.view",
  },
  {
    label: "Categories",
    url: "/dashboard/categories",
    icon: Tag,
    permission: "categories.view",
  },
  {
    label: "Products",
    url: "/dashboard/products",
    icon: Package,
    permission: "products.view",
  },
  {
    label: "Orders",
    url: "/dashboard/orders",
    icon: ShoppingCart,
    permission: "orders.view",
  },
  {
    label: "Receipts",
    url: "/dashboard/receipts",
    icon: ReceiptText,
    permission: "orders.view",
  },
  {
    label: "Inventory",
    url: "/dashboard/inventory",
    icon: Boxes,
    permission: "inventory.view",
  },
  {
    label: "Expenses",
    url: "/dashboard/expenses",
    icon: Coins,
    permission: "expenses.view",
  },
  {
    label: "Suppliers",
    url: "/dashboard/suppliers",
    icon: Truck,
    permission: "products.view",
  },
  {
    label: "Payments",
    url: "/dashboard/payments",
    icon: Banknote,
    permission: "payments.view",
  },
  {
    label: "M-Pesa",
    url: "/dashboard/mpesa",
    icon: Smartphone,
    permission: "payments.view",
  },
  {
    label: "Activity",
    url: "/dashboard/activity",
    icon: Activity,
    permission: "reports.view",
  },
  {
    label: "Reports",
    url: "/dashboard/reports",
    icon: BarChart2,
    permission: "reports.view",
  },
  {
    label: "Analytics",
    url: "/dashboard/analytics",
    icon: LineChart,
    permission: "reports.view",
  },
  {
    label: "Settings",
    url: "/dashboard/settings",
    icon: Settings,
    permission: "settings.view",
  },
  {
    label: "Logs",
    url: "/dashboard/logs",
    icon: Logs,
    permission: "users.view",
  },
  {
    label: "Exports & Backup",
    url: "/dashboard/exports",
    icon: FileDown,
    permission: "reports.view",
  },
  { label: "Profile", url: "/dashboard/profile", icon: UserCircle },
  {
    label: "Customers",
    url: "/dashboard/customers",
    icon: Users,
    permission: "orders.view",
  },
];

export type CommandAction = {
  label: string;
  shortcut?: string;
  icon: React.ElementType;
  keywords?: string[];
  permission?: string;
  action:
    | "new-sale"
    | "new-expense"
    | "new-product"
    | "export-reports"
    | "toggle-theme-light"
    | "toggle-theme-dark"
    | "sign-out";
};

export const COMMAND_ACTIONS: CommandAction[] = [
  {
    label: "New sale",
    icon: Plus,
    action: "new-sale",
    permission: "orders.create",
    keywords: ["pos", "checkout"],
  },
  {
    label: "New expense",
    icon: Plus,
    action: "new-expense",
    permission: "expenses.create",
    keywords: ["spend", "cost"],
  },
  {
    label: "New product",
    icon: Plus,
    action: "new-product",
    permission: "products.create",
    keywords: ["add", "item"],
  },
  {
    label: "Export reports",
    icon: FileDown,
    action: "export-reports",
    permission: "reports.view",
    keywords: ["download", "csv", "pdf"],
  },
  {
    label: "Light mode",
    icon: Sun,
    action: "toggle-theme-light",
    keywords: ["theme", "appearance"],
  },
  {
    label: "Dark mode",
    icon: Moon,
    action: "toggle-theme-dark",
    keywords: ["theme", "appearance"],
  },
  {
    label: "Sign out",
    icon: LogOut,
    action: "sign-out",
    keywords: ["logout", "exit"],
  },
];
