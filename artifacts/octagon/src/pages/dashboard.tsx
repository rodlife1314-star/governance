import { useHealthCheck, getHealthCheckQueryKey, useGetDashboardSummary, getGetDashboardSummaryQueryKey, useGetRoutingStats, getGetRoutingStatsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

export default function Dashboard() {
  const { data: health, isLoading: healthLoading } = useHealthCheck({ query: { queryKey: getHealthCheckQueryKey() } });
  const { data: summary, isLoading: summaryLoading } = useGetDashboardSummary({ query: { queryKey: getGetDashboardSummaryQueryKey() } });
  const { data: routing, isLoading: routingLoading } = useGetRoutingStats({ query: { queryKey: getGetRoutingStatsQueryKey() } });

  const chartData = routing ? [
    { name: "Local", value: routing.local, color: "hsl(120, 100%, 50%)" },
    { name: "Cloud", value: routing.cloud, color: "hsl(120, 100%, 30%)" },
    { name: "Hybrid", value: routing.hybrid, color: "hsl(120, 100%, 20%)" },
  ].filter(d => d.value > 0) : [];

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <h1 className="text-2xl font-bold tracking-widest text-primary">SYS_STATUS</h1>
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-none ${health?.status === 'ok' ? 'bg-primary animate-pulse' : 'bg-destructive'}`} />
          <span>{healthLoading ? "PINGING..." : (health?.status === 'ok' ? "SYSTEM ONLINE" : "SYSTEM DEGRADED")}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="MEMORY ENTRIES" value={summary?.totalMemoryEntries} loading={summaryLoading} />
        <StatCard title="DOCTRINE RULES" value={summary?.totalDoctrineRules} loading={summaryLoading} />
        <StatCard title="ACTIVE WORKFLOWS" value={summary?.activeWorkflows} loading={summaryLoading} />
        <StatCard title="SCENARIOS READY" value={summary?.readyScenarios} loading={summaryLoading} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="bg-transparent border-border rounded-none shadow-none">
          <CardHeader className="border-b border-border">
            <CardTitle className="text-sm tracking-widest text-primary font-normal">ROUTING DISTRIBUTION</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {routingLoading ? (
              <Skeleton className="h-[300px] w-full bg-muted rounded-none" />
            ) : chartData.length > 0 ? (
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={chartData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={2} dataKey="value">
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: 'black', border: '1px solid var(--color-border)', borderRadius: 0 }} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground border border-dashed border-border">
                NO ROUTING DATA
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ title, value, loading }: { title: string; value?: number; loading: boolean }) {
  return (
    <Card className="bg-transparent border-border rounded-none shadow-none">
      <CardHeader className="pb-2">
        <CardTitle className="text-xs text-muted-foreground tracking-widest font-normal">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-16 bg-muted rounded-none" />
        ) : (
          <div className="text-3xl font-bold text-primary">{value ?? 0}</div>
        )}
      </CardContent>
    </Card>
  );
}
