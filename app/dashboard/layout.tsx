import { CommandPalette } from "@/components/command/CommandPalette";
import { LowStockBanner } from "@/components/inventory/LowStockBanner";
import AppSidebar from "@/components/layout/AppSidebar";
import Navbar from "@/components/layout/navbar";
import { ProxyErrorToast } from "@/components/layout/ProxyErrorToast";
import { SidebarProvider } from "@/components/ui/sidebar";
import { cookies } from "next/headers";
import React from "react";
import { AppFooter } from "../../components/layout/AppFooter";

const layout = async ({ children }: { children: React.ReactNode }) => {
  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get("sidebar_state")?.value === "true";
  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <AppSidebar />
      <main className="relative w-full flex-1 min-w-0 overflow-x-hidden">
        <Navbar />
        <LowStockBanner />
        {/* Shows toast when proxy redirects with ?error= */}
        <ProxyErrorToast />
        <CommandPalette />
        <div className="p-4 w-full">
          {children}
          <AppFooter />
        </div>
      </main>
    </SidebarProvider>
  );
};

export default layout;
