"use client";

import { useRouter } from "next/navigation";
import { useProfile, useProfileStats } from "@/hooks/use-profile";
import { authClient } from "@/lib/auth-client";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Shield,
  Briefcase,
  User,
  LogOut,
  ExternalLink,
  ShoppingCart,
  TrendingUp,
  Activity,
} from "lucide-react";
import { toast } from "sonner";
import NextImage from "next/image";
import { cn } from "@/lib/utils";
import { EditProfileForm } from "./EditProfileForm";
import { ChangePasswordForm } from "./ChangePasswordForm";
import Link from "next/link";

const roleConfig: Record<
  string,
  { icon: React.ElementType; color: string; bg: string }
> = {
  ADMIN: {
    icon: Shield,
    color: "text-red-500",
    bg: "bg-red-50 dark:bg-red-950/20",
  },
  MANAGER: {
    icon: Briefcase,
    color: "text-blue-500",
    bg: "bg-blue-50 dark:bg-blue-950/20",
  },
  CASHIER: {
    icon: User,
    color: "text-green-500",
    bg: "bg-green-50 dark:bg-green-950/20",
  },
};

type Props = {
  open: boolean;
  onClose: () => void;
};

export const ProfileSheet = ({ open, onClose }: Props) => {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const { data: profile, isLoading } = useProfile(session?.user?.id);
  const { data: stats } = useProfileStats();

  const rc = roleConfig[profile?.role ?? "CASHIER"] ?? roleConfig.CASHIER;
  const RoleIcon = rc.icon;
  const initials =
    profile?.name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) ?? "?";

  const handleSignOut = async () => {
    await authClient.signOut();
    onClose();
    router.push("/");
    toast.success("Signed out");
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent
        side="right"
        className="w-full sm:w-96 flex flex-col p-0 overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4 shrink-0 space-y-4">
          <SheetHeader>
            <SheetTitle className="text-left">My Profile</SheetTitle>
          </SheetHeader>

          {/* User info */}
          {isLoading ? (
            <div className="flex items-center gap-3">
              <Skeleton className="h-14 w-14 rounded-full" />
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-48" />
              </div>
            </div>
          ) : profile ? (
            <div className="flex items-center gap-3">
              <Avatar className="h-14 w-14 shrink-0">
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
                    className={cn("text-lg font-bold", rc.bg, rc.color)}
                  >
                    {initials}
                  </AvatarFallback>
                )}
              </Avatar>
              <div className="min-w-0">
                <p className="font-semibold truncate">{profile.name}</p>
                <p className="text-sm text-muted-foreground truncate">
                  {profile.email}
                </p>
                <Badge variant="outline" className={cn("gap-1 mt-1", rc.color)}>
                  <RoleIcon size={10} />
                  {profile.role}
                </Badge>
              </div>
            </div>
          ) : null}

          {/* Quick stats */}
          {stats && (
            <div className="grid grid-cols-3 gap-2">
              {[
                {
                  label: "Orders",
                  value: stats.totalOrders,
                  icon: ShoppingCart,
                  color: "text-blue-500",
                },
                {
                  label: "Revenue",
                  value: `${(stats.totalRevenue / 1000).toFixed(0)}k`,
                  icon: TrendingUp,
                  color: "text-green-500",
                },
                {
                  label: "Actions",
                  value: stats.recentActivity.length,
                  icon: Activity,
                  color: "text-purple-500",
                },
              ].map((s) => (
                <div
                  key={s.label}
                  className="rounded-lg border bg-muted/30 p-2 text-center"
                >
                  <s.icon size={14} className={cn("mx-auto mb-1", s.color)} />
                  <p className="text-sm font-bold">{s.value}</p>
                  <p className="text-[10px] text-muted-foreground">{s.label}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <Separator />

        {/* Tabs */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          <Tabs defaultValue="edit" className="h-full">
            <TabsList className="w-full rounded-none border-b h-10 bg-transparent">
              <TabsTrigger value="edit" className="flex-1 text-xs">
                Profile
              </TabsTrigger>
              <TabsTrigger value="password" className="flex-1 text-xs">
                Password
              </TabsTrigger>
            </TabsList>

            <TabsContent value="edit" className="p-6 mt-0">
              {profile ? (
                <EditProfileForm user={profile} onSuccess={onClose} />
              ) : (
                <Skeleton className="h-48 rounded-xl" />
              )}
            </TabsContent>

            <TabsContent value="password" className="p-6 mt-0">
              <ChangePasswordForm onSuccess={onClose} />
            </TabsContent>
          </Tabs>
        </div>

        <Separator />

        {/* Footer actions */}
        <div className="p-4 shrink-0 flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 text-xs"
            asChild
          >
            <Link href="/dashboard/profile">
              <ExternalLink size={12} className="mr-1.5" />
              Full profile
            </Link>
          </Button>
          <Button
            variant="destructive"
            size="sm"
            className="flex-1 text-xs"
            onClick={handleSignOut}
          >
            <LogOut size={12} className="mr-1.5" />
            Sign out
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};
