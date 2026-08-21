import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Inter, Figtree } from "next/font/google";
import "./globals.css";
import NextTopLoader from "nextjs-toploader";
import { cn } from "@/lib/utils";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { Toaster } from "@/components/ui/sonner";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { generateSystemMetadata } from "@/lib/metadata";
import { SettingsProvider } from "@/components/providers/SettingsProvider";
import { FloatingActions } from "@/components/layout/FloatingActions";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/**
 * Dynamically generates metadata from database settings.
 * This automatically updates whenever admin saves changes to settings.
 * Settings include company name, favicon, database info, and feature flags.
 */
export async function generateMetadata(): Promise<Metadata> {
  const systemMetadata = await generateSystemMetadata();

  return {
    title: systemMetadata.title,
    description: systemMetadata.description,
    icons: systemMetadata.icons,
    applicationName: systemMetadata.companyName,
    appleWebApp: {
      capable: true,
      statusBarStyle: "default",
      title: systemMetadata.companyName,
    },

    formatDetection: {
      telephone: false,
    },
  };
}

export const viewport: Viewport = {
  themeColor: "#ffffff",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn(
        "h-full",
        "antialiased",
        geistSans.variable,
        geistMono.variable,
        "font-sans",
        geist.variable,
      )}
      suppressHydrationWarning
    >
      <body className="w-screen h-screen flex flex-col">
        <NextTopLoader height={3} color="#22c55e" showSpinner={false} />
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <TooltipProvider>
            <QueryProvider>
              <SettingsProvider>
                {children}
                <FloatingActions />
              </SettingsProvider>
            </QueryProvider>
            <Toaster richColors position="top-right" closeButton />
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
