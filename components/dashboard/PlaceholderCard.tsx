import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { LucideIcon, Clock } from "lucide-react";

type Props = {
  title: string;
  description: string;
  icon?: LucideIcon;
  comingIn?: string;
};

export const PlaceholderCard = ({
  title,
  description,
  icon: Icon = Clock,
  comingIn,
}: Props) => {
  return (
    <Card className="border-dashed">
      <CardHeader>
        <CardTitle className="text-base text-muted-foreground">
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div
          className="flex flex-col items-center justify-center
                        h-32 gap-3 text-center"
        >
          <div className="p-3 rounded-full bg-muted">
            <Icon size={22} className="text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">
              Coming soon
            </p>
            {comingIn && (
              <p className="text-xs text-muted-foreground">{comingIn}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
