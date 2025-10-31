import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Server, AlertCircle, TrendingUp } from "lucide-react";

interface StatsOverviewProps {
  totalServices: number;
  activeServices: number;
  activeAlerts: number;
  avgResponseTime: number;
}

export function StatsOverview({ totalServices, activeServices, activeAlerts, avgResponseTime }: StatsOverviewProps) {
  const stats = [
    {
      title: "Total Services",
      value: totalServices,
      icon: Server,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Active Services",
      value: activeServices,
      icon: Activity,
      color: "text-success",
      bgColor: "bg-success/10",
    },
    {
      title: "Active Alerts",
      value: activeAlerts,
      icon: AlertCircle,
      color: "text-destructive",
      bgColor: "bg-destructive/10",
    },
    {
      title: "Avg Response Time",
      value: `${avgResponseTime}ms`,
      icon: TrendingUp,
      color: "text-warning",
      bgColor: "bg-warning/10",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.title} className="border-border bg-card hover:border-primary/50 transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stat.value}</div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
