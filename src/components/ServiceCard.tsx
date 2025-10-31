import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, AlertCircle, CheckCircle2 } from "lucide-react";

interface ServiceCardProps {
  name: string;
  status: "up" | "down" | "degraded";
  description?: string;
  cpu: number;
  memory: number;
  responseTime: number;
}

export function ServiceCard({ name, status, description, cpu, memory, responseTime }: ServiceCardProps) {
  const statusConfig = {
    up: {
      icon: CheckCircle2,
      color: "text-success",
      bgColor: "bg-success/10",
      label: "Operational",
    },
    down: {
      icon: AlertCircle,
      color: "text-destructive",
      bgColor: "bg-destructive/10",
      label: "Down",
    },
    degraded: {
      icon: Activity,
      color: "text-warning",
      bgColor: "bg-warning/10",
      label: "Degraded",
    },
  };

  const config = statusConfig[status];
  const StatusIcon = config.icon;

  return (
    <Card className="border-border bg-card hover:border-primary/50 transition-all duration-300">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg font-semibold text-foreground">{name}</CardTitle>
          <div className={`p-2 rounded-lg ${config.bgColor}`}>
            <StatusIcon className={`h-4 w-4 ${config.color}`} />
          </div>
        </div>
        {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2 mb-4">
          <Badge variant={status === "up" ? "default" : status === "down" ? "destructive" : "secondary"}>
            {config.label}
          </Badge>
        </div>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground mb-1">CPU</p>
            <p className="font-semibold text-foreground">{cpu.toFixed(1)}%</p>
          </div>
          <div>
            <p className="text-muted-foreground mb-1">Memory</p>
            <p className="font-semibold text-foreground">{memory.toFixed(1)}%</p>
          </div>
          <div>
            <p className="text-muted-foreground mb-1">Response</p>
            <p className="font-semibold text-foreground">{responseTime}ms</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
