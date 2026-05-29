import { useListScenarios, getListScenariosQueryKey } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Scenarios() {
  const { data: scenarios, isLoading } = useListScenarios({ query: { queryKey: getListScenariosQueryKey() } });

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <h1 className="text-2xl font-bold tracking-widest text-primary">SCENARIOS</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
             <Skeleton key={i} className="h-32 w-full bg-muted rounded-none" />
          ))
        ) : scenarios?.length ? (
          scenarios.map(scenario => (
            <div key={scenario.id} className="p-4 border border-border hover:border-primary transition-colors">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-bold text-primary uppercase">{scenario.name}</h3>
                <div className={`px-2 py-1 border text-xs uppercase ${scenario.status === 'ready' || scenario.status === 'running' ? 'border-primary text-primary bg-primary/10' : 'border-border'}`}>
                  {scenario.status}
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-4">{scenario.description}</p>
              <div className="flex gap-2">
                {scenario.tags?.map(tag => (
                   <span key={tag} className="px-1 py-0.5 border border-border text-[10px] text-muted-foreground bg-card">
                     {tag}
                   </span>
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-12 text-center text-muted-foreground border border-dashed border-border">
            NO SCENARIOS LOADED
          </div>
        )}
      </div>
    </div>
  );
}
