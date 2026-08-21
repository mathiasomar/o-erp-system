"use client";

import { useState } from "react";
import { CustomerSearchResult } from "@/types";
import { LoyaltyBadge } from "./LoyaltyBadge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { User, Search, X, Loader2, UserPlus } from "lucide-react";
import { useCustomerSearch } from "@/hooks/use-customer";

type Props = {
  value?: CustomerSearchResult | null;
  onChange: (customer: CustomerSearchResult | null) => void;
  onNewCustomer?: () => void;
};

export const CustomerPicker = ({ value, onChange, onNewCustomer }: Props) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const { data: results = [], isFetching } = useCustomerSearch(query);

  const handleSelect = (customer: CustomerSearchResult) => {
    onChange(customer);
    setOpen(false);
    setQuery("");
  };

  const handleClear = () => {
    onChange(null);
    setQuery("");
  };

  return (
    <div className="space-y-2">
      {value ? (
        // Selected customer display
        <div
          className="flex items-center gap-3 p-3 rounded-lg border
                        bg-muted/30"
        >
          <div className="p-2 rounded-full bg-primary/10">
            <User size={14} className="text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{value.name}</p>
            <p className="text-xs text-muted-foreground">
              {value.phone ?? value.email ?? "No contact"}
            </p>
            <LoyaltyBadge points={value.points} size="sm" />
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0"
            onClick={handleClear}
          >
            <X size={13} />
          </Button>
        </div>
      ) : (
        // Search popover
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              className="w-full justify-start gap-2 text-muted-foreground
                         font-normal"
            >
              <User size={14} />
              Attach customer (optional)
            </Button>
          </PopoverTrigger>

          <PopoverContent className="w-80 p-0" align="start">
            <div className="p-3">
              <div className="relative">
                <Search
                  size={13}
                  className="absolute left-2.5 top-2.5 text-muted-foreground"
                />
                <Input
                  autoFocus
                  placeholder="Search by name or phone..."
                  className="pl-8 h-8 text-sm"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
            </div>

            <Separator />

            {isFetching ? (
              <div
                className="flex items-center justify-center py-6 gap-2
                              text-muted-foreground text-sm"
              >
                <Loader2 size={13} className="animate-spin" />
                Searching...
              </div>
            ) : query.length >= 2 && results.length === 0 ? (
              <div
                className="flex flex-col items-center py-6 gap-2
                              text-muted-foreground text-sm"
              >
                <User size={20} className="opacity-30" />
                <p>No customer found</p>
                {onNewCustomer && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="mt-1 text-xs"
                    onClick={() => {
                      setOpen(false);
                      onNewCustomer();
                    }}
                  >
                    <UserPlus size={12} className="mr-1.5" />
                    Create new customer
                  </Button>
                )}
              </div>
            ) : query.length < 2 ? (
              <p className="text-center text-xs text-muted-foreground py-6">
                Type at least 2 characters to search
              </p>
            ) : (
              <ScrollArea className="max-h-64">
                {results.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => handleSelect(c)}
                    className="w-full flex items-center gap-3 px-3 py-2.5
                               hover:bg-muted/50 text-left transition-colors
                               border-b last:border-0"
                  >
                    <div className="p-1.5 rounded-full bg-muted shrink-0">
                      <User size={12} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{c.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {c.phone ?? c.email ?? "—"}
                      </p>
                    </div>
                    <LoyaltyBadge points={c.points} size="sm" />
                  </button>
                ))}
              </ScrollArea>
            )}
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
};
