"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useSearch } from "@/hooks/use-search";
import { usePermissions } from "@/hooks/use-permissions";
import { authClient } from "@/lib/auth-client";
import {
  COMMAND_PAGES,
  COMMAND_ACTIONS,
  CommandAction,
} from "@/lib/command-registry";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import {
  Package,
  ShoppingCart,
  User as UserIcon,
  ArrowRight,
  Search as SearchIcon,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

export const CommandPalette = () => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const router = useRouter();
  const { setTheme } = useTheme();
  const { can } = usePermissions();

  const { data: results, isFetching } = useSearch(query);
  const showResults = query.trim().length >= 2;

  // ── Global keyboard shortcut ─────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  // Reset query when closed
  useEffect(() => {
    if (!open) {
      const id = window.setTimeout(() => setQuery(""), 0);
      return () => clearTimeout(id);
    }
  }, [open]);

  const close = () => setOpen(false);

  const goTo = useCallback(
    (url: string) => {
      router.push(url);
      close();
    },
    [router],
  );

  const runAction = (action: CommandAction["action"]) => {
    switch (action) {
      case "new-sale":
        goTo("/dashboard/pos");
        break;
      case "new-expense":
        router.push("/dashboard/expenses?new=true");
        close();
        break;
      case "new-product":
        router.push("/dashboard/products?new=true");
        close();
        break;
      case "export-reports":
        goTo("/dashboard/reports");
        break;
      case "toggle-theme-light":
        setTheme("light");
        close();
        break;
      case "toggle-theme-dark":
        setTheme("dark");
        close();
        break;
      case "sign-out":
        authClient.signOut().then(() => {
          toast.success("Signed out");
          router.push("/");
        });
        close();
        break;
    }
  };

  // Filter pages/actions by permission
  const visiblePages = COMMAND_PAGES.filter(
    (p) => !p.permission || can(p.permission),
  );
  const visibleActions = COMMAND_ACTIONS.filter(
    (a) => !a.permission || can(a.permission),
  );

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput
        placeholder="Search products, orders, users, or jump to a page..."
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        {/* ── Live search results ─────────────────────────────────────────── */}
        {showResults && (
          <>
            {isFetching && (
              <div
                className="flex items-center justify-center py-6 text-sm
                              text-muted-foreground gap-2"
              >
                <Loader2 size={14} className="animate-spin" />
                Searching...
              </div>
            )}

            {!isFetching && results && (
              <>
                {/* Products */}
                {results.products.length > 0 && (
                  <CommandGroup heading="Products">
                    {results.products.map((p) => (
                      <CommandItem
                        key={p.id}
                        value={`product-${p.id}-${p.name}-${p.sku}`}
                        onSelect={() => goTo(`/dashboard/products/${p.id}`)}
                      >
                        <Package size={14} className="text-blue-500" />
                        <div className="flex-1 min-w-0">
                          <p className="truncate">{p.name}</p>
                          <p className="text-xs text-muted-foreground font-mono">
                            {p.sku}
                          </p>
                        </div>
                        {p.category && (
                          <Badge
                            variant="outline"
                            className="text-[10px] shrink-0"
                            style={{
                              borderColor: p.category.color ?? undefined,
                              color: p.category.color ?? undefined,
                            }}
                          >
                            {p.category.name}
                          </Badge>
                        )}
                        <span className="text-xs text-muted-foreground shrink-0">
                          KES {p.price.toLocaleString()}
                        </span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}

                {/* Orders */}
                {results.orders.length > 0 && (
                  <CommandGroup heading="Orders">
                    {results.orders.map((o) => (
                      <CommandItem
                        key={o.id}
                        value={`order-${o.id}-${o.orderNumber}`}
                        onSelect={() => goTo(`/dashboard/orders/${o.id}`)}
                      >
                        <ShoppingCart size={14} className="text-purple-500" />
                        <span className="font-mono text-sm">
                          {o.orderNumber}
                        </span>
                        <Badge
                          variant={
                            o.status === "COMPLETED"
                              ? "default"
                              : o.status === "CANCELLED"
                                ? "destructive"
                                : "secondary"
                          }
                          className="text-[10px]"
                        >
                          {o.status}
                        </Badge>
                        <span className="text-xs text-muted-foreground ml-auto shrink-0">
                          KES {o.total.toLocaleString()}
                        </span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}

                {/* Users */}
                {results.users.length > 0 && can("users.view") && (
                  <CommandGroup heading="Users">
                    {results.users.map((u) => (
                      <CommandItem
                        key={u.id}
                        value={`user-${u.id}-${u.name}-${u.email}`}
                        onSelect={() => goTo(`/dashboard/users/${u.id}`)}
                      >
                        <UserIcon size={14} className="text-green-500" />
                        <div className="flex-1 min-w-0">
                          <p className="truncate">{u.name}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {u.email}
                          </p>
                        </div>
                        <Badge
                          variant="outline"
                          className="text-[10px] capitalize"
                        >
                          {u.role.toLowerCase()}
                        </Badge>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}

                {results.products.length === 0 &&
                  results.orders.length === 0 &&
                  results.users.length === 0 && (
                    <CommandEmpty>
                      <div
                        className="flex flex-col items-center gap-2 py-6
                                    text-muted-foreground"
                      >
                        <SearchIcon size={20} className="opacity-30" />
                        <p className="text-sm">
                          No results for &quot;{query}&quot;
                        </p>
                      </div>
                    </CommandEmpty>
                  )}

                <CommandSeparator />
              </>
            )}
          </>
        )}

        {/* ── Quick actions ────────────────────────────────────────────────── */}
        {visibleActions.length > 0 && (
          <CommandGroup heading="Quick actions">
            {visibleActions.map((a) => (
              <CommandItem
                key={a.label}
                value={`action-${a.label} ${a.keywords?.join(" ") ?? ""}`}
                onSelect={() => runAction(a.action)}
              >
                <a.icon size={14} className="text-muted-foreground" />
                <span>{a.label}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        <CommandSeparator />

        {/* ── Pages ────────────────────────────────────────────────────────── */}
        <CommandGroup heading="Pages">
          {visiblePages.map((p) => (
            <CommandItem
              key={p.url}
              value={`page-${p.label} ${p.keywords?.join(" ") ?? ""}`}
              onSelect={() => goTo(p.url)}
            >
              <p.icon size={14} className="text-muted-foreground" />
              <span>{p.label}</span>
              <ArrowRight size={12} className="ml-auto text-muted-foreground" />
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
};
