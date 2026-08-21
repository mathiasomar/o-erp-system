"use client";

import { useState } from "react";
import { ProfileSheet } from "@/components/profile/ProfileSheet";
import { useProfile } from "@/hooks/use-profile";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Shield, Briefcase, User, Search, Palette } from "lucide-react";
import NextImage from "next/image";
import { useSystemSettings } from "../providers/SettingsProvider";
import { ModeToggle } from "../ModeToggle";
import PaletteSelector from "@/components/settings/PaletteSelector";
import TimeDisplay from "./TimeDisplay";
import { NotificationBell } from "../notifications/NotificationBell";
import CartNav from "./CartNav";
import { Button } from "../ui/button";
import { BranchSwitcher } from "./BranchSwitcher";
import { authClient } from "@/lib/auth-client";

const roleConfig: Record<
  string,
  {
    icon: React.ElementType;
    color: string;
  }
> = {
  ADMIN: { icon: Shield, color: "text-red-500" },
  MANAGER: { icon: Briefcase, color: "text-blue-500" },
  CASHIER: { icon: User, color: "text-green-500" },
};

type BranchSummary = {
  id: string;
  name: string;
  code: string;
  isDefault: boolean;
  isActive: boolean;
};

type Props = {
  branches: BranchSummary[];
  currentBranchId: string;
  myBranch: { id: string; name: string; code: string } | null;
  isAdmin: boolean;
};

const NavbarComponent = ({
  branches,
  currentBranchId,
  myBranch,
  isAdmin,
}: Props) => {
  const [profileOpen, setProfileOpen] = useState(false);
  const { settings } = useSystemSettings();
  const { data: session } = authClient.useSession();
  const { data: profile } = useProfile(session?.user?.id);

  const companyName = settings.company_name || "POS System";
  const rc = roleConfig[profile?.role ?? "CASHIER"] ?? roleConfig.CASHIER;
  const RoleIcon = rc.icon;
  const initials =
    profile?.name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) ?? "?";

  const openCommandPalette = () => {
    document.dispatchEvent(
      new KeyboardEvent("keydown", { key: "k", metaKey: true }),
    );
  };

  return (
    <>
      <header
        className="border-b
                         bg-background/95 backdrop-blur px-4 sticky top-0 z-40"
      >
        <div className="flex h-15 items-center border-b gap-3">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="h-5 my-auto" />

          {/* Company name */}
          <p className="text-sm font-medium text-muted-foreground hidden sm:block">
            {companyName}
          </p>

          <Separator
            orientation="vertical"
            className="h-5 hidden md:block my-auto"
          />

          {/* Branch switcher / badge */}
          <BranchSwitcher
            branches={branches}
            currentBranchId={currentBranchId}
            myBranch={myBranch}
            isAdmin={isAdmin}
          />

          <div className="ml-auto flex items-center gap-2">
            {session?.user.role === "ADMIN" || session?.user.role === "MANAGER" ? (
              <div className="hidden sm:block">
                <NotificationBell />
              </div>
            ) : null}

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <Palette size={16} />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-56 p-2">
                <PaletteSelector />
              </PopoverContent>
            </Popover>

            <ModeToggle />

            {/* Profile avatar button */}
            <div className="hidden md:block">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => setProfileOpen(true)}
                      className="flex items-center gap-2 rounded-lg px-2 py-1.5
                             hover:bg-muted transition-colors"
                    >
                      <Avatar className="h-7 w-7">
                        {profile?.image ? (
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
                          <AvatarFallback className="text-xs font-bold bg-muted">
                            {initials}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <div className="hidden sm:block text-left">
                        <p className="text-xs font-medium leading-tight">
                          {profile?.name ?? "Loading..."}
                        </p>
                        <div className="flex items-center gap-1">
                          <RoleIcon size={9} className={rc.color} />
                          <span className="text-[10px] text-muted-foreground">
                            {(profile?.username ?? "cashier").toLowerCase()}
                          </span>
                        </div>
                      </div>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>View profile</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </div>
        <div className="flex h-15 items-center justify-between gap-3">
          <Button
            variant="outline"
            size="sm"
            className="hidden md:flex items-center gap-2 text-muted-foreground
             h-8 px-3 text-xs w-48 justify-start"
            onClick={openCommandPalette}
          >
            <Search size={13} />
            <span>Search...</span>
            <kbd
              className="ml-auto pointer-events-none inline-flex h-5 select-none
                  items-center gap-1 rounded border bg-muted px-1.5
                  font-mono text-[10px] font-medium"
            >
              ⌘K
            </kbd>
          </Button>

          {/* Mobile icon-only trigger */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden h-9 w-9"
            onClick={openCommandPalette}
          >
            <Search size={16} />
          </Button>

          {/* Date */}
          <span className="text-xs text-muted-foreground">
            <TimeDisplay />
          </span>

          <div className="flex items-center gap-2">
            <div className="sm:hidden">
              <NotificationBell />
            </div>
            <CartNav />
          </div>
        </div>
      </header>

      <ProfileSheet open={profileOpen} onClose={() => setProfileOpen(false)} />
    </>
  );
};

export default NavbarComponent;
