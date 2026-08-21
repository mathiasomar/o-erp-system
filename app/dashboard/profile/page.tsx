"use client";

import { useProfile, useProfileStats } from "@/hooks/use-profile";

import { EditProfileForm } from "@/components/profile/EditProfileForm";
import { ChangePasswordForm } from "@/components/profile/ChangePasswordForm";
import { ActivityLogRow } from "@/components/activity/ActivityLogRow";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Shield,
  Briefcase,
  User,
  ShoppingCart,
  TrendingUp,
  Activity,
  CheckCircle2,
  Package,
  KeyRound,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import NextImage from "next/image";
import { cn } from "@/lib/utils";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { authClient } from "@/lib/auth-client";

const roleConfig: Record<
  string,
  {
    label: string;
    icon: React.ElementType;
    color: string;
    bg: string;
  }
> = {
  ADMIN: {
    label: "Admin",
    icon: Shield,
    color: "text-red-500",
    bg: "bg-red-50 dark:bg-red-950/20",
  },
  MANAGER: {
    label: "Manager",
    icon: Briefcase,
    color: "text-blue-500",
    bg: "bg-blue-50 dark:bg-blue-950/20",
  },
  CASHIER: {
    label: "Cashier",
    icon: User,
    color: "text-green-500",
    bg: "bg-green-50 dark:bg-green-950/20",
  },
};

export default function ProfilePage() {
  const { data: session } = authClient.useSession();
  const { data: profile, isLoading: loadingProfile } = useProfile(
    session?.user?.id,
  );
  const { data: stats, isLoading: loadingStats } = useProfileStats();

  const rc = roleConfig[profile?.role ?? "CASHIER"] ?? roleConfig.CASHIER;
  const RoleIcon = rc.icon;
  const initials =
    profile?.name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) ?? "?";

  if (loadingProfile) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-20 w-20 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-56" />
            <Skeleton className="h-5 w-20" />
          </div>
        </div>
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="p-2 space-y-6 max-w-5xl mx-auto">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Profile</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      {/* ── Profile header ──────────────────────────────────────────────── */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <Avatar className="h-20 w-20">
            {profile.image ? (
              <div className="relative h-full w-full">
                <NextImage
                  src={profile.image}
                  alt={profile.name}
                  fill
                  className="object-cover rounded-full"
                  unoptimized
                />
              </div>
            ) : (
              <AvatarFallback
                className={cn("text-2xl font-bold", rc.bg, rc.color)}
              >
                {initials}
              </AvatarFallback>
            )}
          </Avatar>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold">{profile.name}</h1>
              <Badge
                variant={profile.isActive ? "default" : "secondary"}
                className="gap-1"
              >
                <CheckCircle2 size={10} />
                {profile.isActive ? "Active" : "Inactive"}
              </Badge>
              <Badge variant="outline" className={cn("gap-1", rc.color)}>
                <RoleIcon size={10} />
                {rc.label}
              </Badge>
            </div>
            <p className="text-muted-foreground">{profile.email}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Member since {format(new Date(profile.createdAt), "dd MMM yyyy")}
            </p>
          </div>
        </div>
      </div>

      {/* ── Stats cards ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Total orders",
            value: loadingStats ? "—" : String(stats?.totalOrders ?? 0),
            sub: `${stats?.last30Orders ?? 0} last 30 days`,
            icon: ShoppingCart,
            color: "text-blue-500",
            bg: "bg-blue-50 dark:bg-blue-950/20",
          },
          {
            label: "Revenue processed",
            value: loadingStats
              ? "—"
              : `KES ${(stats?.totalRevenue ?? 0).toLocaleString()}`,
            sub: "From completed orders",
            icon: TrendingUp,
            color: "text-green-600",
            bg: "bg-green-50 dark:bg-green-950/20",
          },
          {
            label: "Expenses logged",
            value: loadingStats ? "—" : String(stats?.totalExpenses ?? 0),
            sub: "Total expense entries",
            icon: Package,
            color: "text-orange-600",
            bg: "bg-orange-50 dark:bg-orange-950/20",
          },
          {
            label: "Total activities",
            value: loadingStats ? "—" : String(profile._count.activityLogs),
            sub: "System actions",
            icon: Activity,
            color: "text-purple-600",
            bg: "bg-purple-50 dark:bg-purple-950/20",
          },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4 flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
                {loadingStats ? (
                  <Skeleton className="h-6 w-20 mt-1" />
                ) : (
                  <p className="text-xl font-bold leading-tight">
                    {stat.value}
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-0.5">
                  {stat.sub}
                </p>
              </div>
              <div className={cn("p-2 rounded-lg", stat.bg)}>
                <stat.icon size={16} className={stat.color} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Main content ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Edit tabs — left 2/3 */}
        <div className="lg:col-span-2">
          <Card>
            <Tabs defaultValue="edit">
              <CardHeader className="pb-0">
                <TabsList className="w-full">
                  <TabsTrigger value="edit" className="flex-1 gap-1.5">
                    <User size={13} /> Edit Profile
                  </TabsTrigger>
                  <TabsTrigger value="password" className="flex-1 gap-1.5">
                    <KeyRound size={13} /> Change Password
                  </TabsTrigger>
                </TabsList>
              </CardHeader>
              <CardContent className="pt-4">
                <TabsContent value="edit" className="mt-0">
                  <EditProfileForm user={profile} />
                </TabsContent>
                <TabsContent value="password" className="mt-0">
                  <ChangePasswordForm />
                </TabsContent>
              </CardContent>
            </Tabs>
          </Card>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Account details */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Account details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5 text-sm">
              {[
                {
                  label: "Role",
                  value: (
                    <Badge
                      variant="outline"
                      className={cn("gap-1 text-xs", rc.color)}
                    >
                      <RoleIcon size={10} /> {rc.label}
                    </Badge>
                  ),
                },
                {
                  label: "Status",
                  value: (
                    <Badge variant={profile.isActive ? "default" : "secondary"}>
                      {profile.isActive ? "Active" : "Inactive"}
                    </Badge>
                  ),
                },
                {
                  label: "Email verified",
                  value: profile.emailVerified ? (
                    <span className="text-green-600 font-medium">Yes</span>
                  ) : (
                    <span className="text-orange-500 font-medium">No</span>
                  ),
                },
                {
                  label: "Joined",
                  value: format(new Date(profile.createdAt), "dd MMM yyyy"),
                },
                {
                  label: "Last updated",
                  value: formatDistanceToNow(new Date(profile.updatedAt), {
                    addSuffix: true,
                  }),
                },
              ].map((row) => (
                <div
                  key={row.label}
                  className="flex items-center justify-between
                             border-b last:border-0 pb-2 last:pb-0"
                >
                  <span className="text-muted-foreground text-xs">
                    {row.label}
                  </span>
                  <span className="text-xs font-medium">{row.value}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Recent activity */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Activity size={14} />
                Recent activity
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loadingStats ? (
                <div className="p-4 space-y-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 rounded-lg" />
                  ))}
                </div>
              ) : (stats?.recentActivity ?? []).length === 0 ? (
                <div
                  className="flex flex-col items-center justify-center
                                h-32 gap-2 text-muted-foreground text-sm"
                >
                  <Activity size={20} className="opacity-30" />
                  No recent activity
                </div>
              ) : (
                <ScrollArea className="h-72">
                  <div className="px-4">
                    {stats?.recentActivity.map((log) => (
                      <ActivityLogRow key={log.id} log={log} compact />
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
