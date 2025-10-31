import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ServiceCard } from "@/components/ServiceCard";
import { MetricsChart } from "@/components/MetricsChart";
import { AlertsList } from "@/components/AlertsList";
import { StatsOverview } from "@/components/StatsOverview";
import { Activity } from "lucide-react";
import { toast } from "sonner";

interface Service {
  id: string;
  name: string;
  description: string | null;
  status: "up" | "down" | "degraded";
  created_at: string;
}

interface Metric {
  id: string;
  service_id: string;
  cpu_usage: number | null;
  memory_usage: number | null;
  response_time: number | null;
  timestamp: string;
}

interface Alert {
  id: string;
  service_id: string;
  type: string;
  severity: "info" | "warning" | "critical";
  message: string;
  resolved: boolean;
  created_at: string;
}

const Index = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch initial data
  useEffect(() => {
    fetchData();
    seedMockData();
  }, []);

  // Set up real-time subscriptions
  useEffect(() => {
    const servicesChannel = supabase
      .channel("services-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "services",
        },
        () => {
          fetchServices();
        }
      )
      .subscribe();

    const metricsChannel = supabase
      .channel("metrics-changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "metrics",
        },
        () => {
          fetchMetrics();
        }
      )
      .subscribe();

    const alertsChannel = supabase
      .channel("alerts-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "alerts",
        },
        (payload) => {
          if (payload.eventType === "INSERT" && !payload.new.resolved) {
            toast.error(`New Alert: ${payload.new.message}`, {
              description: `Severity: ${payload.new.severity}`,
            });
          }
          fetchAlerts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(servicesChannel);
      supabase.removeChannel(metricsChannel);
      supabase.removeChannel(alertsChannel);
    };
  }, []);

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([fetchServices(), fetchMetrics(), fetchAlerts()]);
    setLoading(false);
  };

  const fetchServices = async () => {
    const { data, error } = await supabase.from("services").select("*").order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching services:", error);
      toast.error("Failed to fetch services");
      return;
    }

    setServices((data as Service[]) || []);
  };

  const fetchMetrics = async () => {
    const { data, error } = await supabase
      .from("metrics")
      .select("*")
      .order("timestamp", { ascending: false })
      .limit(100);

    if (error) {
      console.error("Error fetching metrics:", error);
      toast.error("Failed to fetch metrics");
      return;
    }

    setMetrics(data || []);
  };

  const fetchAlerts = async () => {
    const { data, error } = await supabase
      .from("alerts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("Error fetching alerts:", error);
      toast.error("Failed to fetch alerts");
      return;
    }

    setAlerts((data as Alert[]) || []);
  };

  const seedMockData = async () => {
    // Check if we already have services
    const { data: existingServices } = await supabase.from("services").select("id").limit(1);

    if (existingServices && existingServices.length > 0) {
      return; // Data already exists
    }

    // Create mock services
    const mockServices = [
      { name: "API Gateway", description: "Main API gateway service", status: "up" },
      { name: "Auth Service", description: "Authentication and authorization", status: "up" },
      { name: "Database", description: "Primary PostgreSQL database", status: "up" },
      { name: "Cache Service", description: "Redis caching layer", status: "degraded" },
      { name: "Payment Service", description: "Payment processing", status: "up" },
    ];

    const { data: createdServices, error: servicesError } = await supabase
      .from("services")
      .insert(mockServices)
      .select();

    if (servicesError) {
      console.error("Error creating mock services:", servicesError);
      return;
    }

    // Create mock metrics for each service
    if (createdServices) {
      for (const service of createdServices) {
        const metricsData = Array.from({ length: 20 }, (_, i) => ({
          service_id: service.id,
          cpu_usage: Math.random() * 100,
          memory_usage: Math.random() * 100,
          response_time: Math.floor(Math.random() * 500) + 50,
          timestamp: new Date(Date.now() - i * 5 * 60 * 1000).toISOString(),
        }));

        await supabase.from("metrics").insert(metricsData);

        // Create some alerts for services with issues
        if (service.status === "degraded") {
          await supabase.from("alerts").insert({
            service_id: service.id,
            type: "response_time",
            severity: "warning",
            message: `${service.name} response time above threshold`,
            threshold: 300,
            resolved: false,
          });
        }
      }
    }

    toast.success("Mock data loaded successfully");
    fetchData();
  };

  // Calculate stats
  const activeServices = services.filter((s) => s.status === "up").length;
  const activeAlerts = alerts.filter((a) => !a.resolved).length;
  const avgResponseTime =
    metrics.length > 0
      ? Math.round(metrics.reduce((sum, m) => sum + (m.response_time || 0), 0) / metrics.length)
      : 0;

  // Prepare chart data (last 20 data points)
  const chartData = metrics
    .slice(0, 20)
    .reverse()
    .map((m) => ({
      timestamp: new Date(m.timestamp).toLocaleTimeString(),
      cpu: m.cpu_usage || 0,
      memory: m.memory_usage || 0,
      responseTime: m.response_time || 0,
    }));

  // Get latest metrics for each service
  const getLatestMetrics = (serviceId: string) => {
    const serviceMetrics = metrics.filter((m) => m.service_id === serviceId);
    if (serviceMetrics.length === 0) {
      return { cpu: 0, memory: 0, responseTime: 0 };
    }
    const latest = serviceMetrics[0];
    return {
      cpu: latest.cpu_usage || 0,
      memory: latest.memory_usage || 0,
      responseTime: latest.response_time || 0,
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <Activity className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Cloud Monitoring Dashboard</h1>
          <p className="text-muted-foreground">Real-time monitoring for your microservices</p>
        </div>

        {/* Stats Overview */}
        <StatsOverview
          totalServices={services.length}
          activeServices={activeServices}
          activeAlerts={activeAlerts}
          avgResponseTime={avgResponseTime}
        />

        {/* Services Grid */}
        <div>
          <h2 className="text-xl font-semibold text-foreground mb-4">Services Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {services.map((service) => {
              const latestMetrics = getLatestMetrics(service.id);
              return (
                <ServiceCard
                  key={service.id}
                  name={service.name}
                  status={service.status}
                  description={service.description || undefined}
                  cpu={latestMetrics.cpu}
                  memory={latestMetrics.memory}
                  responseTime={latestMetrics.responseTime}
                />
              );
            })}
          </div>
        </div>

        {/* Metrics and Alerts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <MetricsChart data={chartData} title="System Performance Metrics" />
          </div>
          <div>
            <AlertsList alerts={alerts} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
