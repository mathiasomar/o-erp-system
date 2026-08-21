"use client";

import { authClient } from "@/lib/auth-client";
import {
  ActivityIcon,
  Banknote,
  BarChart2Icon,
  Building2,
  ChevronsUpDown,
  Cog,
  Coins,
  FileDown,
  Home,
  LineChartIcon,
  LogOut,
  Logs,
  Package,
  ReceiptText,
  ScanLine,
  Settings,
  ShoppingBag,
  ShoppingCart,
  Smartphone,
  Sparkles,
  Tags,
  Truck,
  User2,
  Users,
  Warehouse,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  useSidebar,
} from "../ui/sidebar";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { usePublicSettings } from "@/hooks/use-settings";
import { Spinner } from "../ui/spinner";
import { Skeleton } from "../ui/skeleton";
import { usePermissions } from "@/hooks/use-permissions";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { toast } from "sonner";

// ── Each item declares which permission is required to see it ─────────────────
// permission: undefined  → always visible to any authenticated user

const sidebarGroupItems = [
  {
    title: "Main",
    items: [
      {
        title: "Dashboard",
        url: "/dashboard",
        icon: Home,
        permission: "dashboard.view",
      },
      {
        title: "POS",
        url: "/dashboard/pos",
        icon: ScanLine,
        permission: "orders.create",
      },
      {
        title: "Branches",
        url: "/dashboard/branches",
        icon: Building2,
        permission: "branches.view",
      },
      {
        title: "Users",
        url: "/dashboard/users",
        icon: User2,
        permission: "users.view", // ADMIN only
      },
    ],
  },
  {
    title: "Store",
    items: [
      {
        title: "Categories",
        url: "/dashboard/categories",
        icon: Tags,
        permission: "categories.view",
      },
      {
        title: "Products",
        url: "/dashboard/products",
        icon: Package,
        permission: "products.view",
      },
      {
        title: "Orders",
        url: "/dashboard/orders",
        icon: ShoppingCart,
        permission: "orders.view",
      },
      {
        title: "Layaway",
        url: "/dashboard/layaway",
        icon: ShoppingBag,
        permission: "orders.view",
      },
      {
        title: "Customers",
        url: "/dashboard/customers",
        icon: Users,
        permission: "orders.view", // cashier can view
      },
      {
        title: "Receipts",
        url: "/dashboard/receipts",
        icon: ReceiptText,
        permission: "orders.view",
      },
      {
        title: "Inventory",
        url: "/dashboard/inventory",
        icon: Warehouse,
        permission: "inventory.view",
      },
      {
        title: "Purchase Orders",
        url: "/dashboard/purchases",
        icon: ShoppingBag,
        permission: "purchases.view",
      },
      {
        title: "Suppliers",
        url: "/dashboard/suppliers",
        icon: Truck,
        permission: "suppliers.view",
      },
      {
        title: "Expenses",
        url: "/dashboard/expenses",
        icon: Coins,
        permission: "expenses.view",
      },
    ],
  },
  {
    title: "Payments",
    items: [
      {
        title: "Payments",
        url: "/dashboard/payments",
        icon: Banknote,
        permission: "payments.view",
      },
      {
        title: "Mpesa",
        url: "/dashboard/mpesa",
        icon: Smartphone,
        permission: "mpesa.view",
      },
    ],
  },
  {
    title: "Insights",
    items: [
      {
        title: "Activity",
        url: "/dashboard/activity",
        icon: ActivityIcon,
        permission: "reports.view",
      },
      {
        title: "Reports",
        url: "/dashboard/reports",
        icon: BarChart2Icon,
        permission: "reports.view",
      },
      {
        title: "Analytics",
        url: "/dashboard/analytics",
        icon: LineChartIcon,
        permission: "reports.view",
      },
      {
        title: "AI Assistant",
        url: "/dashboard/ai",
        icon: Sparkles,
        permission: "dashboard.view", // managers and above
      },
    ],
  },
  {
    title: "System",
    items: [
      {
        title: "Exports",
        url: "/dashboard/exports",
        icon: FileDown,
        permission: "reports.view",
      },
      {
        title: "Settings",
        url: "/dashboard/settings",
        icon: Cog,
        permission: "reports.view", // ADMIN & MANAGER
      },
      {
        title: "Logs",
        url: "/dashboard/logs",
        icon: Logs,
        permission: "users.view", // ADMIN only
      },
    ],
  },
];

const AppSidebar = () => {
  const pathname = usePathname();
  const { data: session } = authClient.useSession();
  const { data: settings, isLoading: settingsLoading } = usePublicSettings();
  const { can, role } = usePermissions();
  const { isMobile, setOpenMobile } = useSidebar();
  const router = useRouter();

  // Filter each group's items based on the user's role permissions.
  // If a group ends up with no visible items, the group itself is hidden too.
  const filteredGroupItems = sidebarGroupItems
    .map((group) => ({
      ...group,
      items: group.items.filter((item) =>
        // No permission required → always show
        item.permission === undefined ? true : can(item.permission),
      ),
    }))
    .filter((group) => group.items.length > 0); // hide empty groups

  // ── Role badge config ──────────────────────────────────────────────────────
  const roleBadgeClass =
    role === "ADMIN"
      ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
      : role === "MANAGER"
        ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
        : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";

  const handleClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  const handleSignOut = async () => {
    await authClient.signOut();
    router.push("/");
    toast.success("Signed out");
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu className="py-3">
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link href="/dashboard">
                {settingsLoading ? (
                  <>
                    <Skeleton className="w-5 h-5 rounded-full" />
                    <Skeleton className="w-10 h-2" />
                  </>
                ) : (
                  <>
                    <Image
                      src={settings?.logo_url || "/logo.png"}
                      alt="logo"
                      width={40}
                      height={40}
                    />
                    <span>
                      {settingsLoading ? (
                        <Spinner />
                      ) : (
                        settings?.company_short_name || "CN"
                      )}
                    </span>
                  </>
                )}
                <span
                  className={cn(
                    "text-[9px] p-1 w-max rounded-full animate-pulse",
                    roleBadgeClass,
                  )}
                >
                  {role.toLowerCase()}
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent>
        {filteredGroupItems.map((group) => (
          <SidebarGroup key={group.title}>
            <SidebarGroupLabel>{group.title}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      tooltip={item.title}
                      asChild
                      isActive={
                        pathname === item.url ||
                        (item.url !== "/dashboard" &&
                          pathname.startsWith(item.url))
                      }
                      className="text-xs"
                      onClick={handleClick}
                    >
                      <Link href={item.url}>
                        <item.icon className="w-4 h-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                    {item.title === "Inbox" && (
                      <SidebarMenuBadge>24</SidebarMenuBadge>
                    )}
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <Avatar className="flex size-8 shrink-0 items-center justify-center rounded-full text-primary-foreground">
                    <AvatarImage
                      src={session?.user?.image || "/avatar.png"}
                      alt={session?.user?.name || ""}
                    />
                    <AvatarFallback>
                      {session?.user?.name.toUpperCase().slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="whitespace-nowrap">
                    {session?.user?.username}
                  </span>
                  <ChevronsUpDown className="ml-auto" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/profile">
                    <User2 /> Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/settings">
                    <Settings /> Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSignOut} variant="destructive">
                  <LogOut /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
};

export default AppSidebar;
