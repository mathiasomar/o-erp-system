import Link from "next/link";

export function AppFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t bg-background mt-4">
      <div className="flex min-h-14 flex-col items-center justify-between gap-2 px-2 py-3 text-sm text-muted-foreground sm:flex-row">
        <div className="text-center sm:text-left">
          © {year} O-POS System. All rights reserved.
        </div>

        <div className="flex items-center gap-4">
          <span>
            Powered by:{" "}
            <Link href="mailto:ommydev@gmail.com">Omar Mathias</Link>
          </span>
          <span className="hidden sm:inline">•</span>

          <span>Version 1.0.0</span>
        </div>
      </div>
    </footer>
  );
}
