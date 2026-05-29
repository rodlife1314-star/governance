import { useListWorkflows, getListWorkflowsQueryKey } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function Workflows() {
  const { data: workflows, isLoading } = useListWorkflows({}, { query: { queryKey: getListWorkflowsQueryKey({}) } });

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <h1 className="text-2xl font-bold tracking-widest text-primary">WORKFLOWS</h1>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
             <Skeleton key={i} className="h-20 w-full bg-muted rounded-none" />
          ))
        ) : workflows?.length ? (
          workflows.map(wf => (
            <Link key={wf.id} href={`/workflows/${wf.id}`} className="block">
              <Card className="bg-transparent border-border rounded-none shadow-none hover:border-primary hover:bg-primary/5 transition-colors cursor-pointer">
                <CardContent className="p-4 flex flex-col md:flex-row justify-between md:items-center gap-4">
                  <div>
                    <h3 className="text-lg font-bold text-primary mb-1 uppercase">{wf.name}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-1">{wf.description}</p>
                  </div>
                  <div className="flex items-center gap-4 text-xs">
                    <div className="px-2 py-1 border border-border bg-card uppercase">STATUS: {wf.status}</div>
                    <div className="px-2 py-1 border border-border bg-card uppercase">STEPS: {wf.completedSteps}/{wf.stepCount}</div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))
        ) : (
          <div className="py-12 text-center text-muted-foreground border border-dashed border-border">
            NO WORKFLOWS ACTIVE
          </div>
        )}
      </div>
    </div>
  );
}
