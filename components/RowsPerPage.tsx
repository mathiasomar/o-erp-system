// src/components/ui/rows-per-page-select.tsx

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Props = {
  value: number;
  onChange: (value: number) => void;
  options?: number[];
};

export function RowsPerPageSelect({
  value,
  onChange,
  options = [10, 20, 30, 50, 100],
}: Props) {
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <Select value={String(value)} onValueChange={(v) => onChange(Number(v))}>
        <SelectTrigger className="h-7 w-17.5 text-xs">
          <SelectValue>{value}</SelectValue>
        </SelectTrigger>
        <SelectContent side="top">
          {options.map((o) => (
            <SelectItem key={o} value={String(o)} className="text-xs">
              {o}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
