import { useListRoutingDecisions, getListRoutingDecisionsQueryKey } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Routing() {
  const { data: decisions, isLoading } = useListRoutingDecisions({ query: { queryKey: getListRoutingDecisionsQueryKey() } });

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <h1 className="text-2xl font-bold tracking-widest text-primary">ROUTING_LOGS</h1>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
             <Skeleton key={i} className="h-16 w-full bg-muted rounded-none" />
          ))
        ) : decisions?.length ? (
          decisions.map(decision => (
            <div key={decision.id} className="p-4 border border-border hover:border-primary transition-colors flex flex-col gap-2">
              <div className="flex justify-between items-start">
                <div className="font-bold text-primary text-sm uppercase truncate">{decision.query}</div>
                <div className={`px-2 py-1 border text-xs uppercase ${decision.decision === 'local' ? 'border-primary text-primary' : 'border-border text-muted-foreground'}`}>
                  {decision.decision}
                </div>
              </div>
              <div className="text-xs text-muted-foreground line-clamp-2">{decision.reasoning}</div>
              <div className="flex gap-4 text-[10px] mt-2">
                <div>LOCAL_SCORE: {decision.localScore}</div>
                <div>CLOUD_SCORE: {decision.cloudScore}</div>
                {decision.latencyMs && <div>LATENCY: {decision.latencyMs}ms</div>}
              </div>
            </div>
          ))
        ) : (
          <div className="py-12 text-center text-muted-foreground border border-dashed border-border">
            NO ROUTING LOGS
          </div>
        )}
      </div>
    </div>
  );
}
