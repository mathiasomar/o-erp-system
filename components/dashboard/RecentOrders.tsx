import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Banknote, Smartphone, CreditCard, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";

type Order = {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  createdAt: string;
  items: { quantity: number }[];
  primaryMethod: string | null;
  splitPayments: { method: string; amount: number }[];
};

type Props = { orders: Order[]; loading: boolean };

const methodIcon: Record<string, React.ElementType> = {
  CASH: Banknote,
  MPESA: Smartphone,
  CARD: CreditCard,
};

const statusVariant = (s: string) =>
  s === "COMPLETED"
    ? "default"
    : s === "CANCELLED"
      ? "destructive"
      : "secondary";

export const RecentOrders = ({ orders, loading }: Props) => {
  const router = useRouter();

  return (
    <Card className="flex flex-col">
      <CardHeader
        className="flex-row items-center justify-between
                             space-y-0 pb-2"
      >
        <div>
          <CardTitle className="text-base">Recent Orders</CardTitle>
          <CardDescription>Last 5 transactions</CardDescription>
        </div>
        <Button variant="ghost" size="sm" className="text-xs" asChild>
          <Link href="/dashboard/orders">
            View all <ArrowRight size={12} className="ml-1" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="flex-1">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div
            className="flex items-center justify-center h-32
                          text-muted-foreground text-sm"
          >
            No orders yet
          </div>
        ) : (
          <div className="space-y-2">
            {orders.map((order) => {
              const Icon =
                methodIcon[order.primaryMethod ?? "CASH"] ?? Banknote;
              const totalUnits = order.items.reduce(
                (s, i) => s + i.quantity,
                0,
              );
              return (
                <div
                  key={order.id}
                  onClick={() => router.push(`/dashboard/orders/${order.id}`)}
                  className="flex items-center flex-wrap justify-between p-2.5
                             rounded-lg hover:bg-muted/50 cursor-pointer
                             transition-colors gap-3"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="p-1.5 rounded-lg bg-muted shrink-0">
                      <Icon size={13} className="text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium font-mono truncate">
                        {order.orderNumber}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {totalUnits} item{totalUnits !== 1 ? "s" : ""} ·{" "}
                        {format(new Date(order.createdAt), "dd MMM, HH:mm")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge
                      variant={statusVariant(order.status)}
                      className="text-[10px] px-1.5"
                    >
                      {order.status}
                    </Badge>
                    <span className="text-sm font-semibold">
                      KES {order.total.toLocaleString()}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
